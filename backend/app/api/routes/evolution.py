from typing import Optional
from fastapi import APIRouter, Query, HTTPException
import pandas as pd

from app.models.schemas import ForecastEvolutionResponse, EvolutionPoint
from app.services.forecast_selection import forecast_selection_service

router = APIRouter(prefix="/evolution", tags=["Forecast Evolution"])

@router.get("", response_model=ForecastEvolutionResponse)
def get_forecast_evolution(
    delivery_date: str = Query("2026-01-15", description="Delivery date in YYYY-MM-DD"),
    settlement_period: int = Query(24, ge=1, le=48, description="Settlement period (1-48)"),
    cutoff_time: str = Query("11:00", description="Day-ahead cutoff time")
):
    try:
        res = forecast_selection_service.get_forecast_versions_for_interval(
            delivery_date_str=delivery_date,
            settlement_period=settlement_period,
            cutoff_time_str=cutoff_time
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    versions = res.get("versions", [])
    if not versions:
        raise HTTPException(status_code=404, detail="No forecast versions found for this interval")
        
    actual_mw = res.get("actual_mw")
    
    points = []
    gens = []
    for v in versions:
        gen = v["generation_mw"]
        gens.append(gen)
        err = (gen - actual_mw) if actual_mw is not None else None
        
        points.append(EvolutionPoint(
            publish_time=v["publish_time"],
            generation_mw=gen,
            lead_time_hours=v["lead_time_hours"],
            is_before_cutoff=v["is_eligible"],
            is_decision_forecast=v["is_selected"],
            error_vs_actual_mw=err
        ))
        
    earliest_mw = gens[0] if gens else None
    latest_mw = gens[-1] if gens else None
    decision_mw = res.get("decision_forecast_mw")
    
    spread = (max(gens) - min(gens)) if gens else 0.0
    
    explanation = (
        f"For delivery on {delivery_date} SP{settlement_period}, {len(versions)} distinct forecast publications were issued. "
        f"The earliest publication predicted {earliest_mw:.1f} MW. "
        f"At day-ahead decision cutoff ({cutoff_time} on D-1), the latest eligible forecast was {decision_mw:.1f} MW. "
        f"Subsequent intra-day publications revised the forecast up to {latest_mw:.1f} MW before actual delivery of {actual_mw if actual_mw is not None else 'N/A'} MW. "
        f"The total forecast revision spread across publications was {spread:.1f} MW."
    )
    
    return ForecastEvolutionResponse(
        delivery_date=delivery_date,
        start_time=res.get("start_time") or f"{delivery_date} SP{settlement_period}",
        settlement_period=settlement_period,
        actual_mw=actual_mw,
        cutoff_time=cutoff_time,
        earliest_forecast_mw=earliest_mw,
        decision_forecast_mw=decision_mw,
        latest_forecast_mw=latest_mw,
        revision_spread_mw=round(spread, 1),
        points=points,
        explanation=explanation
    )
