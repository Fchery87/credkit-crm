from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import schemas, models
from app.database import get_db
import uuid

router = APIRouter()

@router.post("/", response_model=schemas.Dispute)
def create_dispute(tenant_id: uuid.UUID, dispute: schemas.DisputeCreate, db: Session = Depends(get_db)):
    db_dispute = models.Dispute(**dispute.dict(), tenant_id=tenant_id)
    db.add(db_dispute)
    db.commit()
    db.refresh(db_dispute)
    return db_dispute

@router.get("/", response_model=list[schemas.Dispute])
def list_disputes(tenant_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(models.Dispute).filter(models.Dispute.tenant_id == tenant_id).all()
