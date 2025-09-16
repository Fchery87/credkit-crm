from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..models import Automation
from app.database import get_db
from app.security import get_current_active_user
from ..models.user import User

router = APIRouter()


@router.post("/", response_model=schemas.Automation)
def create_automation(automation: schemas.AutomationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Check permissions: only admin can create automations
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to create automations")

    db_automation = Automation(
        **automation.dict(),
        tenant_id=current_user.tenant_id,
        created_by=current_user.id
    )
    db.add(db_automation)
    db.commit()
    db.refresh(db_automation)
    return db_automation


@router.get("/", response_model=list[schemas.Automation])
def list_automations(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Automation).filter(Automation.tenant_id == current_user.tenant_id).all()


@router.get("/{automation_id}", response_model=schemas.Automation)
def get_automation(automation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.tenant_id == current_user.tenant_id
    ).first()
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    return automation


@router.put("/{automation_id}", response_model=schemas.Automation)
def update_automation(automation_id: str, automation_update: schemas.AutomationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.tenant_id == current_user.tenant_id
    ).first()
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")

    # Check permissions: only admin can update automations
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update automations")

    for field, value in automation_update.dict(exclude_unset=True).items():
        setattr(automation, field, value)

    db.commit()
    db.refresh(automation)
    return automation


@router.delete("/{automation_id}")
def delete_automation(automation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.tenant_id == current_user.tenant_id
    ).first()
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")

    # Check permissions: only admin can delete automations
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete automations")

    db.delete(automation)
    db.commit()
    return {"message": "Automation deleted successfully"}
