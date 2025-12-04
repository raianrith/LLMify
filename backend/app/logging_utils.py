"""Logging utilities for tracking API usage and activity."""
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime

from . import models
from .config import get_current_time

# Approximate token costs per 1K tokens (USD)
# These are estimates and should be updated based on actual pricing
TOKEN_COSTS = {
    "openai": {
        "gpt-4o": {"input": 0.005, "output": 0.015},
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    },
    "gemini": {
        "gemini-2.0-flash-exp": {"input": 0.00, "output": 0.00},  # Free tier
        "gemini-1.5-pro": {"input": 0.00125, "output": 0.005},
    },
    "perplexity": {
        "sonar": {"input": 0.001, "output": 0.001},
        "sonar-pro": {"input": 0.003, "output": 0.015},
    }
}


def estimate_tokens(text: str) -> int:
    """Rough estimate of tokens based on character count."""
    # Approximate: 1 token ≈ 4 characters
    return len(text) // 4


def log_api_usage(
    db: Session,
    client_id: int,
    user_id: int,
    provider: str,
    model: str,
    query: str,
    response: str,
    response_time_ms: int,
    query_run_id: Optional[int] = None,
    status: str = "success",
    error_message: Optional[str] = None
):
    """Log an API call with estimated costs."""
    
    # Estimate tokens
    input_tokens = estimate_tokens(query)
    output_tokens = estimate_tokens(response) if not response.startswith("ERROR") else 0
    total_tokens = input_tokens + output_tokens
    
    # Calculate costs
    provider_lower = provider.lower()
    model_lower = model.lower()
    
    input_cost = 0.0
    output_cost = 0.0
    
    if provider_lower in TOKEN_COSTS:
        provider_costs = TOKEN_COSTS[provider_lower]
        # Find matching model
        for model_key, costs in provider_costs.items():
            if model_key in model_lower or model_lower in model_key:
                input_cost = (input_tokens / 1000) * costs["input"]
                output_cost = (output_tokens / 1000) * costs["output"]
                break
    
    total_cost = input_cost + output_cost
    
    # Create usage record
    usage = models.APIUsage(
        client_id=client_id,
        user_id=user_id,
        query_run_id=query_run_id,
        provider=provider_lower,
        model=model,
        endpoint="chat/completions",
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
        input_cost=input_cost,
        output_cost=output_cost,
        total_cost=total_cost,
        response_time_ms=response_time_ms,
        status=status if not response.startswith("ERROR") else "error",
        error_message=error_message if response.startswith("ERROR") else None
    )
    
    db.add(usage)
    db.commit()
    
    return usage


def log_activity(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    client_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log a user activity."""
    
    activity = models.ActivityLog(
        user_id=user_id,
        client_id=client_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(activity)
    db.commit()
    
    return activity

