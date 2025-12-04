"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import init_db
from .routers import auth, clients, queries, analysis, signup, account, admin, oauth

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Multi-tenant LLM Search Visibility Tool API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(oauth.router)  # OAuth login (Google, Microsoft)
app.include_router(signup.router)  # Public signup - no auth required
app.include_router(account.router)  # Account management (delete, etc.)
app.include_router(admin.router)  # Admin portal - superadmin only
app.include_router(clients.router)
app.include_router(queries.router)
app.include_router(analysis.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/api/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

