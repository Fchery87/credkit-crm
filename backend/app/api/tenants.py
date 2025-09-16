from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import schemas, models
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Tenant)
def create_tenant(tenant: schemas.TenantCreate, db: Session = Depends(get_db)):
    db_tenant = models.Tenant(name=tenant.name)
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant
