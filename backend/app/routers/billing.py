from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict, Any
import stripe
import os
from datetime import datetime, timezone

from app.database import get_db
from app.security import get_current_active_user
from ..models.user import User
from ..models.subscription import Subscription, Invoice, SubscriptionStatus, PlanType
from ..schemas.billing import CheckoutSessionCreate, SubscriptionResponse, InvoiceResponse

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter()

# Stripe pricing configuration
STRIPE_PRICES = {
    PlanType.STARTER: {
        "price_id": os.getenv("STRIPE_STARTER_PRICE_ID"),
        "monthly_price": 29.99,
        "seats": 1,
        "letter_credits": 100
    },
    PlanType.PROFESSIONAL: {
        "price_id": os.getenv("STRIPE_PROFESSIONAL_PRICE_ID"),
        "monthly_price": 79.99,
        "seats": 5,
        "letter_credits": 500
    },
    PlanType.ENTERPRISE: {
        "price_id": os.getenv("STRIPE_ENTERPRISE_PRICE_ID"),
        "monthly_price": 199.99,
        "seats": 25,
        "letter_credits": 2000
    }
}


@router.post("/create-checkout-session")
async def create_checkout_session(
    checkout_data: CheckoutSessionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe checkout session for subscription"""
    try:
        plan_config = STRIPE_PRICES.get(checkout_data.plan_type)
        if not plan_config:
            raise HTTPException(status_code=400, detail="Invalid plan type")

        # Create or get Stripe customer
        customer = stripe.Customer.create(
            email=current_user.email,
            name=f"{current_user.first_name} {current_user.last_name}",
            metadata={
                "tenant_id": str(current_user.tenant_id),
                "user_id": str(current_user.id)
            }
        )

        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=['card'],
            line_items=[{
                'price': plan_config["price_id"],
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{os.getenv('FRONTEND_URL')}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/billing/cancel",
            metadata={
                "tenant_id": str(current_user.tenant_id),
                "plan_type": checkout_data.plan_type.value
            }
        )

        return {"checkout_url": checkout_session.url}

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        await handle_successful_payment(session, db)
    
    elif event['type'] == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        await handle_invoice_payment_succeeded(invoice, db)
    
    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        await handle_subscription_updated(subscription, db)
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        await handle_subscription_canceled(subscription, db)

    return {"status": "success"}


async def handle_successful_payment(session: Dict[str, Any], db: Session):
    """Handle successful checkout session"""
    tenant_id = session['metadata']['tenant_id']
    plan_type = PlanType(session['metadata']['plan_type'])
    
    # Get subscription from Stripe
    stripe_subscription = stripe.Subscription.retrieve(session['subscription'])
    
    plan_config = STRIPE_PRICES[plan_type]
    
    # Create or update subscription in database
    subscription = Subscription(
        tenant_id=tenant_id,
        stripe_subscription_id=stripe_subscription.id,
        stripe_customer_id=session['customer'],
        stripe_price_id=stripe_subscription['items']['data'][0]['price']['id'],
        plan_type=plan_type,
        status=SubscriptionStatus.ACTIVE,
        monthly_price=plan_config["monthly_price"],
        seats_included=plan_config["seats"],
        letter_credits_included=plan_config["letter_credits"],
        current_period_start=stripe_subscription.current_period_start,
        current_period_end=stripe_subscription.current_period_end
    )
    
    db.add(subscription)
    db.commit()


async def handle_invoice_payment_succeeded(invoice_data: Dict[str, Any], db: Session):
    """Handle successful invoice payment"""
    # Update invoice status in database
    invoice = db.query(Invoice).filter(
        Invoice.stripe_invoice_id == invoice_data['id']
    ).first()
    
    if invoice:
        invoice.status = "paid"
        invoice.amount_paid = invoice_data['amount_paid'] / 100  # Convert from cents
        invoice.paid_at = datetime.now(timezone.utc)
        db.commit()


async def handle_subscription_updated(subscription_data: Dict[str, Any], db: Session):
    """Handle subscription updates"""
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_data['id']
    ).first()
    
    if subscription:
        subscription.status = SubscriptionStatus(subscription_data['status'])
        subscription.current_period_start = subscription_data['current_period_start']
        subscription.current_period_end = subscription_data['current_period_end']
        db.commit()


async def handle_subscription_canceled(subscription_data: Dict[str, Any], db: Session):
    """Handle subscription cancellation"""
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_data['id']
    ).first()
    
    if subscription:
        subscription.status = SubscriptionStatus.CANCELED
        subscription.is_active = False
        db.commit()


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_current_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current tenant's subscription"""
    subscription = db.query(Subscription).filter(
        Subscription.tenant_id == current_user.tenant_id,
        Subscription.is_active.is_(True)
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    return subscription


@router.get("/invoices", response_model=list[InvoiceResponse])
async def get_invoices(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get tenant's invoices"""
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == current_user.tenant_id
    ).order_by(Invoice.created_at.desc()).all()
    
    return invoices


@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel current subscription"""
    # Check permissions
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can cancel subscriptions")
    
    subscription = db.query(Subscription).filter(
        Subscription.tenant_id == current_user.tenant_id,
        Subscription.is_active.is_(True)
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    try:
        # Cancel in Stripe
        stripe.Subscription.delete(subscription.stripe_subscription_id)
        
        # Update in database
        subscription.status = SubscriptionStatus.CANCELED
        subscription.is_active = False
        db.commit()
        
        return {"message": "Subscription canceled successfully"}
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/usage")
async def get_usage_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current usage statistics"""
    subscription = db.query(Subscription).filter(
        Subscription.tenant_id == current_user.tenant_id,
        Subscription.is_active.is_(True)
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    # Calculate current usage
    active_users = db.query(User).filter(
        User.tenant_id == current_user.tenant_id,
        User.is_active.is_(True)
    ).count()
    
    return {
        "plan_type": subscription.plan_type,
        "seats_included": subscription.seats_included,
        "seats_used": active_users,
        "letter_credits_included": subscription.letter_credits_included,
        "letter_credits_used": subscription.letter_credits_used,
        "letter_credits_remaining": subscription.letter_credits_included - subscription.letter_credits_used,
        "current_period_end": subscription.current_period_end
    }

