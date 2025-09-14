from sqlalchemy.orm import Session
from app import models, schemas
from app.auth.security import get_password_hash


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    # Create organization first
    db_org = models.Organization(name=user.organization_name)
    db.add(db_org)
    db.commit()
    db.refresh(db_org)

    # Then create user associated with the organization
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        organization_id=db_org.id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
