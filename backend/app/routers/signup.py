"""Public signup API routes - no authentication required."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import re

from ..database import get_db
from ..auth import get_password_hash
from .. import models

router = APIRouter(prefix="/api/signup", tags=["Signup"])


# ─── REQUEST SCHEMAS ──────────────────────────────────────────────────────────

class CompetitorInput(BaseModel):
    """Competitor input during signup."""
    name: str
    website: Optional[str] = None


class SignupRequest(BaseModel):
    """Complete signup request with all onboarding data."""
    # User info
    email: EmailStr
    password: str
    full_name: str
    
    # Company info
    company_name: str
    brand_name: str  # The name to track in LLM responses
    brand_aliases: Optional[str] = None  # Comma-separated alternative names
    website: Optional[str] = None
    industry: Optional[str] = None
    
    # Competitors
    competitors: List[CompetitorInput] = []
    
    # Predefined queries
    queries: List[str] = []


class SignupResponse(BaseModel):
    """Signup response."""
    success: bool
    message: str
    client_id: int
    user_id: int
    username: str


# ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

def generate_slug(company_name: str) -> str:
    """Generate a URL-friendly slug from company name."""
    # Convert to lowercase and replace spaces with hyphens
    slug = company_name.lower().strip()
    # Remove special characters, keep only alphanumeric and hyphens
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)
    # Remove multiple consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    return slug


def generate_username(email: str, company_name: str) -> str:
    """Generate a username from email or company name."""
    # Try to use the part before @ in email
    username = email.split('@')[0].lower()
    # Clean it up
    username = re.sub(r'[^a-z0-9_]', '', username)
    return username


# ─── API ENDPOINTS ────────────────────────────────────────────────────────────

@router.post("/", response_model=SignupResponse)
async def create_account(
    data: SignupRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new account with company, competitors, and queries.
    This is a public endpoint - no authentication required.
    """
    
    # Validate password length
    if len(data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
    
    # Check if email already exists
    existing_user = db.query(models.User).filter(
        models.User.email == data.email
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    # Generate slug and username
    slug = generate_slug(data.company_name)
    username = generate_username(data.email, data.company_name)
    
    # Check if slug exists, append number if needed
    base_slug = slug
    counter = 1
    while db.query(models.Client).filter(models.Client.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # Check if username exists, append number if needed
    base_username = username
    counter = 1
    while db.query(models.User).filter(models.User.username == username).first():
        username = f"{base_username}{counter}"
        counter += 1
    
    try:
        # 1. Create the client (company)
        client = models.Client(
            name=data.company_name,
            slug=slug,
            brand_name=data.brand_name,
            brand_aliases=data.brand_aliases,
            industry=data.industry,
            description=f"Website: {data.website}" if data.website else None,
            primary_color="#e64626",  # Default brand color
            default_openai_model="gpt-4o",
            default_gemini_model="gemini-2.0-flash-exp",
            default_perplexity_model="sonar"
        )
        db.add(client)
        db.flush()  # Get the client ID
        
        # 2. Create the admin user
        user = models.User(
            email=data.email,
            username=username,
            full_name=data.full_name,
            hashed_password=get_password_hash(data.password),
            client_id=client.id,
            is_admin=True,  # First user is always admin
            is_superadmin=False
        )
        db.add(user)
        db.flush()  # Get the user ID
        
        # 3. Create competitors
        for idx, comp in enumerate(data.competitors):
            if comp.name.strip():  # Only add if name is not empty
                competitor = models.Competitor(
                    name=comp.name.strip(),
                    website=comp.website.strip() if comp.website else None,
                    client_id=client.id
                )
                db.add(competitor)
        
        # 4. Create predefined queries
        for idx, query in enumerate(data.queries):
            if query.strip():  # Only add if query is not empty
                predefined = models.PredefinedQuery(
                    client_id=client.id,
                    query_text=query.strip(),
                    category="Custom",
                    order_index=idx
                )
                db.add(predefined)
        
        # Commit all changes
        db.commit()
        
        return SignupResponse(
            success=True,
            message=f"Account created successfully! Your username is: {username}",
            client_id=client.id,
            user_id=user.id,
            username=username
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create account: {str(e)}"
        )


@router.get("/check-email/{email}")
async def check_email_available(
    email: str,
    db: Session = Depends(get_db)
):
    """Check if an email is available for registration."""
    existing = db.query(models.User).filter(models.User.email == email).first()
    return {"available": existing is None}


@router.get("/check-company/{company_name}")
async def check_company_available(
    company_name: str,
    db: Session = Depends(get_db)
):
    """Check if a company name is available."""
    slug = generate_slug(company_name)
    existing = db.query(models.Client).filter(models.Client.slug == slug).first()
    return {"available": existing is None, "suggested_slug": slug}

