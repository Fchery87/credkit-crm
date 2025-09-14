from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
import uuid
from ..models.subscription import PlanType, SubscriptionStatus


class CheckoutSessionCreate(BaseModel):
    plan_type: PlanType


class SubscriptionResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    plan_type: PlanType
    status: SubscriptionStatus
    monthly_price: Decimal
    seats_included: int
    seats_used: int
    letter_credits_included: int
    letter_credits_used: int
    current_period_start: datetime | None
    current_period_end: datetime | None
    trial_end: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    id: uuid.UUID
    invoice_number: str
    amount_due: Decimal
    amount_paid: Decimal
    currency: str
    status: str
    due_date: datetime | None
    paid_at: datetime | None
    pdf_url: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class UsageResponse(BaseModel):
    plan_type: PlanType
    seats_included: int
    seats_used: int
    letter_credits_included: int
    letter_credits_used: int
    letter_credits_remaining: int
    current_period_end: datetime | None