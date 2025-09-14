from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..models import Stage
from app.database import get_db
from app.auth.security import get_current_active_user
from ..models.user import User

router = APIRouter()


@router.post("/", response_model=schemas.Stage)
def create_stage(stage: schemas.StageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Check permissions: only admin can create stages
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to create stages")

    db_stage = Stage(
        **stage.dict(),
        tenant_id=current_user.tenant_id
    )
    db.add(db_stage)
    db.commit()
    db.refresh(db_stage)
    return db_stage


@router.get("/", response_model=list[schemas.Stage])
def list_stages(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Stage).filter(Stage.tenant_id == current_user.tenant_id).order_by(Stage.order).all()


@router.get("/{stage_id}", response_model=schemas.Stage)
def get_stage(stage_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    stage = db.query(Stage).filter(
        Stage.id == stage_id,
        Stage.tenant_id == current_user.tenant_id
    ).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    return stage


@router.put("/{stage_id}", response_model=schemas.Stage)
def update_stage(stage_id: str, stage_update: schemas.StageUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    stage = db.query(Stage).filter(
        Stage.id == stage_id,
        Stage.tenant_id == current_user.tenant_id
    ).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")

    # Check permissions: only admin can update stages
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update stages")

    for field, value in stage_update.dict(exclude_unset=True).items():
        setattr(stage, field, value)

    db.commit()
    db.refresh(stage)
    return stage


@router.delete("/{stage_id}")
def delete_stage(stage_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    stage = db.query(Stage).filter(
        Stage.id == stage_id,
        Stage.tenant_id == current_user.tenant_id
    ).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")

    # Check permissions: only admin can delete stages
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete stages")

    db.delete(stage)
    db.commit()
    return {"message": "Stage deleted successfully"}