from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..models import Reminder
from app.database import get_db
from app.auth.security import get_current_active_user
from ..models.user import User

router = APIRouter()


@router.post("/", response_model=schemas.Reminder)
def create_reminder(reminder: schemas.ReminderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Check permissions: only admin and manager can create reminders
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to create reminders")

    db_reminder = Reminder(
        **reminder.dict(),
        tenant_id=current_user.tenant_id
    )
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder


@router.get("/", response_model=list[schemas.Reminder])
def list_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    status: str = None,
    reminder_type: str = None,
    upcoming_only: bool = False,
    sort_by: str = "scheduled_at",
    sort_order: str = "asc",
    limit: int = 50,
    offset: int = 0
):
    from datetime import datetime
    query = db.query(Reminder).filter(Reminder.tenant_id == current_user.tenant_id)

    # Apply filters
    if status:
        query = query.filter(Reminder.status == status)
    if reminder_type:
        query = query.filter(Reminder.reminder_type == reminder_type)
    if upcoming_only:
        query = query.filter(Reminder.scheduled_at > datetime.utcnow())

    # Apply sorting
    sort_column = getattr(Reminder, sort_by, Reminder.scheduled_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Apply pagination
    return query.offset(offset).limit(limit).all()


@router.get("/{reminder_id}", response_model=schemas.Reminder)
def get_reminder(reminder_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.tenant_id == current_user.tenant_id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder


@router.put("/{reminder_id}", response_model=schemas.Reminder)
def update_reminder(reminder_id: str, reminder_update: schemas.ReminderUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.tenant_id == current_user.tenant_id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    # Check permissions: only admin, manager, or reminder creator can update
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to update reminders")

    for field, value in reminder_update.dict(exclude_unset=True).items():
        setattr(reminder, field, value)

    db.commit()
    db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.tenant_id == current_user.tenant_id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    # Check permissions: only admin can delete reminders
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete reminders")

    db.delete(reminder)
    db.commit()
    return {"message": "Reminder deleted successfully"}