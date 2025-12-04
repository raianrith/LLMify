"""Client management API routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from .. import models, schemas

router = APIRouter(prefix="/api/clients", tags=["Clients"])


@router.get("/", response_model=List[schemas.ClientResponse])
async def list_clients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all clients. Superadmins see all, others see only their client."""
    if current_user.is_superadmin:
        return db.query(models.Client).filter(models.Client.is_active == True).all()
    
    return db.query(models.Client).filter(
        models.Client.id == current_user.client_id,
        models.Client.is_active == True
    ).all()


@router.get("/current", response_model=schemas.ClientWithCompetitors)
async def get_current_client(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get the current user's client with competitors."""
    client = db.query(models.Client).filter(
        models.Client.id == current_user.client_id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    return client


@router.get("/{client_id}", response_model=schemas.ClientWithCompetitors)
async def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a specific client."""
    # Check access
    if not current_user.is_superadmin and current_user.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    return client


@router.post("/", response_model=schemas.ClientResponse)
async def create_client(
    client_data: schemas.ClientCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new client. Superadmin only."""
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmins can create clients"
        )
    
    # Check if client slug exists
    existing = db.query(models.Client).filter(
        models.Client.slug == client_data.slug
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Client with this slug already exists"
        )
    
    client = models.Client(**client_data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    
    return client


@router.put("/{client_id}", response_model=schemas.ClientResponse)
async def update_client(
    client_id: int,
    client_data: schemas.ClientUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a client. Admins can update their own client."""
    # Check access
    if not current_user.is_superadmin and current_user.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if not current_user.is_admin and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update client settings"
        )
    
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Only update fields that are provided (not None)
    update_data = client_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(client, key, value)
    
    db.commit()
    db.refresh(client)
    
    return client


@router.put("/current/brand-aliases")
async def update_brand_aliases(
    aliases_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update brand aliases for the current client."""
    if not current_user.is_admin and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update brand settings"
        )
    
    client = db.query(models.Client).filter(
        models.Client.id == current_user.client_id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Update brand aliases (comma-separated string)
    client.brand_aliases = aliases_data.get("brand_aliases", "")
    db.commit()
    db.refresh(client)
    
    return {
        "success": True,
        "brand_name": client.brand_name,
        "brand_aliases": client.brand_aliases,
        "all_variations": [client.brand_name] + [a.strip() for a in (client.brand_aliases or "").split(",") if a.strip()]
    }


# ─── COMPETITOR MANAGEMENT ────────────────────────────────────────────────────

@router.get("/{client_id}/competitors", response_model=List[schemas.CompetitorResponse])
async def list_competitors(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List competitors for a client."""
    if not current_user.is_superadmin and current_user.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return db.query(models.Competitor).filter(
        models.Competitor.client_id == client_id,
        models.Competitor.is_active == True
    ).all()


@router.post("/{client_id}/competitors", response_model=schemas.CompetitorResponse)
async def add_competitor(
    client_id: int,
    competitor_data: schemas.CompetitorCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Add a competitor for a client."""
    if not current_user.is_superadmin and current_user.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    competitor = models.Competitor(
        **competitor_data.model_dump(),
        client_id=client_id
    )
    db.add(competitor)
    db.commit()
    db.refresh(competitor)
    
    return competitor


@router.delete("/{client_id}/competitors/{competitor_id}")
async def remove_competitor(
    client_id: int,
    competitor_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Remove a competitor (soft delete)."""
    if not current_user.is_superadmin and current_user.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    competitor = db.query(models.Competitor).filter(
        models.Competitor.id == competitor_id,
        models.Competitor.client_id == client_id
    ).first()
    
    if not competitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competitor not found"
        )
    
    competitor.is_active = False
    db.commit()
    
    return {"message": "Competitor removed"}


@router.put("/{client_id}/competitors/{competitor_id}", response_model=schemas.CompetitorResponse)
async def update_competitor(
    client_id: int,
    competitor_id: int,
    competitor_data: schemas.CompetitorCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a competitor."""
    if not current_user.is_superadmin and current_user.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    competitor = db.query(models.Competitor).filter(
        models.Competitor.id == competitor_id,
        models.Competitor.client_id == client_id
    ).first()
    
    if not competitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competitor not found"
        )
    
    competitor.name = competitor_data.name
    competitor.aliases = competitor_data.aliases
    if competitor_data.website:
        competitor.website = competitor_data.website
    
    db.commit()
    db.refresh(competitor)
    
    return competitor


# ─── PREDEFINED QUERIES MANAGEMENT ────────────────────────────────────────────

@router.get("/{client_id}/queries", response_model=List[schemas.PredefinedQueryResponse])
async def list_predefined_queries(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List predefined queries for a client."""
    if not current_user.is_superadmin and current_user.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return db.query(models.PredefinedQuery).filter(
        models.PredefinedQuery.client_id == client_id,
        models.PredefinedQuery.is_active == True
    ).order_by(models.PredefinedQuery.order_index).all()


@router.post("/{client_id}/queries", response_model=schemas.PredefinedQueryResponse)
async def add_predefined_query(
    client_id: int,
    query_data: schemas.PredefinedQueryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Add a predefined query for a client."""
    if not current_user.is_superadmin and current_user.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    query = models.PredefinedQuery(
        **query_data.model_dump(),
        client_id=client_id
    )
    db.add(query)
    db.commit()
    db.refresh(query)
    
    return query


@router.post("/{client_id}/queries/bulk", response_model=List[schemas.PredefinedQueryResponse])
async def bulk_add_predefined_queries(
    client_id: int,
    queries: List[schemas.PredefinedQueryCreate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Bulk add predefined queries for a client."""
    if not current_user.is_superadmin and current_user.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    created_queries = []
    for idx, query_data in enumerate(queries):
        query = models.PredefinedQuery(
            **query_data.model_dump(),
            client_id=client_id,
            order_index=idx
        )
        db.add(query)
        created_queries.append(query)
    
    db.commit()
    
    for q in created_queries:
        db.refresh(q)
    
    return created_queries

