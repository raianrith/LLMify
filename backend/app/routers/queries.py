"""Query execution and results API routes."""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..llm_service import LLMService, AnalysisService
from ..logging_utils import log_api_usage, log_activity
from .. import models, schemas

router = APIRouter(prefix="/api/queries", tags=["Queries"])


def get_client_competitors(db: Session, client_id: int) -> List[dict]:
    """Get list of competitor data (name and aliases) for a client."""
    competitors = db.query(models.Competitor).filter(
        models.Competitor.client_id == client_id,
        models.Competitor.is_active == True
    ).all()
    return [{"name": c.name, "aliases": c.aliases or ""} for c in competitors]


def process_query_run(
    db: Session,
    query_run_id: int,
    queries: List[str],
    brand_name: str,
    brand_aliases: str,
    competitors: List[dict],  # List of {"name": str, "aliases": str}
    openai_model: str,
    gemini_model: str,
    perplexity_model: str,
    client_id: int,
    user_id: int
):
    """Background task to process a query run."""
    # Get fresh db session for background task
    from ..database import SessionLocal
    db = SessionLocal()
    
    try:
        # Get query run
        query_run = db.query(models.QueryRun).filter(
            models.QueryRun.id == query_run_id
        ).first()
        
        if not query_run:
            return
        
        # Update status
        query_run.status = "running"
        db.commit()
        
        # Log activity
        log_activity(
            db=db,
            action="query_run",
            user_id=user_id,
            client_id=client_id,
            resource_type="query_run",
            resource_id=query_run_id,
            details={"queries_count": len(queries), "status": "started"}
        )
        
        # Initialize services
        llm_service = LLMService(
            openai_model=openai_model,
            gemini_model=gemini_model,
            perplexity_model=perplexity_model
        )
        analysis_service = AnalysisService(brand_name, competitors, brand_aliases)
        
        # Process queries
        completed = 0
        
        def update_progress(current, total):
            nonlocal completed
            completed = current
            query_run.completed_queries = current
            db.commit()
        
        results = llm_service.process_queries_parallel(
            queries,
            max_workers=6,
            delay=0.1,
            progress_callback=update_progress
        )
        
        # Save results with analysis and log API usage
        for result in results:
            # Analyze response
            analysis = analysis_service.analyze_response(
                result["query"],
                result["source"],
                result["response"]
            )
            
            # Create result record
            query_result = models.QueryResult(
                query_run_id=query_run_id,
                query_text=result["query"],
                source=result["source"],
                response=result["response"],
                response_time=result["response_time"],
                **analysis
            )
            db.add(query_result)
            
            # Log API usage
            model_used = openai_model if result["source"] == "OpenAI" else (
                gemini_model if result["source"] == "Gemini" else perplexity_model
            )
            log_api_usage(
                db=db,
                client_id=client_id,
                user_id=user_id,
                provider=result["source"],
                model=model_used,
                query=result["query"],
                response=result["response"],
                response_time_ms=int(result["response_time"] * 1000),
                query_run_id=query_run_id
            )
        
        # Update query run status
        query_run.status = "completed"
        query_run.completed_at = datetime.utcnow()
        query_run.completed_queries = len(results)
        db.commit()
        
        # Log completion
        log_activity(
            db=db,
            action="query_run_completed",
            user_id=user_id,
            client_id=client_id,
            resource_type="query_run",
            resource_id=query_run_id,
            details={"results_count": len(results), "status": "completed"}
        )
        
    except Exception as e:
        # Update status to failed
        query_run = db.query(models.QueryRun).filter(
            models.QueryRun.id == query_run_id
        ).first()
        if query_run:
            query_run.status = "failed"
            db.commit()
        raise e
    finally:
        db.close()


