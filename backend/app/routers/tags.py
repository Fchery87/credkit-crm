from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..models import Tag
from app.database import get_db
from app.security import get_current_active_user
from ..models.user import User

router = APIRouter()


@router.post("/", response_model=schemas.Tag)
def create_tag(tag: schemas.TagCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Check permissions: only admin and manager can create tags
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to create tags")

    db_tag = Tag(
        **tag.dict(),
        tenant_id=current_user.tenant_id
    )
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


@router.get("/", response_model=list[schemas.Tag])
def list_tags(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Tag).filter(Tag.tenant_id == current_user.tenant_id).all()


@router.get("/{tag_id}", response_model=schemas.Tag)
def get_tag(tag_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.tenant_id == current_user.tenant_id
    ).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.put("/{tag_id}", response_model=schemas.Tag)
def update_tag(tag_id: str, tag_update: schemas.TagUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.tenant_id == current_user.tenant_id
    ).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Check permissions: only admin and manager can update tags
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to update tags")

    for field, value in tag_update.dict(exclude_unset=True).items():
        setattr(tag, field, value)

    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}")
def delete_tag(tag_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.tenant_id == current_user.tenant_id
    ).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Check permissions: only admin can delete tags
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete tags")

    db.delete(tag)
    db.commit()
    return {"message": "Tag deleted successfully"}
