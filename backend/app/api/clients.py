from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import schemas, models
from app.database import get_db
import uuid

router = APIRouter()

@router.post("/", response_model=schemas.Client)
def create_client(tenant_id: uuid.UUID, client: schemas.ClientCreate, db: Session = Depends(get_db)):
    db_client = models.Client(**client.dict(), tenant_id=tenant_id)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.get("/", response_model=list[schemas.Client])
def list_clients(tenant_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(models.Client).filter(models.Client.tenant_id == tenant_id).all()
