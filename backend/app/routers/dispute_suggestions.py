from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.client import Client
from app.schemas.dispute_suggestion import DisputeSuggestion, DisputeSuggestionsResponse
from app.security import get_current_active_user
from app.services.dispute_suggestions import generate_dispute_suggestions
from app.models.user import User

router = APIRouter(prefix="/api/disputes", tags=["disputes"])


@router.get(
    "/suggestions",
    response_model=DisputeSuggestionsResponse,
    summary="Generate dispute suggestions for a client",
)
def get_dispute_suggestions(
    client_id: UUID = Query(..., description="Client identifier"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DisputeSuggestionsResponse:
    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.tenant_id == current_user.tenant_id)
        .first()
    )
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    suggestions, run = generate_dispute_suggestions(
        db,
        tenant_id=current_user.tenant_id,
        client_id=client_id,
    )
    return DisputeSuggestionsResponse(
        suggestions=[DisputeSuggestion(**payload) for payload in suggestions],
        run_id=str(run.id),
    )
