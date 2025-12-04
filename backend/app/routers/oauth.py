"""OAuth authentication routes for Google login."""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx
import secrets
from urllib.parse import urlencode

from ..database import get_db
from ..config import get_settings
from ..auth import create_access_token
from .. import models

router = APIRouter(prefix="/api/oauth", tags=["OAuth"])

settings = get_settings()

# OAuth state storage (in production, use Redis or database)
oauth_states: dict = {}


class OAuthConfigResponse(BaseModel):
    """Response showing if Google OAuth is configured."""
    google_enabled: bool


@router.get("/config", response_model=OAuthConfigResponse)
async def get_oauth_config():
    """Check if Google OAuth is configured."""
    return OAuthConfigResponse(
        google_enabled=bool(settings.google_client_id and settings.google_client_secret)
    )


@router.get("/google/login")
async def google_login():
    """Initiate Google OAuth flow."""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        )
    
    state = secrets.token_urlsafe(32)
    oauth_states[state] = "google"
    
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": f"{settings.oauth_redirect_base_url}/api/oauth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent"
    }
    
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback."""
    if state not in oauth_states or oauth_states[state] != "google":
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    del oauth_states[state]
    
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": f"{settings.oauth_redirect_base_url}/api/oauth/google/callback"
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        
        tokens = token_response.json()
        access_token = tokens.get("access_token")
        
        # Get user info
        user_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        google_user = user_response.json()
    
    # Find or create user
    email = google_user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        # User doesn't exist - redirect to signup with prefilled data
        params = urlencode({
            "email": email,
            "name": google_user.get("name", ""),
            "provider": "google",
            "error": "no_account"
        })
        return RedirectResponse(url=f"{settings.oauth_redirect_base_url}/signup?{params}")
    
    # Create JWT token
    jwt_token = create_access_token(data={"sub": user.username})
    
    # Redirect to frontend with token
    return RedirectResponse(
        url=f"{settings.oauth_redirect_base_url}/oauth/callback?token={jwt_token}&provider=google"
    )
