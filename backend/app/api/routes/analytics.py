from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
import pandas as pd

from app.models.schemas import (
    AccuracySummaryResponse,
    DailyAccuracyItem,
    HourlyAccuracyItem,
    AccuracyMetrics
)
from app.services.forecast_selection import forecast_selection_service
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Accuracy Analytics"])

@router.get("/summary", response_model=AccuracySummaryResponse)
def get_accuracy_summary(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    hour_from: Optional[int] = Query(None, ge=0, le=23, description="Hour of day from (0-23)"),
    hour_to: Optional[int] = Query(None, ge=0, le=23, description="Hour of day to (0-23)"),
    cutoff_time: str = Query("11:00", description="Day-ahead cutoff time"),
    matching_mode: str = Query("mapped", description="Matching mode ('mapped' or 'exact')")
):
    try:
        df = forecast_selection_service.select_forecasts(
            cutoff_time_str=cutoff_time,
            matching_mode=matching_mode
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # Apply date filters
    if start_date:
        df = df[df["settlement_date"] >= start_date]
    if end_date:
        df = df[df["settlement_date"] <= end_date]
        
    # Apply time of day filter
    if hour_from is not None or hour_to is not None:
        df["hour"] = pd.to_datetime(df["start_time"], utc=True).dt.hour
        if hour_from is not None:
            df = df[df["hour"] >= hour_from]
        if hour_to is not None:
            df = df[df["hour"] <= hour_to]
            
    metrics = analytics_service.calculate_metrics(df)
    daily_items = analytics_service.calculate_daily_metrics(df)
    hourly_items = analytics_service.calculate_hourly_metrics(df)
    scatter = analytics_service.generate_scatter_points(df)
    hist = analytics_service.generate_error_histogram(df)
    
    # Analytical interpretation text
    obs_text = (
        f"Across {metrics.matched_intervals} evaluated intervals with day-ahead cutoff {cutoff_time}, "
        f"the mean absolute error was {metrics.mae_mw:.1f} MW with a root mean squared error of {metrics.rmse_mw:.1f} MW. "
        f"Weighted Absolute Percentage Error (WAPE) was {metrics.wape_percent:.1f}%, yielding an accuracy indicator of {metrics.accuracy_indicator_percent:.1f}%. "
        f"The system exhibited a net Mean Bias Error of {metrics.mbe_mw:+.1f} MW ({metrics.overforecasting_pct:.1f}% overforecasting vs {metrics.underforecasting_pct:.1f}% underforecasting)."
    )
    
    return AccuracySummaryResponse(
        metrics=metrics,
        daily_metrics=daily_items,
        hourly_metrics=hourly_items,
        scatter_points=scatter,
        error_histogram=hist,
        observations_text=obs_text
    )

@router.get("/daily", response_model=List[DailyAccuracyItem])
def get_daily_metrics(
    cutoff_time: str = Query("11:00"),
    matching_mode: str = Query("mapped")
):
    df = forecast_selection_service.select_forecasts(cutoff_time_str=cutoff_time, matching_mode=matching_mode)
    return analytics_service.calculate_daily_metrics(df)

@router.get("/hourly", response_model=List[HourlyAccuracyItem])
def get_hourly_metrics(
    cutoff_time: str = Query("11:00"),
    matching_mode: str = Query("mapped")
):
    df = forecast_selection_service.select_forecasts(cutoff_time_str=cutoff_time, matching_mode=matching_mode)
    return analytics_service.calculate_hourly_metrics(df)
