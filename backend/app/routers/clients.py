from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, models
from app.database import get_db
from app.auth.security import get_current_active_user
from ..models.user import User

router = APIRouter()

@router.post("/", response_model=schemas.Client)
def create_client(client: schemas.ClientCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Check permissions: only admin and manager can create clients
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to create clients")
    db_client = models.Client(**client.dict(), tenant_id=current_user.tenant_id)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.get("/", response_model=list[schemas.Client])
def list_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    search: str = None,
    stage_id: str = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    limit: int = 50,
    offset: int = 0
):
    query = db.query(models.Client).filter(models.Client.tenant_id == current_user.tenant_id)

    # Apply filters
    if search:
        query = query.filter(
            (models.Client.first_name.ilike(f"%{search}%")) |
            (models.Client.last_name.ilike(f"%{search}%")) |
            (models.Client.email.ilike(f"%{search}%"))
        )
    if stage_id:
        query = query.filter(models.Client.stage_id == stage_id)

    # Apply sorting
    sort_column = getattr(models.Client, sort_by, models.Client.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Apply pagination
    return query.offset(offset).limit(limit).all()


@router.post("/bulk-update", response_model=dict)
async def bulk_update_clients(
    updates: list[dict],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk update multiple clients"""
    # Check permissions: only admin and manager can bulk update
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized for bulk operations")

    updated_count = 0
    for update_data in updates:
        client_id = update_data.pop("id")
        client = db.query(models.Client).filter(
            models.Client.id == client_id,
            models.Client.tenant_id == current_user.tenant_id
        ).first()

        if client:
            for field, value in update_data.items():
                if hasattr(client, field):
                    setattr(client, field, value)
            updated_count += 1

    db.commit()
    return {"message": f"Updated {updated_count} clients"}


@router.post("/bulk-stage-update", response_model=dict)
async def bulk_update_client_stages(
    client_ids: list[str],
    stage_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk update client stages"""
    # Check permissions: only admin and manager can bulk update
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized for bulk operations")

    updated_count = 0
    for client_id in client_ids:
        client = db.query(models.Client).filter(
            models.Client.id == client_id,
            models.Client.tenant_id == current_user.tenant_id
        ).first()

        if client:
            client.stage_id = stage_id
            updated_count += 1

    db.commit()
    return {"message": f"Updated {updated_count} clients to new stage"}