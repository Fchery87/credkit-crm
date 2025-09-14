from sqlalchemy.orm import Session
from . import models, schemas
from .security import get_password_hash


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate, tenant_id: str = None):
    # If no tenant_id provided, create a new tenant
    if not tenant_id:
        db_tenant = models.Tenant(name=user.organization_name)  # Use org name as tenant name
        db.add(db_tenant)
        db.commit()
        db.refresh(db_tenant)
        tenant_id = db_tenant.id

    # Create organization
    db_org = models.Organization(name=user.organization_name)
    db.add(db_org)
    db.commit()
    db.refresh(db_org)

    # Check if this is the first user in the tenant
    existing_users = db.query(models.User).filter(models.User.tenant_id == tenant_id).count()
    role = "admin" if existing_users == 0 else "user"

    # Create user associated with the tenant and organization
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        tenant_id=tenant_id,
        organization_id=db_org.id,
        role=role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user