"""Database models for multi-tenant LLM Search Visibility Tool."""
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, 
    ForeignKey, JSON, Table
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Client(Base):
    """Client/Business model - represents different companies like Kaysun, Weidert."""
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)  # URL-friendly name
    brand_name = Column(String(255), nullable=False)  # The brand to track (e.g., "Kaysun")
    brand_aliases = Column(Text)  # Comma-separated alternative names (e.g., "Kaysun Corp,Kaysun Corporation,KS")
    industry = Column(String(255))
    description = Column(Text)
    logo_url = Column(String(500))
    primary_color = Column(String(7), default="#e64626")  # Hex color
    
    # Default settings
    default_openai_model = Column(String(100), default="gpt-4o")
    default_gemini_model = Column(String(100), default="gemini-2.0-flash-exp")
    default_perplexity_model = Column(String(100), default="sonar")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    users = relationship("User", back_populates="client", cascade="all, delete-orphan")
    competitors = relationship("Competitor", back_populates="client", cascade="all, delete-orphan")
    predefined_queries = relationship("PredefinedQuery", back_populates="client", cascade="all, delete-orphan")
    query_runs = relationship("QueryRun", back_populates="client", cascade="all, delete-orphan")


class User(Base):
    """User model - each user belongs to a client."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    
    # Client association
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    
    # Permissions
    is_admin = Column(Boolean, default=False)  # Admin for their client
    is_superadmin = Column(Boolean, default=False)  # Can manage all clients
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    client = relationship("Client", back_populates="users")
    query_runs = relationship("QueryRun", back_populates="created_by")


class Competitor(Base):
    """Competitor model - competitors tracked for each client."""
    __tablename__ = "competitors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    aliases = Column(Text)  # Comma-separated alternative names (e.g., "Amazon,Amazon.com,AWS")
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    
    # Optional details
    website = Column(String(500))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # Relationship
    client = relationship("Client", back_populates="competitors")


class PredefinedQuery(Base):
    """Predefined queries for each client."""
    __tablename__ = "predefined_queries"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    query_text = Column(Text, nullable=False)
    category = Column(String(100))  # e.g., "Service Discovery", "Industry Specific"
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Relationship
    client = relationship("Client", back_populates="predefined_queries")


class QueryRun(Base):
    """A batch of queries run at a specific time."""
    __tablename__ = "query_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Run metadata
    name = Column(String(255))  # Optional name for the run
    description = Column(Text)
    run_type = Column(String(50), default="custom")  # "predefined", "custom"
    
    # Settings used
    openai_model = Column(String(100))
    gemini_model = Column(String(100))
    perplexity_model = Column(String(100))
    
    # Status
    status = Column(String(50), default="pending")  # pending, running, completed, failed
    total_queries = Column(Integer, default=0)
    completed_queries = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    client = relationship("Client", back_populates="query_runs")
    created_by = relationship("User", back_populates="query_runs")
    results = relationship("QueryResult", back_populates="query_run", cascade="all, delete-orphan")


class QueryResult(Base):
    """Individual LLM response for a query."""
    __tablename__ = "query_results"
    
    id = Column(Integer, primary_key=True, index=True)
    query_run_id = Column(Integer, ForeignKey("query_runs.id"), nullable=False)
    
    # Query and response
    query_text = Column(Text, nullable=False)
    source = Column(String(50), nullable=False)  # "OpenAI", "Gemini", "Perplexity"
    response = Column(Text)
    response_time = Column(Float)  # Seconds
    
    # Analysis results
    brand_mentioned = Column(Boolean, default=False)
    brand_position = Column(String(50))  # "First Third", "Middle Third", "Last Third", "Not Mentioned"
    brand_sentence_num = Column(Integer)
    brand_position_pct = Column(String(20))
    
    context_type = Column(String(50))  # "Positive", "Neutral", "Negative", "Not Mentioned"
    context_sentiment = Column(Float)
    
    competitors_found = Column(Text)  # Comma-separated list
    sources_cited = Column(Text)  # Comma-separated URLs
    brand_url_cited = Column(Boolean, default=False)
    
    branded_query = Column(Boolean, default=False)  # Query contains brand name
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    query_run = relationship("QueryRun", back_populates="results")


class QueryTemplate(Base):
    """Query templates organized by category."""
    __tablename__ = "query_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False)
    template_text = Column(Text, nullable=False)
    description = Column(Text)
    is_global = Column(Boolean, default=True)  # Available to all clients
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)  # Optional client-specific
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class APIUsage(Base):
    """Track API usage and costs for each LLM call."""
    __tablename__ = "api_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    query_run_id = Column(Integer, ForeignKey("query_runs.id"), nullable=True)
    
    # API details
    provider = Column(String(50), nullable=False)  # "openai", "gemini", "perplexity"
    model = Column(String(100), nullable=False)
    endpoint = Column(String(100))  # e.g., "chat/completions"
    
    # Usage metrics
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    
    # Cost calculation (in USD)
    input_cost = Column(Float, default=0.0)
    output_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    
    # Request details
    response_time_ms = Column(Integer)
    status = Column(String(20), default="success")  # success, error, timeout
    error_message = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ActivityLog(Base):
    """Track user activity for admin monitoring."""
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    
    # Activity details
    action = Column(String(100), nullable=False)  # login, logout, query_run, signup, delete_account, etc.
    resource_type = Column(String(50))  # user, client, query_run, etc.
    resource_id = Column(Integer)
    
    # Additional context
    details = Column(JSON)  # Flexible field for additional info
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

