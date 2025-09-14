from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..models import Task
from app.database import get_db
from app.auth.security import get_current_active_user
from ..models.user import User
from .websocket import notify_clients

router = APIRouter()


@router.post("/", response_model=schemas.Task)
async def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Check permissions: only admin and manager can create tasks
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to create tasks")

    db_task = Task(
        **task.dict(),
        tenant_id=current_user.tenant_id,
        created_by=current_user.id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # Send real-time notification
    await notify_clients(str(current_user.tenant_id), "task_created", {
        "task": db_task.__dict__,
        "created_by": f"{current_user.first_name} {current_user.last_name}"
    })

    return db_task


@router.get(
    "/",
    response_model=list[schemas.Task],
    summary="List Tasks",
    description="""
    Retrieve a paginated list of tasks with advanced filtering and search capabilities.

    **Features:**
    - Full-text search across task titles
    - Filter by status, priority, and assignee
    - Sort by any field (created_at, due_date, priority, etc.)
    - Pagination support

    **Permissions:** All authenticated users can view tasks
    """,
    responses={
        200: {
            "description": "List of tasks retrieved successfully",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "title": "Follow up with client",
                            "description": "Call client to discuss credit report",
                            "status": "pending",
                            "priority": "high",
                            "due_date": "2024-01-15",
                            "assigned_to": "user-uuid",
                            "created_at": "2024-01-10T10:00:00Z"
                        }
                    ]
                }
            }
        },
        401: {"description": "Unauthorized - Invalid or missing token"},
        403: {"description": "Forbidden - Insufficient permissions"}
    }
)
def list_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    search: str = None,
    status: str = None,
    priority: str = None,
    assigned_to: str = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    limit: int = 50,
    offset: int = 0
):
    query = db.query(Task).filter(Task.tenant_id == current_user.tenant_id)

    # Apply filters
    if search:
        query = query.filter(Task.title.ilike(f"%{search}%"))
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)

    # Apply sorting
    sort_column = getattr(Task, sort_by, Task.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Apply pagination
    return query.offset(offset).limit(limit).all()


@router.get("/{task_id}", response_model=schemas.Task)
def get_task(task_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.tenant_id == current_user.tenant_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=schemas.Task)
async def update_task(task_id: str, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.tenant_id == current_user.tenant_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check permissions: only admin, manager, or task assignee can update
    if current_user.role not in ["admin", "manager"] and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")

    for field, value in task_update.dict(exclude_unset=True).items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    # Send real-time notification
    await notify_clients(str(current_user.tenant_id), "task_updated", {
        "task": task.__dict__,
        "updated_by": f"{current_user.first_name} {current_user.last_name}"
    })

    return task


@router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.tenant_id == current_user.tenant_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check permissions: only admin or task creator can delete
    if current_user.role not in ["admin"] and task.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}


@router.post(
    "/bulk-update",
    response_model=dict,
    summary="Bulk Update Tasks",
    description="""
    Update multiple tasks in a single request for improved efficiency.

    **Use Cases:**
    - Mark multiple tasks as completed
    - Reassign tasks to different users
    - Update priorities in bulk
    - Change due dates for multiple tasks

    **Request Body:** Array of update objects with task ID and fields to update
    **Permissions:** Admin and Manager roles only
    """,
    responses={
        200: {
            "description": "Tasks updated successfully",
            "content": {
                "application/json": {
                    "example": {"message": "Updated 5 tasks"}
                }
            }
        },
        403: {"description": "Forbidden - Insufficient permissions"}
    }
)
async def bulk_update_tasks(
    updates: list[dict],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk update multiple tasks"""
    # Check permissions: only admin and manager can bulk update
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized for bulk operations")

    updated_count = 0
    for update_data in updates:
        task_id = update_data.pop("id")
        task = db.query(Task).filter(
            Task.id == task_id,
            Task.tenant_id == current_user.tenant_id
        ).first()

        if task:
            for field, value in update_data.items():
                if hasattr(task, field):
                    setattr(task, field, value)
            updated_count += 1

    db.commit()
    return {"message": f"Updated {updated_count} tasks"}


@router.post("/bulk-delete", response_model=dict)
async def bulk_delete_tasks(
    task_ids: list[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk delete multiple tasks"""
    # Check permissions: only admin can bulk delete
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized for bulk delete")

    deleted_count = 0
    for task_id in task_ids:
        task = db.query(Task).filter(
            Task.id == task_id,
            Task.tenant_id == current_user.tenant_id
        ).first()

        if task:
            db.delete(task)
            deleted_count += 1

    db.commit()
    return {"message": f"Deleted {deleted_count} tasks"}