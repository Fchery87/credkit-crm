from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_active_user
from ..models.dispute_case import DisputeCase as DisputeCaseModel
from ..models.dispute_item import DisputeItem as DisputeItemModel
from ..models.generated_letter import GeneratedLetter as GeneratedLetterModel
from ..models.suggestion_run import (
    SuggestionRun as SuggestionRunModel,
    SuggestionEngine,
    SuggestionRunStatus,
)
from ..models.user import User
from ..schemas.suggestion_run import (
    SuggestionRun as SuggestionRunSchema,
    SuggestionRunCreate,
    SuggestionRunUpdate,
)

router = APIRouter()


def _get_case(db: Session, tenant_id: uuid.UUID, case_id: uuid.UUID) -> DisputeCaseModel:
    case = (
        db.query(DisputeCaseModel)
        .filter(
            DisputeCaseModel.id == case_id,
            DisputeCaseModel.tenant_id == tenant_id,
            DisputeCaseModel.deleted_at.is_(None),
        )
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="Dispute case not found")
    return case


def _ensure_item(
    db: Session, tenant_id: uuid.UUID, case_id: uuid.UUID, item_id: uuid.UUID | None
) -> DisputeItemModel | None:
    if item_id is None:
        return None
    item = (
        db.query(DisputeItemModel)
        .filter(
            DisputeItemModel.id == item_id,
            DisputeItemModel.case_id == case_id,
            DisputeItemModel.tenant_id == tenant_id,
            DisputeItemModel.deleted_at.is_(None),
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Dispute item not found for this case")
    return item


def _ensure_letter(
    db: Session, tenant_id: uuid.UUID, case_id: uuid.UUID, letter_id: uuid.UUID | None
) -> GeneratedLetterModel | None:
    if letter_id is None:
        return None
    letter = (
        db.query(GeneratedLetterModel)
        .filter(
            GeneratedLetterModel.id == letter_id,
            GeneratedLetterModel.case_id == case_id,
            GeneratedLetterModel.tenant_id == tenant_id,
            GeneratedLetterModel.deleted_at.is_(None),
        )
        .first()
    )
    if not letter:
        raise HTTPException(status_code=404, detail="Generated letter not found for this case")
    return letter


@router.post("/", response_model=SuggestionRunSchema, status_code=status.HTTP_201_CREATED)
def create_suggestion_run(
    payload: SuggestionRunCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    case = _get_case(db, current_user.tenant_id, payload.case_id)
    item = _ensure_item(db, current_user.tenant_id, case.id, payload.item_id)
    letter = _ensure_letter(db, current_user.tenant_id, case.id, payload.letter_id)

    started_at = payload.started_at
    if payload.status == SuggestionRunStatus.RUNNING and started_at is None:
        started_at = datetime.now(timezone.utc)

    suggestion_run = SuggestionRunModel(
        tenant_id=case.tenant_id,
        client_id=case.client_id,
        case_id=case.id,
        item_id=item.id if item else None,
        letter_id=letter.id if letter else None,
        engine=payload.engine,
        status=payload.status,
        prompt=payload.prompt,
        result=payload.result,
        suggestions=payload.suggestions,
        score=payload.score,
        started_at=started_at,
        completed_at=payload.completed_at,
        error=payload.error,
    )

    db.add(suggestion_run)
    case.last_activity_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(suggestion_run)
    return suggestion_run


@router.get("/", response_model=list[SuggestionRunSchema])
def list_suggestion_runs(
    case_id: uuid.UUID | None = None,
    item_id: uuid.UUID | None = None,
    status_filter: SuggestionRunStatus | None = None,
    engine: SuggestionEngine | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(SuggestionRunModel).filter(
        SuggestionRunModel.tenant_id == current_user.tenant_id,
        SuggestionRunModel.deleted_at.is_(None),
    )

    if case_id:
        query = query.filter(SuggestionRunModel.case_id == case_id)
    if item_id:
        query = query.filter(SuggestionRunModel.item_id == item_id)
    if status_filter:
        query = query.filter(SuggestionRunModel.status == status_filter)
    if engine:
        query = query.filter(SuggestionRunModel.engine == engine)

    return (
        query.order_by(SuggestionRunModel.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/{run_id}", response_model=SuggestionRunSchema)
def get_suggestion_run(
    run_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    run = (
        db.query(SuggestionRunModel)
        .filter(
            SuggestionRunModel.id == run_id,
            SuggestionRunModel.tenant_id == current_user.tenant_id,
            SuggestionRunModel.deleted_at.is_(None),
        )
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Suggestion run not found")
    return run


@router.put("/{run_id}", response_model=SuggestionRunSchema)
def update_suggestion_run(
    run_id: uuid.UUID,
    payload: SuggestionRunUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    run = (
        db.query(SuggestionRunModel)
        .filter(
            SuggestionRunModel.id == run_id,
            SuggestionRunModel.tenant_id == current_user.tenant_id,
            SuggestionRunModel.deleted_at.is_(None),
        )
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Suggestion run not found")

    case = _get_case(db, current_user.tenant_id, run.case_id)

    if payload.item_id is not None:
        _ensure_item(db, current_user.tenant_id, case.id, payload.item_id)
    if payload.letter_id is not None:
        _ensure_letter(db, current_user.tenant_id, case.id, payload.letter_id)

    data = payload.dict(exclude_unset=True)

    if "status" in data and data["status"] == SuggestionRunStatus.COMPLETED:
        data.setdefault("completed_at", datetime.now(timezone.utc))
    if "status" in data and data["status"] == SuggestionRunStatus.RUNNING:
        data.setdefault("started_at", datetime.now(timezone.utc))

    for field, value in data.items():
        setattr(run, field, value)

    case.last_activity_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(run)
    return run


@router.delete("/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_suggestion_run(
    run_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    run = (
        db.query(SuggestionRunModel)
        .filter(
            SuggestionRunModel.id == run_id,
            SuggestionRunModel.tenant_id == current_user.tenant_id,
            SuggestionRunModel.deleted_at.is_(None),
        )
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Suggestion run not found")

    case = _get_case(db, current_user.tenant_id, run.case_id)
    run.deleted_at = datetime.now(timezone.utc)
    case.last_activity_at = run.deleted_at

    db.commit()
    return None

