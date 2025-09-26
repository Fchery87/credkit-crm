from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.security import get_current_active_user
from ..models.user import User
from ..models.audit_log import AuditLog, DataAccessLog, ComplianceEvent, AuditAction, AuditResourceType
from ..middleware.audit import ComplianceLogger

router = APIRouter()


@router.get("/audit-logs")
async def get_audit_logs(
    action: Optional[AuditAction] = None,
    resource_type: Optional[AuditResourceType] = None,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get audit logs for compliance reporting"""
    
    # Only admins can access audit logs
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(AuditLog).filter(AuditLog.tenant_id == current_user.tenant_id)
    
    # Apply filters
    if action:
        query = query.filter(AuditLog.action == action)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)
    
    # Order by most recent first
    query = query.order_by(AuditLog.created_at.desc())
    
    # Apply pagination
    audit_logs = query.offset(offset).limit(limit).all()
    
    # Log this compliance data access
    await ComplianceLogger.log_data_access(
        tenant_id=str(current_user.tenant_id),
        user_id=str(current_user.id),
        resource_type=AuditResourceType.USER,
        resource_id="audit_logs",
        fields_accessed=["audit_logs"],
        access_reason="Compliance audit review"
    )
    
    return {
        "audit_logs": audit_logs,
        "total_count": query.count(),
        "filters_applied": {
            "action": action,
            "resource_type": resource_type,
            "user_id": user_id,
            "date_range": f"{start_date} to {end_date}" if start_date or end_date else None
        }
    }


@router.get("/data-access-logs")
async def get_data_access_logs(
    resource_type: Optional[AuditResourceType] = None,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get data access logs for sensitive data monitoring"""
    
    # Only admins can access data access logs
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(DataAccessLog).filter(DataAccessLog.tenant_id == current_user.tenant_id)
    
    # Apply filters
    if resource_type:
        query = query.filter(DataAccessLog.resource_type == resource_type)
    if user_id:
        query = query.filter(DataAccessLog.user_id == user_id)
    if start_date:
        query = query.filter(DataAccessLog.created_at >= start_date)
    if end_date:
        query = query.filter(DataAccessLog.created_at <= end_date)
    
    # Order by most recent first
    query = query.order_by(DataAccessLog.created_at.desc())
    
    # Apply pagination
    access_logs = query.offset(offset).limit(limit).all()
    
    return {
        "access_logs": access_logs,
        "total_count": query.count()
    }


@router.get("/compliance-events")
async def get_compliance_events(
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    resolved: Optional[bool] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get compliance events"""
    
    # Only admins can access compliance events
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(ComplianceEvent).filter(ComplianceEvent.tenant_id == current_user.tenant_id)
    
    # Apply filters
    if event_type:
        query = query.filter(ComplianceEvent.event_type == event_type)
    if severity:
        query = query.filter(ComplianceEvent.severity == severity)
    if resolved is not None:
        if resolved:
            query = query.filter(ComplianceEvent.resolved_at.isnot(None))
        else:
            query = query.filter(ComplianceEvent.resolved_at.is_(None))
    if start_date:
        query = query.filter(ComplianceEvent.created_at >= start_date)
    if end_date:
        query = query.filter(ComplianceEvent.created_at <= end_date)
    
    # Order by most recent first
    query = query.order_by(ComplianceEvent.created_at.desc())
    
    # Apply pagination
    events = query.offset(offset).limit(limit).all()
    
    return {
        "compliance_events": events,
        "total_count": query.count()
    }


@router.post("/export-audit-data")
async def export_audit_data(
    start_date: datetime,
    end_date: datetime,
    format: str = "csv",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export audit data for compliance reporting"""
    
    # Only admins can export audit data
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Validate date range (max 1 year)
    if (end_date - start_date).days > 365:
        raise HTTPException(status_code=400, detail="Date range cannot exceed 1 year")
    
    # Get audit logs for the period
    audit_logs = db.query(AuditLog).filter(
        AuditLog.tenant_id == current_user.tenant_id,
        AuditLog.created_at >= start_date,
        AuditLog.created_at <= end_date
    ).order_by(AuditLog.created_at.desc()).all()
    
    # Log this export action
    await ComplianceLogger.log_compliance_event(
        tenant_id=str(current_user.tenant_id),
        event_type="AUDIT_EXPORT",
        title="Audit Data Export",
        description=f"User {current_user.email} exported audit data from {start_date} to {end_date}",
        severity="INFO",
        user_id=str(current_user.id),
        event_data={
            "export_format": format,
            "date_range": f"{start_date} to {end_date}",
            "record_count": len(audit_logs)
        }
    )
    
    if format.lower() == "csv":
        # Generate CSV content
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow([
            "Timestamp", "User Email", "Action", "Resource Type", 
            "Resource ID", "IP Address", "Description"
        ])
        
        # Write data
        for log in audit_logs:
            writer.writerow([
                log.created_at.isoformat(),
                log.user_email or "System",
                log.action.value,
                log.resource_type.value,
                log.resource_id or "",
                log.ip_address or "",
                log.description or ""
            ])
        
        csv_content = output.getvalue()
        output.close()
        
        return {
            "format": "csv",
            "content": csv_content,
            "filename": f"audit_export_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}.csv",
            "record_count": len(audit_logs)
        }
    
    else:
        # Return JSON format
        return {
            "format": "json",
            "data": [
                {
                    "timestamp": log.created_at.isoformat(),
                    "user_email": log.user_email,
                    "action": log.action.value,
                    "resource_type": log.resource_type.value,
                    "resource_id": log.resource_id,
                    "ip_address": log.ip_address,
                    "description": log.description,
                    "metadata": log.event_metadata
                }
                for log in audit_logs
            ],
            "record_count": len(audit_logs)
        }


@router.post("/gdpr-request")
async def handle_gdpr_request(
    client_email: str,
    request_type: str,  # "access", "delete", "portability"
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Handle GDPR data requests"""
    
    # Only admins can handle GDPR requests
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Log the GDPR request
    await ComplianceLogger.log_compliance_event(
        tenant_id=str(current_user.tenant_id),
        event_type="GDPR_REQUEST",
        title=f"GDPR {request_type.upper()} Request",
        description=f"GDPR {request_type} request received for {client_email}",
        severity="WARNING",
        user_id=str(current_user.id),
        response_required=True,
        event_data={
            "request_type": request_type,
            "client_email": client_email,
            "requested_by": current_user.email
        }
    )
    
    return {
        "message": f"GDPR {request_type} request logged and will be processed within 30 days",
        "request_type": request_type,
        "client_email": client_email,
        "estimated_completion": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    }


