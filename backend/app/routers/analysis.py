"""Analysis API routes - visibility analysis, competitor comparison, gap analysis."""
import re
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..auth import get_current_user
from .. import models, schemas

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


@router.get("/runs/{run_id}/summary")
async def get_run_analysis_summary(
    run_id: int,
    branded: Optional[bool] = Query(default=None, description="Filter by branded (True), non-branded (False), or all (None)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get comprehensive analysis summary for a query run."""
    # Verify access
    query_run = db.query(models.QueryRun).filter(
        models.QueryRun.id == run_id,
        models.QueryRun.client_id == current_user.client_id
    ).first()
    
    if not query_run:
        raise HTTPException(status_code=404, detail="Query run not found")
    
    # Get all results with optional branded filter
    results_query = db.query(models.QueryResult).filter(
        models.QueryResult.query_run_id == run_id
    )
    
    if branded is not None:
        results_query = results_query.filter(models.QueryResult.branded_query == branded)
    
    results = results_query.all()
    
    if not results:
        raise HTTPException(status_code=404, detail="No results found")
    
    total = len(results)
    
    # Overall metrics
    mentioned_count = sum(1 for r in results if r.brand_mentioned)
    overall_mention_rate = (mentioned_count / total * 100) if total > 0 else 0
    
    avg_response_time = sum(r.response_time or 0 for r in results) / total if total > 0 else 0
    
    first_third_count = sum(1 for r in results if r.brand_position == "First Third")
    first_third_rate = (first_third_count / total * 100) if total > 0 else 0
    
    positive_count = sum(1 for r in results if r.context_type == "Positive")
    positive_rate = (positive_count / total * 100) if total > 0 else 0
    
    # Mention rates by source
    sources = ["OpenAI", "Gemini", "Perplexity"]
    mention_rates_by_source = []
    
    for source in sources:
        source_results = [r for r in results if r.source == source]
        source_total = len(source_results)
        source_mentioned = sum(1 for r in source_results if r.brand_mentioned)
        
        mention_rates_by_source.append(schemas.MentionRateBySource(
            source=source,
            mention_rate=(source_mentioned / source_total * 100) if source_total > 0 else 0,
            total_responses=source_total,
            mentioned_count=source_mentioned
        ))
    
    # Position distribution
    positions = ["First Third", "Middle Third", "Last Third", "Not Mentioned"]
    position_distribution = []
    
    for pos in positions:
        count = sum(1 for r in results if r.brand_position == pos)
        position_distribution.append(schemas.PositionAnalysis(
            position=pos,
            count=count,
            percentage=(count / total * 100) if total > 0 else 0
        ))
    
    # Context distribution
    contexts = ["Positive", "Neutral", "Negative", "Not Mentioned"]
    context_distribution = []
    
    for ctx in contexts:
        count = sum(1 for r in results if r.context_type == ctx)
        context_distribution.append(schemas.ContextAnalysis(
            context_type=ctx,
            count=count,
            percentage=(count / total * 100) if total > 0 else 0
        ))
    
    # Top competitors
    competitor_counts = {}
    for r in results:
        if r.competitors_found:
            for comp in r.competitors_found.split(", "):
                comp = comp.strip()
                if comp:
                    competitor_counts[comp] = competitor_counts.get(comp, 0) + 1
    
    top_competitors = [
        schemas.CompetitorMention(
            competitor=comp,
            mention_count=count,
            percentage=(count / total * 100) if total > 0 else 0
        )
        for comp, count in sorted(competitor_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    # Gap analysis summary
    # Group results by query to determine gaps
    query_results = {}
    for r in results:
        if r.query_text not in query_results:
            query_results[r.query_text] = []
        query_results[r.query_text].append(r)
    
    exclusive_wins = 0  # Brand mentioned, no competitors
    critical_gaps = 0   # Competitors mentioned, brand not
    competitive_arena = 0  # Both mentioned
    blue_ocean = 0  # Neither mentioned
    
    for query, qresults in query_results.items():
        brand_mentioned = any(r.brand_mentioned for r in qresults)
        has_competitors = any(r.competitors_found for r in qresults)
        
        if brand_mentioned and not has_competitors:
            exclusive_wins += 1
        elif not brand_mentioned and has_competitors:
            critical_gaps += 1
        elif brand_mentioned and has_competitors:
            competitive_arena += 1
        else:
            blue_ocean += 1
    
    gap_summary = {
        "exclusive_wins": exclusive_wins,
        "critical_gaps": critical_gaps,
        "competitive_arena": competitive_arena,
        "blue_ocean": blue_ocean,
        "total_responses": len(query_results)
    }
    
    # Get branded/non-branded counts for this run
    all_results = db.query(models.QueryResult).filter(
        models.QueryResult.query_run_id == run_id
    ).all()
    branded_count = sum(1 for r in all_results if r.branded_query)
    non_branded_count = sum(1 for r in all_results if not r.branded_query)
    
    return {
        "query_run_id": run_id,
        "total_responses": total,
        "overall_mention_rate": overall_mention_rate,
        "avg_response_time": avg_response_time,
        "first_third_rate": first_third_rate,
        "positive_context_rate": positive_rate,
        "mention_rates_by_source": [
            {
                "source": m.source,
                "mention_rate": m.mention_rate,
                "total_responses": m.total_responses,
                "mentioned_count": m.mentioned_count
            } for m in mention_rates_by_source
        ],
        "position_distribution": [
            {
                "position": p.position,
                "count": p.count,
                "percentage": p.percentage
            } for p in position_distribution
        ],
        "context_distribution": [
            {
                "context_type": c.context_type,
                "count": c.count,
                "percentage": c.percentage
            } for c in context_distribution
        ],
        "top_competitors": [
            {
                "competitor": c.competitor,
                "mention_count": c.mention_count,
                "percentage": c.percentage
            } for c in top_competitors
        ],
        "gap_summary": gap_summary,
        "branded_count": branded_count,
        "non_branded_count": non_branded_count,
        "filter_applied": "all" if branded is None else ("branded" if branded else "non_branded")
    }


@router.get("/runs/{run_id}/gaps")
async def get_gap_analysis(
    run_id: int,
    branded: Optional[bool] = Query(default=None, description="Filter by branded (True), non-branded (False), or all (None)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get detailed gap analysis for a query run."""
    # Verify access
    query_run = db.query(models.QueryRun).filter(
        models.QueryRun.id == run_id,
        models.QueryRun.client_id == current_user.client_id
    ).first()
    
    if not query_run:
        raise HTTPException(status_code=404, detail="Query run not found")
    
    results_query = db.query(models.QueryResult).filter(
        models.QueryResult.query_run_id == run_id
    )
    
    if branded is not None:
        results_query = results_query.filter(models.QueryResult.branded_query == branded)
    
    results = results_query.all()
    
    # Get counts for all results (unfiltered)
    all_results = db.query(models.QueryResult).filter(
        models.QueryResult.query_run_id == run_id
    ).all()
    branded_count = sum(1 for r in all_results if r.branded_query)
    non_branded_count = sum(1 for r in all_results if not r.branded_query)
    
    # Group by query
    query_results = {}
    for r in results:
        if r.query_text not in query_results:
            query_results[r.query_text] = []
        query_results[r.query_text].append(r)
    
    gaps = []
    
    for query, qresults in query_results.items():
        brand_mentioned = any(r.brand_mentioned for r in qresults)
        has_competitors = any(r.competitors_found for r in qresults)
        
        # Collect all competitors mentioned
        all_competitors = []
        for r in qresults:
            if r.competitors_found:
                all_competitors.extend([c.strip() for c in r.competitors_found.split(",")])
        
        # Sources where brand was mentioned/not mentioned
        mentioned_sources = [r.source for r in qresults if r.brand_mentioned]
        missing_sources = [r.source for r in qresults if not r.brand_mentioned]
        
        # Determine category
        if brand_mentioned and not has_competitors:
            category = "exclusive_win"
        elif not brand_mentioned and has_competitors:
            category = "critical_gap"
        elif brand_mentioned and has_competitors:
            category = "competitive"
        else:
            category = "blue_ocean"
        
        gaps.append({
            "query": query,
            "category": category,
            "brand_mentioned": brand_mentioned,
            "has_competitors": has_competitors,
            "competitors": list(set(all_competitors)),
            "mentioned_sources": mentioned_sources,
            "missing_sources": missing_sources,
            "responses": [
                {
                    "source": r.source,
                    "brand_mentioned": r.brand_mentioned,
                    "brand_position": r.brand_position,
                    "context_type": r.context_type,
                    "competitors_found": r.competitors_found,
                    "response_preview": r.response[:300] + "..." if r.response and len(r.response) > 300 else r.response,
                    "full_response": r.response
                }
                for r in qresults
            ]
        })
    
    return {
        "query_run_id": run_id,
        "total_queries": len(gaps),
        "gaps": sorted(gaps, key=lambda x: (
            0 if x["category"] == "critical_gap" else
            1 if x["category"] == "competitive" else
            2 if x["category"] == "blue_ocean" else 3
        )),
        "branded_count": branded_count,
        "non_branded_count": non_branded_count,
        "filter_applied": "all" if branded is None else ("branded" if branded else "non_branded")
    }


@router.get("/runs/{run_id}/competitors")
async def get_competitor_analysis(
    run_id: int,
    branded: Optional[bool] = Query(default=None, description="Filter by branded (True), non-branded (False), or all (None)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get competitor comparison analysis for a query run."""
    # Verify access
    query_run = db.query(models.QueryRun).filter(
        models.QueryRun.id == run_id,
        models.QueryRun.client_id == current_user.client_id
    ).first()
    
    if not query_run:
        raise HTTPException(status_code=404, detail="Query run not found")
    
    # Get client's brand name
    client = db.query(models.Client).filter(
        models.Client.id == current_user.client_id
    ).first()
    
    results_query = db.query(models.QueryResult).filter(
        models.QueryResult.query_run_id == run_id
    )
    
    if branded is not None:
        results_query = results_query.filter(models.QueryResult.branded_query == branded)
    
    results = results_query.all()
    
    # Get counts for all results (unfiltered)
    all_results = db.query(models.QueryResult).filter(
        models.QueryResult.query_run_id == run_id
    ).all()
    branded_count = sum(1 for r in all_results if r.branded_query)
    non_branded_count = sum(1 for r in all_results if not r.branded_query)
    
    total = len(results)
    
    # Brand performance
    brand_mention_count = sum(1 for r in results if r.brand_mentioned)
    brand_first_third = sum(1 for r in results if r.brand_position == "First Third")
    brand_positive = sum(1 for r in results if r.context_type == "Positive")
    
    # Competitor performance
    competitor_stats = {}
    
    for r in results:
        if r.competitors_found:
            for comp in r.competitors_found.split(", "):
                comp = comp.strip()
                if comp:
                    if comp not in competitor_stats:
                        competitor_stats[comp] = {
                            "mention_count": 0,
                            "queries": set()
                        }
                    competitor_stats[comp]["mention_count"] += 1
                    competitor_stats[comp]["queries"].add(r.query_text)
    
    # Build comparison matrix
    comparison = [
        {
            "name": client.brand_name,
            "is_brand": True,
            "mention_count": brand_mention_count,
            "mention_rate": (brand_mention_count / total * 100) if total > 0 else 0,
            "first_third_rate": (brand_first_third / total * 100) if total > 0 else 0,
            "positive_rate": (brand_positive / total * 100) if total > 0 else 0
        }
    ]
    
    for comp, stats in sorted(competitor_stats.items(), key=lambda x: x[1]["mention_count"], reverse=True):
        comparison.append({
            "name": comp,
            "is_brand": False,
            "mention_count": stats["mention_count"],
            "mention_rate": (stats["mention_count"] / total * 100) if total > 0 else 0,
            "unique_queries": len(stats["queries"])
        })
    
    # Win/loss analysis per query
    query_results = {}
    for r in results:
        if r.query_text not in query_results:
            query_results[r.query_text] = {"brand": False, "competitors": []}
        if r.brand_mentioned:
            query_results[r.query_text]["brand"] = True
        if r.competitors_found:
            query_results[r.query_text]["competitors"].extend(
                [c.strip() for c in r.competitors_found.split(",")]
            )
    
    wins = sum(1 for q in query_results.values() if q["brand"] and not q["competitors"])
    ties = sum(1 for q in query_results.values() if q["brand"] and q["competitors"])
    losses = sum(1 for q in query_results.values() if not q["brand"] and q["competitors"])
    neither = sum(1 for q in query_results.values() if not q["brand"] and not q["competitors"])
    
    return {
        "query_run_id": run_id,
        "total_responses": total,
        "comparison": comparison,
        "win_loss": {
            "wins": wins,
            "ties": ties,
            "losses": losses,
            "neither": neither
        },
        "branded_count": branded_count,
        "non_branded_count": non_branded_count,
        "filter_applied": "all" if branded is None else ("branded" if branded else "non_branded")
    }


@router.get("/time-series")
async def get_time_series_data(
    days: int = Query(default=30, ge=1, le=365),
    branded: Optional[bool] = Query(default=None, description="Filter by branded (True), non-branded (False), or all (None)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get time-series data for the dashboard."""
    # Get date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get all completed query runs in date range
    query_runs = db.query(models.QueryRun).filter(
        models.QueryRun.client_id == current_user.client_id,
        models.QueryRun.status == "completed",
        models.QueryRun.created_at >= start_date
    ).order_by(models.QueryRun.created_at).all()
    
    if not query_runs:
        return {
            "data_points": [],
            "by_source": {},
            "trend": "stable",
            "trend_change": 0,
            "branded_count": 0,
            "non_branded_count": 0,
            "filter_applied": "all" if branded is None else ("branded" if branded else "non_branded")
        }
    
    # Calculate metrics for each run
    data_points = []
    by_source = {"OpenAI": [], "Gemini": [], "Perplexity": []}
    total_branded = 0
    total_non_branded = 0
    
    for run in query_runs:
        results_query = db.query(models.QueryResult).filter(
            models.QueryResult.query_run_id == run.id
        )
        
        if branded is not None:
            results_query = results_query.filter(models.QueryResult.branded_query == branded)
        
        results = results_query.all()
        
        # Count for totals (from all results of run)
        all_run_results = db.query(models.QueryResult).filter(
            models.QueryResult.query_run_id == run.id
        ).all()
        total_branded += sum(1 for r in all_run_results if r.branded_query)
        total_non_branded += sum(1 for r in all_run_results if not r.branded_query)
        
        if not results:
            continue
        
        total = len(results)
        
        # Overall metrics
        mention_rate = sum(1 for r in results if r.brand_mentioned) / total * 100
        first_third_rate = sum(1 for r in results if r.brand_position == "First Third") / total * 100
        positive_rate = sum(1 for r in results if r.context_type == "Positive") / total * 100
        
        data_points.append({
            "date": run.created_at.isoformat(),
            "mention_rate": round(mention_rate, 1),
            "first_third_rate": round(first_third_rate, 1),
            "positive_rate": round(positive_rate, 1),
            "response_count": total
        })
        
        # By source
        for source in by_source.keys():
            source_results = [r for r in results if r.source == source]
            if source_results:
                source_mention_rate = sum(1 for r in source_results if r.brand_mentioned) / len(source_results) * 100
                by_source[source].append({
                    "date": run.created_at.isoformat(),
                    "mention_rate": round(source_mention_rate, 1)
                })
    
    # Calculate trend
    trend = "stable"
    trend_change = 0
    
    if len(data_points) >= 2:
        first_rate = data_points[0]["mention_rate"]
        last_rate = data_points[-1]["mention_rate"]
        trend_change = last_rate - first_rate
        
        if trend_change > 2:
            trend = "up"
        elif trend_change < -2:
            trend = "down"
    
    return {
        "data_points": data_points,
        "by_source": by_source,
        "trend": trend,
        "trend_change": round(trend_change, 1),
        "branded_count": total_branded,
        "non_branded_count": total_non_branded,
        "filter_applied": "all" if branded is None else ("branded" if branded else "non_branded")
    }


@router.get("/runs/{run_id}/citations")
async def get_citation_analysis(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get citation analysis for a query run."""
    # Verify access
    query_run = db.query(models.QueryRun).filter(
        models.QueryRun.id == run_id,
        models.QueryRun.client_id == current_user.client_id
    ).first()
    
    if not query_run:
        raise HTTPException(status_code=404, detail="Query run not found")
    
    # Get client's brand name
    client = db.query(models.Client).filter(
        models.Client.id == current_user.client_id
    ).first()
    
    results = db.query(models.QueryResult).filter(
        models.QueryResult.query_run_id == run_id
    ).all()
    
    total = len(results)
    
    # Citation stats
    responses_with_citations = 0
    total_citations = 0
    brand_url_citations = 0
    domain_counts = {}
    citations_by_source = {"OpenAI": 0, "Gemini": 0, "Perplexity": 0}
    responses_by_source = {"OpenAI": 0, "Gemini": 0, "Perplexity": 0}
    all_citations = []
    
    for r in results:
        responses_by_source[r.source] = responses_by_source.get(r.source, 0) + 1
        
        if r.sources_cited:
            urls = [u.strip() for u in r.sources_cited.split(",") if u.strip()]
            if urls:
                responses_with_citations += 1
                total_citations += len(urls)
                citations_by_source[r.source] = citations_by_source.get(r.source, 0) + len(urls)
                
                for url in urls:
                    all_citations.append({
                        "url": url,
                        "source": r.source,
                        "query": r.query_text[:100] + "..." if len(r.query_text) > 100 else r.query_text
                    })
                    
                    # Extract domain
                    try:
                        domain_match = re.search(r'https?://(?:www\.)?([^/]+)', url)
                        if domain_match:
                            domain = domain_match.group(1)
                            domain_counts[domain] = domain_counts.get(domain, 0) + 1
                    except:
                        pass
        
        if r.brand_url_cited:
            brand_url_citations += 1
    
    # Calculate rates
    citation_rate = (responses_with_citations / total * 100) if total > 0 else 0
    brand_citation_rate = (brand_url_citations / total * 100) if total > 0 else 0
    avg_citations_per_response = total_citations / total if total > 0 else 0
    
    # Top domains
    top_domains = [
        {"domain": domain, "count": count, "percentage": (count / total_citations * 100) if total_citations > 0 else 0}
        for domain, count in sorted(domain_counts.items(), key=lambda x: x[1], reverse=True)[:15]
    ]
    
    # Check if brand domain is in citations
    brand_domain_count = 0
    brand_name_lower = client.brand_name.lower()
    for domain, count in domain_counts.items():
        if brand_name_lower in domain.lower():
            brand_domain_count += count
    
    # Citations by source with rates
    citations_by_source_detailed = [
        {
            "source": source,
            "total_responses": responses_by_source.get(source, 0),
            "responses_with_citations": sum(1 for c in all_citations if c["source"] == source),
            "total_citations": citations_by_source.get(source, 0),
            "citation_rate": (citations_by_source.get(source, 0) / responses_by_source.get(source, 1) * 100) if responses_by_source.get(source, 0) > 0 else 0
        }
        for source in ["OpenAI", "Gemini", "Perplexity"]
    ]
    
    return {
        "query_run_id": run_id,
        "total_responses": total,
        "responses_with_citations": responses_with_citations,
        "citation_rate": round(citation_rate, 1),
        "total_citations": total_citations,
        "avg_citations_per_response": round(avg_citations_per_response, 2),
        "brand_url_citations": brand_url_citations,
        "brand_citation_rate": round(brand_citation_rate, 1),
        "brand_domain_mentions": brand_domain_count,
        "top_domains": top_domains,
        "citations_by_source": citations_by_source_detailed,
        "recent_citations": all_citations[:20]  # Last 20 citations
    }


@router.get("/dashboard-stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get dashboard statistics."""
    # Total query runs
    total_runs = db.query(models.QueryRun).filter(
        models.QueryRun.client_id == current_user.client_id,
        models.QueryRun.status == "completed"
    ).count()
    
    # Total responses
    total_responses = db.query(models.QueryResult).join(models.QueryRun).filter(
        models.QueryRun.client_id == current_user.client_id
    ).count()
    
    # Overall mention rate
    mentioned = db.query(models.QueryResult).join(models.QueryRun).filter(
        models.QueryRun.client_id == current_user.client_id,
        models.QueryResult.brand_mentioned == True
    ).count()
    
    overall_mention_rate = (mentioned / total_responses * 100) if total_responses > 0 else 0
    
    # Calculate trend from last 2 runs
    recent_runs = db.query(models.QueryRun).filter(
        models.QueryRun.client_id == current_user.client_id,
        models.QueryRun.status == "completed"
    ).order_by(models.QueryRun.created_at.desc()).limit(2).all()
    
    trend = "stable"
    trend_change = 0.0
    
    if len(recent_runs) >= 2:
        # Get mention rates for last 2 runs
        rates = []
        for run in recent_runs:
            run_results = db.query(models.QueryResult).filter(
                models.QueryResult.query_run_id == run.id
            ).all()
            if run_results:
                rate = sum(1 for r in run_results if r.brand_mentioned) / len(run_results) * 100
                rates.append(rate)
        
        if len(rates) == 2:
            trend_change = rates[0] - rates[1]  # newest - older
            if trend_change > 2:
                trend = "up"
            elif trend_change < -2:
                trend = "down"
    
    return schemas.DashboardStats(
        total_query_runs=total_runs,
        total_responses=total_responses,
        overall_mention_rate=round(overall_mention_rate, 1),
        recent_trend=trend,
        trend_change=round(trend_change, 1)
    )


@router.get("/mention-rates-by-source")
async def get_mention_rates_by_source(
    branded: Optional[bool] = Query(default=None, description="Filter by branded (True), non-branded (False), or all (None)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get overall mention rates broken down by LLM source across all query runs."""
    sources = ["OpenAI", "Gemini", "Perplexity"]
    results = []
    
    for source in sources:
        # Base query
        base_query = db.query(models.QueryResult).join(models.QueryRun).filter(
            models.QueryRun.client_id == current_user.client_id,
            models.QueryResult.source == source
        )
        
        # Apply branded filter if specified
        if branded is not None:
            base_query = base_query.filter(models.QueryResult.branded_query == branded)
        
        total = base_query.count()
        
        mentioned = base_query.filter(models.QueryResult.brand_mentioned == True).count()
        
        first_third_query = db.query(models.QueryResult).join(models.QueryRun).filter(
            models.QueryRun.client_id == current_user.client_id,
            models.QueryResult.source == source,
            models.QueryResult.brand_position == "First Third"
        )
        if branded is not None:
            first_third_query = first_third_query.filter(models.QueryResult.branded_query == branded)
        first_third = first_third_query.count()
        
        positive_query = db.query(models.QueryResult).join(models.QueryRun).filter(
            models.QueryRun.client_id == current_user.client_id,
            models.QueryResult.source == source,
            models.QueryResult.context_type == "Positive"
        )
        if branded is not None:
            positive_query = positive_query.filter(models.QueryResult.branded_query == branded)
        positive = positive_query.count()
        
        mention_rate = (mentioned / total * 100) if total > 0 else 0
        first_third_rate = (first_third / total * 100) if total > 0 else 0
        positive_rate = (positive / total * 100) if total > 0 else 0
        
        results.append({
            "source": source,
            "total_responses": total,
            "mentioned_count": mentioned,
            "mention_rate": round(mention_rate, 1),
            "first_third_rate": round(first_third_rate, 1),
            "positive_rate": round(positive_rate, 1)
        })
    
    return results


@router.get("/dashboard-stats-filtered")
async def get_dashboard_stats_filtered(
    branded: Optional[bool] = Query(default=None, description="Filter by branded (True), non-branded (False), or all (None)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get dashboard statistics with optional branded/non-branded filter."""
    # Total query runs
    total_runs = db.query(models.QueryRun).filter(
        models.QueryRun.client_id == current_user.client_id,
        models.QueryRun.status == "completed"
    ).count()
    
    # Base query for responses
    base_query = db.query(models.QueryResult).join(models.QueryRun).filter(
        models.QueryRun.client_id == current_user.client_id
    )
    
    if branded is not None:
        base_query = base_query.filter(models.QueryResult.branded_query == branded)
    
    total_responses = base_query.count()
    
    # Mentioned count
    mentioned_query = db.query(models.QueryResult).join(models.QueryRun).filter(
        models.QueryRun.client_id == current_user.client_id,
        models.QueryResult.brand_mentioned == True
    )
    if branded is not None:
        mentioned_query = mentioned_query.filter(models.QueryResult.branded_query == branded)
    mentioned = mentioned_query.count()
    
    overall_mention_rate = (mentioned / total_responses * 100) if total_responses > 0 else 0
    
    # Count branded vs non-branded
    branded_count = db.query(models.QueryResult).join(models.QueryRun).filter(
        models.QueryRun.client_id == current_user.client_id,
        models.QueryResult.branded_query == True
    ).count()
    
    non_branded_count = db.query(models.QueryResult).join(models.QueryRun).filter(
        models.QueryRun.client_id == current_user.client_id,
        models.QueryResult.branded_query == False
    ).count()
    
    return {
        "total_query_runs": total_runs,
        "total_responses": total_responses,
        "overall_mention_rate": round(overall_mention_rate, 1),
        "branded_count": branded_count,
        "non_branded_count": non_branded_count,
        "filter_applied": "all" if branded is None else ("branded" if branded else "non_branded")
    }

