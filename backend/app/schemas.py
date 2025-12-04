"""Pydantic schemas for API request/response validation."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# ─── AUTH SCHEMAS ─────────────────────────────────────────────────────────────

class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""
    username: Optional[str] = None


class LoginRequest(BaseModel):
    """Login request body."""
    username: str
    password: str


# ─── USER SCHEMAS ─────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str
    client_id: int
    is_admin: bool = False


class UserResponse(UserBase):
    """User response schema."""
    id: int
    client_id: int
    is_admin: bool
    is_superadmin: bool
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class UserWithClient(UserResponse):
    """User response with client details."""
    client: "ClientResponse"


# ─── CLIENT SCHEMAS ───────────────────────────────────────────────────────────

class ClientBase(BaseModel):
    """Base client schema."""
    name: str
    slug: str
    brand_name: str
    brand_aliases: Optional[str] = None  # Comma-separated alternative names
    industry: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: str = "#e64626"


class ClientCreate(ClientBase):
    """Schema for creating a new client."""
    default_openai_model: str = "gpt-4o"
    default_gemini_model: str = "gemini-2.0-flash-exp"
    default_perplexity_model: str = "sonar"


class ClientUpdate(BaseModel):
    """Schema for updating a client - all fields optional."""
    name: Optional[str] = None
    brand_name: Optional[str] = None
    brand_aliases: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    default_openai_model: Optional[str] = None
    default_gemini_model: Optional[str] = None
    default_perplexity_model: Optional[str] = None


class ClientResponse(ClientBase):
    """Client response schema."""
    id: int
    default_openai_model: str
    default_gemini_model: str
    default_perplexity_model: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ClientWithCompetitors(ClientResponse):
    """Client with competitors list."""
    competitors: List["CompetitorResponse"]


# ─── COMPETITOR SCHEMAS ───────────────────────────────────────────────────────

class CompetitorBase(BaseModel):
    """Base competitor schema."""
    name: str
    aliases: Optional[str] = None  # Comma-separated alternative names
    website: Optional[str] = None
    description: Optional[str] = None


class CompetitorCreate(CompetitorBase):
    """Schema for creating a competitor."""
    pass


class CompetitorResponse(CompetitorBase):
    """Competitor response schema."""
    id: int
    client_id: int
    is_active: bool
    
    class Config:
        from_attributes = True


# ─── PREDEFINED QUERY SCHEMAS ─────────────────────────────────────────────────

class PredefinedQueryBase(BaseModel):
    """Base predefined query schema."""
    query_text: str
    category: Optional[str] = None
    order_index: int = 0


class PredefinedQueryCreate(PredefinedQueryBase):
    """Schema for creating a predefined query."""
    pass


class PredefinedQueryResponse(PredefinedQueryBase):
    """Predefined query response schema."""
    id: int
    client_id: int
    is_active: bool
    
    class Config:
        from_attributes = True


# ─── QUERY RUN SCHEMAS ────────────────────────────────────────────────────────

class QueryRunCreate(BaseModel):
    """Schema for creating a query run."""
    name: Optional[str] = None
    description: Optional[str] = None
    queries: List[str]
    run_type: str = "custom"
    openai_model: str = "gpt-4o"
    gemini_model: str = "gemini-2.0-flash-exp"
    perplexity_model: str = "sonar"


class QueryRunResponse(BaseModel):
    """Query run response schema."""
    id: int
    client_id: int
    created_by_id: int
    name: Optional[str]
    description: Optional[str]
    run_type: str
    openai_model: Optional[str]
    gemini_model: Optional[str]
    perplexity_model: Optional[str]
    status: str
    total_queries: int
    completed_queries: int
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class QueryRunWithResults(QueryRunResponse):
    """Query run with results."""
    results: List["QueryResultResponse"]


# ─── QUERY RESULT SCHEMAS ─────────────────────────────────────────────────────

class QueryResultResponse(BaseModel):
    """Query result response schema."""
    id: int
    query_run_id: int
    query_text: str
    source: str
    response: Optional[str]
    response_time: Optional[float]
    brand_mentioned: bool
    brand_position: Optional[str]
    brand_sentence_num: Optional[int]
    brand_position_pct: Optional[str]
    context_type: Optional[str]
    context_sentiment: Optional[float]
    competitors_found: Optional[str]
    sources_cited: Optional[str]
    brand_url_cited: bool
    branded_query: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ─── ANALYSIS SCHEMAS ─────────────────────────────────────────────────────────

class MentionRateBySource(BaseModel):
    """Mention rate by LLM source."""
    source: str
    mention_rate: float
    total_responses: int
    mentioned_count: int


class PositionAnalysis(BaseModel):
    """Position analysis summary."""
    position: str
    count: int
    percentage: float


class ContextAnalysis(BaseModel):
    """Context/sentiment analysis summary."""
    context_type: str
    count: int
    percentage: float


class CompetitorMention(BaseModel):
    """Competitor mention summary."""
    competitor: str
    mention_count: int
    percentage: float


class GapAnalysisSummary(BaseModel):
    """Gap analysis summary."""
    exclusive_wins: int
    critical_gaps: int
    competitive_arena: int
    blue_ocean: int
    total_responses: int


class AnalysisSummary(BaseModel):
    """Overall analysis summary for a query run."""
    query_run_id: int
    total_responses: int
    overall_mention_rate: float
    avg_response_time: float
    first_third_rate: float
    positive_context_rate: float
    mention_rates_by_source: List[MentionRateBySource]
    position_distribution: List[PositionAnalysis]
    context_distribution: List[ContextAnalysis]
    top_competitors: List[CompetitorMention]
    gap_summary: GapAnalysisSummary


class TimeSeriesDataPoint(BaseModel):
    """Time series data point."""
    date: datetime
    mention_rate: float
    first_third_rate: float
    positive_rate: float
    response_count: int


class TimeSeriesData(BaseModel):
    """Time series data for dashboard."""
    data_points: List[TimeSeriesDataPoint]
    by_source: dict  # source -> list of data points


# ─── DASHBOARD SCHEMAS ────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    """Dashboard statistics."""
    total_query_runs: int
    total_responses: int
    overall_mention_rate: float
    recent_trend: str  # "up", "down", "stable"
    trend_change: float


# Update forward references
UserWithClient.model_rebuild()
ClientWithCompetitors.model_rebuild()
QueryRunWithResults.model_rebuild()