@router.post("/run", response_model=schemas.QueryRunResponse)
async def create_query_run(
    run_data: schemas.QueryRunCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create and start a new query run."""
    # Get client info
    client = db.query(models.Client).filter(
        models.Client.id == current_user.client_id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Get competitors
    competitors = get_client_competitors(db, client.id)
    
    # Create query run record
    query_run = models.QueryRun(
        client_id=client.id,
        created_by_id=current_user.id,
        name=run_data.name,
        description=run_data.description,
        run_type=run_data.run_type,
        openai_model=run_data.openai_model,
        gemini_model=run_data.gemini_model,
        perplexity_model=run_data.perplexity_model,
        status="pending",
        total_queries=len(run_data.queries) * 3  # 3 LLMs per query
    )
    db.add(query_run)
    db.commit()
    db.refresh(query_run)
    
    # Start background task
    background_tasks.add_task(
        process_query_run,
        db,
        query_run.id,
        run_data.queries,
        client.brand_name,
        client.brand_aliases or "",
        competitors,
        run_data.openai_model,
        run_data.gemini_model,
        run_data.perplexity_model,
        client.id,
        current_user.id
    )
    
    return query_run


@router.post("/run-predefined", response_model=schemas.QueryRunResponse)
async def run_predefined_queries(
    background_tasks: BackgroundTasks,
    name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Run all predefined queries for the current client."""
    # Get predefined queries
    predefined = db.query(models.PredefinedQuery).filter(
        models.PredefinedQuery.client_id == current_user.client_id,
        models.PredefinedQuery.is_active == True
    ).order_by(models.PredefinedQuery.order_index).all()
    
    if not predefined:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No predefined queries found for this client"
        )
    
    queries = [q.query_text for q in predefined]
    
    # Get client info
    client = db.query(models.Client).filter(
        models.Client.id == current_user.client_id
    ).first()
    
    competitors = get_client_competitors(db, client.id)
    
    # Create query run
    query_run = models.QueryRun(
        client_id=client.id,
        created_by_id=current_user.id,
        name=name or f"Predefined Queries - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        run_type="predefined",
        openai_model=client.default_openai_model,
        gemini_model=client.default_gemini_model,
        perplexity_model=client.default_perplexity_model,
        status="pending",
        total_queries=len(queries) * 3
    )
    db.add(query_run)
    db.commit()
    db.refresh(query_run)
    
    # Start background task
    background_tasks.add_task(
        process_query_run,
        db,
        query_run.id,
        queries,
        client.brand_name,
        client.brand_aliases or "",
        competitors,
        client.default_openai_model,
        client.default_gemini_model,
        client.default_perplexity_model,
        client.id,
        current_user.id
    )
    
    return query_run


@router.get("/runs", response_model=List[schemas.QueryRunResponse])
async def list_query_runs(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List query runs for the current client."""
    return db.query(models.QueryRun).filter(
        models.QueryRun.client_id == current_user.client_id
    ).order_by(models.QueryRun.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/runs/{run_id}", response_model=schemas.QueryRunWithResults)
async def get_query_run(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a specific query run with results."""
    query_run = db.query(models.QueryRun).filter(
        models.QueryRun.id == run_id,
        models.QueryRun.client_id == current_user.client_id
    ).first()
    
    if not query_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query run not found"
        )
    
    return query_run


@router.get("/runs/{run_id}/status")
async def get_query_run_status(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get the status of a query run."""
    query_run = db.query(models.QueryRun).filter(
        models.QueryRun.id == run_id,
        models.QueryRun.client_id == current_user.client_id
    ).first()
    
    if not query_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query run not found"
        )
    
    return {
        "id": query_run.id,
        "status": query_run.status,
        "total_queries": query_run.total_queries,
        "completed_queries": query_run.completed_queries,
        "progress": (query_run.completed_queries / query_run.total_queries * 100) if query_run.total_queries > 0 else 0
    }


@router.delete("/runs/{run_id}")
async def delete_query_run(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a query run and its results."""
    query_run = db.query(models.QueryRun).filter(
        models.QueryRun.id == run_id,
        models.QueryRun.client_id == current_user.client_id
    ).first()
    
    if not query_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query run not found"
        )
    
    # Delete results first (cascade should handle this, but being explicit)
    db.query(models.QueryResult).filter(
        models.QueryResult.query_run_id == run_id
    ).delete()
    
    db.delete(query_run)
    db.commit()
    
    return {"message": "Query run deleted"}


@router.get("/results", response_model=List[schemas.QueryResultResponse])
async def list_all_results(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all query results for the current client."""
    return db.query(models.QueryResult).join(models.QueryRun).filter(
        models.QueryRun.client_id == current_user.client_id
    ).order_by(models.QueryResult.created_at.desc()).offset(offset).limit(limit).all()

