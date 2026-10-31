from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from app.models.schemas import MarketOverviewResponse, TimeSeriesDataPoint
from app.services.forecast_selection import forecast_selection_service
from app.services.analytics_service import analytics_service
from app.core.logging import logger

router = APIRouter(prefix="/overview", tags=["Market Overview"])

@router.get("", response_model=MarketOverviewResponse)
def get_market_overview(
    cutoff_time: str = Query("11:00", description="Day-ahead cutoff time (HH:MM Europe/London)"),
    matching_mode: str = Query("mapped", description="Matching mode: 'mapped' (half-hourly) or 'exact' (hourly timestamps)")
):
    try:
        df_matched = forecast_selection_service.select_forecasts(
            cutoff_time_str=cutoff_time,
            matching_mode=matching_mode
        )
    except Exception as e:
        logger.error(f"Error selecting forecasts in overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
    metrics = analytics_service.calculate_metrics(df_matched)
    insights = analytics_service.generate_dynamic_insights(df_matched)
    daily_items = analytics_service.calculate_daily_metrics(df_matched)
    
    # Build time-series points
    time_series = []
    for _, row in df_matched.iterrows():
        act = float(row["actual_generation_mw"]) if row["actual_generation_mw"] is not None and not (isinstance(row["actual_generation_mw"], float) and row["actual_generation_mw"] != row["actual_generation_mw"]) else None
        fc = float(row["decision_forecast_mw"]) if row["decision_forecast_mw"] is not None and not (isinstance(row["decision_forecast_mw"], float) and row["decision_forecast_mw"] != row["decision_forecast_mw"]) else None
        err = float(row["error_mw"]) if row["error_mw"] is not None and not (isinstance(row["error_mw"], float) and row["error_mw"] != row["error_mw"]) else None
        abs_err = float(row["absolute_error_mw"]) if row["absolute_error_mw"] is not None and not (isinstance(row["absolute_error_mw"], float) and row["absolute_error_mw"] != row["absolute_error_mw"]) else None
        
        time_series.append(TimeSeriesDataPoint(
            start_time=str(row["start_time"]),
            settlement_date=str(row["settlement_date"]),
            settlement_period=int(row["settlement_period"]),
            actual_mw=act,
            forecast_mw=fc,
            error_mw=err,
            absolute_error_mw=abs_err,
            publish_time=str(row["selected_publish_time"]) if row.get("selected_publish_time") else None,
            is_missing=fc is None
        ))
        
    daily_summaries = [d.model_dump() for d in daily_items]
    
    return MarketOverviewResponse(
        metrics=metrics,
        cutoff_time=cutoff_time,
        matching_mode=matching_mode,
        insights=insights,
        time_series=time_series,
        daily_summaries=daily_summaries
    )

