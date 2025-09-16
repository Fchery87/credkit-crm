from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import schemas, models
from app.database import get_db
from app.security import get_current_active_user
from ..models.user import User

router = APIRouter()

@router.post("/", response_model=schemas.Dispute)
def create_dispute(dispute: schemas.DisputeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_dispute = models.Dispute(**dispute.dict(), tenant_id=current_user.tenant_id)
    db.add(db_dispute)
    db.commit()
    db.refresh(db_dispute)
    return db_dispute

@router.get("/", response_model=list[schemas.Dispute])
def list_disputes(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(models.Dispute).filter(models.Dispute.tenant_id == current_user.tenant_id).all()
