"""Admin portal API routes - superadmin only."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from ..database import get_db
from ..auth import get_current_user
from ..config import to_local_time, get_current_time
from .. import models


def format_local_time(dt: datetime) -> Optional[str]:
    """Format datetime to local timezone ISO string."""
    if dt is None:
        return None
    local_dt = to_local_time(dt)
    return local_dt.isoformat()

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def require_superadmin(current_user: models.User = Depends(get_current_user)):
    """Dependency to require superadmin access."""
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required"
        )
    return current_user


# ─── DASHBOARD OVERVIEW ─────────────────────────────────────────────────────────

@router.get("/dashboard")
async def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_superadmin)
):
    """Get overview stats for admin dashboard."""
    
    # Total counts
    total_clients = db.query(models.Client).count()
    total_users = db.query(models.User).count()
    total_query_runs = db.query(models.QueryRun).count()
    total_queries = db.query(models.QueryResult).count()
    
    # Active clients (have run queries in last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_clients = db.query(func.count(func.distinct(models.QueryRun.client_id))).filter(
        models.QueryRun.created_at >= thirty_days_ago
    ).scalar()
    
    # Recent signups (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_signups = db.query(models.Client).filter(
        models.Client.created_at >= seven_days_ago
    ).count()
    
    # Total API costs
    total_cost = db.query(func.sum(models.APIUsage.total_cost)).scalar() or 0.0
    monthly_cost = db.query(func.sum(models.APIUsage.total_cost)).filter(
        models.APIUsage.created_at >= thirty_days_ago
    ).scalar() or 0.0
    
    # Queries today
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    queries_today = db.query(models.QueryResult).filter(
        models.QueryResult.created_at >= today
    ).count()
    
    # Recent activity
    recent_runs = db.query(models.QueryRun).order_by(
        desc(models.QueryRun.created_at)
    ).limit(5).all()
    
    recent_activity = []
    for run in recent_runs:
        recent_activity.append({
            "id": run.id,
            "client_name": run.client.name if run.client else "Unknown",
            "user": run.created_by.username if run.created_by else "Unknown",
            "queries": run.total_queries,
            "created_at": format_local_time(run.created_at)
        })
    
    return {
        "total_clients": total_clients,
        "total_users": total_users,
        "total_query_runs": total_query_runs,
        "total_queries": total_queries,
        "active_clients": active_clients,
        "recent_signups": recent_signups,
        "total_cost": round(total_cost, 4),
        "monthly_cost": round(monthly_cost, 4),
        "queries_today": queries_today,
        "recent_activity": recent_activity
    }


# ─── CLIENTS MANAGEMENT ─────────────────────────────────────────────────────────

@router.get("/clients")
async def list_all_clients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_superadmin),
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None
):
    """List all clients with stats."""
    query = db.query(models.Client)
    
    if search:
        query = query.filter(
            models.Client.name.ilike(f"%{search}%") |
            models.Client.brand_name.ilike(f"%{search}%")
        )
    
    total = query.count()
    clients = query.order_by(desc(models.Client.created_at)).offset(skip).limit(limit).all()
    
    result = []
    for client in clients:
        # Get stats for each client
        user_count = db.query(models.User).filter(models.User.client_id == client.id).count()
        query_count = db.query(models.QueryRun).filter(models.QueryRun.client_id == client.id).count()
        
        # Get total cost for this client
        client_cost = db.query(func.sum(models.APIUsage.total_cost)).filter(
            models.APIUsage.client_id == client.id
        ).scalar() or 0.0
        
        # Last activity
        last_run = db.query(models.QueryRun).filter(
            models.QueryRun.client_id == client.id
        ).order_by(desc(models.QueryRun.created_at)).first()
        
        result.append({
            "id": client.id,
            "name": client.name,
            "brand_name": client.brand_name,
            "slug": client.slug,
            "industry": client.industry,
            "is_active": client.is_active,
            "created_at": format_local_time(client.created_at),
            "user_count": user_count,
            "query_runs": query_count,
            "total_cost": round(client_cost, 4),
            "last_activity": format_local_time(last_run.created_at) if last_run else None
        })
    
    return {
        "total": total,
        "clients": result
    }


@router.get("/clients/{client_id}")
async def get_client_details(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_superadmin)
):
    """Get detailed info for a specific client."""
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get all users
    users = db.query(models.User).filter(models.User.client_id == client_id).all()
    
    # Get competitors
    competitors = db.query(models.Competitor).filter(models.Competitor.client_id == client_id).all()
    
    # Get predefined queries
    queries = db.query(models.PredefinedQuery).filter(models.PredefinedQuery.client_id == client_id).all()
    
    # Get API usage breakdown
    usage_by_provider = db.query(
        models.APIUsage.provider,
        func.count(models.APIUsage.id).label("calls"),
        func.sum(models.APIUsage.total_tokens).label("tokens"),
        func.sum(models.APIUsage.total_cost).label("cost")
    ).filter(
        models.APIUsage.client_id == client_id
    ).group_by(models.APIUsage.provider).all()
    
    return {
        "client": {
            "id": client.id,
            "name": client.name,
            "brand_name": client.brand_name,
            "slug": client.slug,
            "industry": client.industry,
            "description": client.description,
            "primary_color": client.primary_color,
            "is_active": client.is_active,
            "created_at": format_local_time(client.created_at),
            "default_openai_model": client.default_openai_model,
            "default_gemini_model": client.default_gemini_model,
            "default_perplexity_model": client.default_perplexity_model,
        },
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "is_admin": u.is_admin,
                "is_active": u.is_active,
                "last_login": format_local_time(u.last_login),
                "created_at": format_local_time(u.created_at)
            } for u in users
        ],
        "competitors": [
            {"id": c.id, "name": c.name, "website": c.website} for c in competitors
        ],
        "predefined_queries": [
            {"id": q.id, "query_text": q.query_text, "category": q.category} for q in queries
        ],
        "usage_by_provider": [
            {
                "provider": u.provider,
                "calls": u.calls,
                "tokens": u.tokens or 0,
                "cost": round(u.cost or 0, 4)
            } for u in usage_by_provider
        ]
    }


@router.patch("/clients/{client_id}/toggle-active")
async def toggle_client_active(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_superadmin)
):
    """Toggle client active status."""
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client.is_active = not client.is_active
    db.commit()
    
    return {"success": True, "is_active": client.is_active}


# ─── USERS MANAGEMENT ───────────────────────────────────────────────────────────

@router.get("/users")
async def list_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_superadmin),
    skip: int = 0,
    limit: int = 50,
    client_id: Optional[int] = None,
    search: Optional[str] = None
):
    """List all users across all clients."""
    query = db.query(models.User)
    
    if client_id:
        query = query.filter(models.User.client_id == client_id)
    
    if search:
        query = query.filter(
            models.User.username.ilike(f"%{search}%") |
            models.User.email.ilike(f"%{search}%") |
            models.User.full_name.ilike(f"%{search}%")
        )
    
    total = query.count()
    users = query.order_by(desc(models.User.created_at)).offset(skip).limit(limit).all()
    
    result = []
    for user in users:
        # Count query runs by this user
        run_count = db.query(models.QueryRun).filter(
            models.QueryRun.created_by_id == user.id
        ).count()
        
        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "client_id": user.client_id,
            "client_name": user.client.name if user.client else "Unknown",
            "is_admin": user.is_admin,
            "is_superadmin": user.is_superadmin,
            "is_active": user.is_active,
            "query_runs": run_count,
            "last_login": format_local_time(user.last_login),
            "created_at": format_local_time(user.created_at)
        })
    
    return {
        "total": total,
        "users": result
    }


# ─── API USAGE & COSTS ──────────────────────────────────────────────────────────

@router.get("/api-usage")
async def get_api_usage(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_superadmin),
    days: int = 30,
    client_id: Optional[int] = None,
    provider: Optional[str] = None
):
    """Get API usage and costs."""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(models.APIUsage).filter(
        models.APIUsage.created_at >= start_date
    )
    
    if client_id:
        query = query.filter(models.APIUsage.client_id == client_id)
    if provider:
        query = query.filter(models.APIUsage.provider == provider)
    
    # Aggregate by provider
    by_provider = db.query(
        models.APIUsage.provider,
        func.count(models.APIUsage.id).label("calls"),
        func.sum(models.APIUsage.input_tokens).label("input_tokens"),
        func.sum(models.APIUsage.output_tokens).label("output_tokens"),
        func.sum(models.APIUsage.total_tokens).label("total_tokens"),
        func.sum(models.APIUsage.total_cost).label("total_cost")
    ).filter(
        models.APIUsage.created_at >= start_date
    )
    if client_id:
        by_provider = by_provider.filter(models.APIUsage.client_id == client_id)
    by_provider = by_provider.group_by(models.APIUsage.provider).all()
    
    # Aggregate by day
    daily_usage = db.query(
        func.date(models.APIUsage.created_at).label("date"),
        func.count(models.APIUsage.id).label("calls"),
        func.sum(models.APIUsage.total_cost).label("cost")
    ).filter(
        models.APIUsage.created_at >= start_date
    )
    if client_id:
        daily_usage = daily_usage.filter(models.APIUsage.client_id == client_id)
    daily_usage = daily_usage.group_by(func.date(models.APIUsage.created_at)).order_by("date").all()
    
    # Top clients by usage
    top_clients = db.query(
        models.APIUsage.client_id,
        models.Client.name.label("client_name"),
        func.count(models.APIUsage.id).label("calls"),
        func.sum(models.APIUsage.total_cost).label("cost")
    ).join(
        models.Client, models.APIUsage.client_id == models.Client.id
    ).filter(
        models.APIUsage.created_at >= start_date
    ).group_by(
        models.APIUsage.client_id, models.Client.name
    ).order_by(desc("cost")).limit(10).all()
    
    return {
        "period_days": days,
        "by_provider": [
            {
                "provider": p.provider,
                "calls": p.calls,
                "input_tokens": p.input_tokens or 0,
                "output_tokens": p.output_tokens or 0,
                "total_tokens": p.total_tokens or 0,
                "total_cost": round(p.total_cost or 0, 4)
            } for p in by_provider
        ],
        "daily_usage": [
            {
                "date": str(d.date),
                "calls": d.calls,
                "cost": round(d.cost or 0, 4)
            } for d in daily_usage
        ],
        "top_clients": [
            {
                "client_id": c.client_id,
                "client_name": c.client_name,
                "calls": c.calls,
                "cost": round(c.cost or 0, 4)
            } for c in top_clients
        ]
    }


# ─── ACTIVITY LOGS ──────────────────────────────────────────────────────────────

@router.get("/activity")
async def get_activity_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_superadmin),
    skip: int = 0,
    limit: int = 100,
    action: Optional[str] = None,
    client_id: Optional[int] = None,
    user_id: Optional[int] = None
):
    """Get activity logs."""
    query = db.query(models.ActivityLog)
    
    if action:
        query = query.filter(models.ActivityLog.action == action)
    if client_id:
        query = query.filter(models.ActivityLog.client_id == client_id)
    if user_id:
        query = query.filter(models.ActivityLog.user_id == user_id)
    
    total = query.count()
    logs = query.order_by(desc(models.ActivityLog.created_at)).offset(skip).limit(limit).all()
    
    result = []
    for log in logs:
        # Get user and client names
        user = db.query(models.User).filter(models.User.id == log.user_id).first() if log.user_id else None
        client = db.query(models.Client).filter(models.Client.id == log.client_id).first() if log.client_id else None
        
        result.append({
            "id": log.id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "user_id": log.user_id,
            "username": user.username if user else None,
            "client_id": log.client_id,
            "client_name": client.name if client else None,
            "ip_address": log.ip_address,
            "created_at": format_local_time(log.created_at)
        })
    
    return {
        "total": total,
        "logs": result
    }


# ─── SYSTEM STATS ───────────────────────────────────────────────────────────────

@router.get("/system-stats")
async def get_system_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_superadmin)
):
    """Get system-wide statistics."""
    
    # Query runs by status
    runs_by_status = db.query(
        models.QueryRun.status,
        func.count(models.QueryRun.id).label("count")
    ).group_by(models.QueryRun.status).all()
    
    # Results by source
    results_by_source = db.query(
        models.QueryResult.source,
        func.count(models.QueryResult.id).label("count")
    ).group_by(models.QueryResult.source).all()
    
    # Brand mentions
    total_results = db.query(models.QueryResult).count()
    brand_mentioned = db.query(models.QueryResult).filter(
        models.QueryResult.brand_mentioned == True
    ).count()
    
    # Average response time by source
    avg_response_time = db.query(
        models.QueryResult.source,
        func.avg(models.QueryResult.response_time).label("avg_time")
    ).group_by(models.QueryResult.source).all()
    
    # Clients by industry
    clients_by_industry = db.query(
        models.Client.industry,
        func.count(models.Client.id).label("count")
    ).filter(
        models.Client.industry.isnot(None)
    ).group_by(models.Client.industry).all()
    
    return {
        "runs_by_status": {r.status: r.count for r in runs_by_status},
        "results_by_source": {r.source: r.count for r in results_by_source},
        "brand_mention_rate": round(brand_mentioned / total_results * 100, 2) if total_results > 0 else 0,
        "avg_response_time": {r.source: round(r.avg_time, 3) if r.avg_time else 0 for r in avg_response_time},
        "clients_by_industry": {c.industry: c.count for c in clients_by_industry if c.industry}
    }

