"""Account management API routes - delete account, etc."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..auth import get_current_user, verify_password
from .. import models

router = APIRouter(prefix="/api/account", tags=["Account"])


class DeleteAccountRequest(BaseModel):
    """Request to delete account - requires password confirmation."""
    password: str
    confirm_text: str  # Must type "DELETE" to confirm


class DeleteAccountResponse(BaseModel):
    """Response after account deletion."""
    success: bool
    message: str


@router.post("/delete", response_model=DeleteAccountResponse)
async def delete_account(
    request: DeleteAccountRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Delete the current user's account and their entire company portal.
    This action is irreversible and will delete:
    - All users associated with the company
    - All competitors
    - All predefined queries
    - All query runs and results
    - The company itself
    """
    
    # Verify confirmation text
    if request.confirm_text != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please type 'DELETE' to confirm account deletion"
        )
    
    # Verify password
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    # Only admins can delete the entire portal
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can delete the company portal"
        )
    
    # Prevent superadmins from deleting via this endpoint (they should use admin tools)
    if current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin accounts cannot be deleted via this endpoint"
        )
    
    client_id = current_user.client_id
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Store the client name before deletion (session will be invalidated after delete)
    client_name = client.name
    
    try:
        # Delete in order to respect foreign key constraints
        
        # 1. Delete all query results for this client's query runs
        query_run_ids = db.query(models.QueryRun.id).filter(
            models.QueryRun.client_id == client_id
        ).all()
        query_run_ids = [r[0] for r in query_run_ids]
        
        if query_run_ids:
            db.query(models.QueryResult).filter(
                models.QueryResult.query_run_id.in_(query_run_ids)
            ).delete(synchronize_session=False)
        
        # 2. Delete all query runs
        db.query(models.QueryRun).filter(
            models.QueryRun.client_id == client_id
        ).delete(synchronize_session=False)
        
        # 3. Delete all predefined queries
        db.query(models.PredefinedQuery).filter(
            models.PredefinedQuery.client_id == client_id
        ).delete(synchronize_session=False)
        
        # 4. Delete all competitors
        db.query(models.Competitor).filter(
            models.Competitor.client_id == client_id
        ).delete(synchronize_session=False)
        
        # 5. Delete all users for this client
        db.query(models.User).filter(
            models.User.client_id == client_id
        ).delete(synchronize_session=False)
        
        # 6. Delete the client itself
        db.query(models.Client).filter(
            models.Client.id == client_id
        ).delete(synchronize_session=False)
        
        db.commit()
        
        return DeleteAccountResponse(
            success=True,
            message=f"Account and all data for '{client_name}' have been permanently deleted"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )


@router.get("/stats")
async def get_account_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get statistics about what will be deleted if the account is removed."""
    client_id = current_user.client_id
    
    # Count all related data
    users_count = db.query(models.User).filter(
        models.User.client_id == client_id
    ).count()
    
    competitors_count = db.query(models.Competitor).filter(
        models.Competitor.client_id == client_id
    ).count()
    
    queries_count = db.query(models.PredefinedQuery).filter(
        models.PredefinedQuery.client_id == client_id
    ).count()
    
    runs_count = db.query(models.QueryRun).filter(
        models.QueryRun.client_id == client_id
    ).count()
    
    # Count results
    query_run_ids = db.query(models.QueryRun.id).filter(
        models.QueryRun.client_id == client_id
    ).all()
    query_run_ids = [r[0] for r in query_run_ids]
    
    results_count = 0
    if query_run_ids:
        results_count = db.query(models.QueryResult).filter(
            models.QueryResult.query_run_id.in_(query_run_ids)
        ).count()
    
    return {
        "users": users_count,
        "competitors": competitors_count,
        "predefined_queries": queries_count,
        "query_runs": runs_count,
        "query_results": results_count,
        "total_records": users_count + competitors_count + queries_count + runs_count + results_count + 1  # +1 for client
    }

