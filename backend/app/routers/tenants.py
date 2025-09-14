from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, models
from app.database import get_db
from app.auth.security import get_current_active_user
from ..models.user import User

router = APIRouter()

@router.post("/", response_model=schemas.Tenant)
def create_tenant(tenant: schemas.TenantCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Only superusers can create tenants
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to create tenants")
    db_tenant = models.Tenant(name=tenant.name)
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

@router.get("/", response_model=list[schemas.Tenant])
def list_tenants(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Only superusers can list all tenants
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to view tenants")
    return db.query(models.Tenant).all()