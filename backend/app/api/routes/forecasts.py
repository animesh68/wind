from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, HTTPException, Path
import pandas as pd

from app.models.schemas import DayForecastExplorerResponse, ForecastIntervalDetail, ForecastVersionItem
from app.services.forecast_selection import forecast_selection_service
from app.services.analytics_service import analytics_service
from app.storage.parquet_store import parquet_store
from app.config import settings

router = APIRouter(prefix="/forecasts", tags=["Forecast Explorer"])

@router.get("/dates", response_model=List[str])
def get_available_dates():
    """List all available delivery dates in January 2026."""
    df_actuals = parquet_store.load_df(settings.ACTUAL_PARQUET, cache_key="actual_generation")
    if df_actuals is None or df_actuals.empty:
        return []
    dates = sorted(df_actuals["settlement_date"].unique().tolist())
    return dates

@router.get("/{delivery_date}", response_model=DayForecastExplorerResponse)
def get_day_forecasts(
    delivery_date: str = Path(..., description="Delivery date in YYYY-MM-DD format"),
    cutoff_time: str = Query("11:00", description="Day-ahead cutoff time (HH:MM Europe/London)")
):
    try:
        df_matched = forecast_selection_service.select_forecasts(
            cutoff_time_str=cutoff_time,
            matching_mode="mapped"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    day_df = df_matched[df_matched["settlement_date"] == delivery_date].sort_values("settlement_period")
    if day_df.empty:
        raise HTTPException(status_code=404, detail=f"No data available for delivery date {delivery_date}")
        
    intervals = []
    for _, row in day_df.iterrows():
        sp = int(row["settlement_period"])
        act = float(row["actual_generation_mw"]) if pd.notna(row["actual_generation_mw"]) else None
        dec_fc = float(row["decision_forecast_mw"]) if pd.notna(row["decision_forecast_mw"]) else None
        lat_fc = float(row["latest_forecast_mw"]) if pd.notna(row.get("latest_forecast_mw")) else None
        ear_fc = float(row["earliest_forecast_mw"]) if pd.notna(row.get("earliest_forecast_mw")) else None
        err = float(row["error_mw"]) if pd.notna(row.get("error_mw")) else None
        abs_err = float(row["absolute_error_mw"]) if pd.notna(row.get("absolute_error_mw")) else None
        
        intervals.append(ForecastIntervalDetail(
            start_time=str(row["start_time"]),
            settlement_date=delivery_date,
            settlement_period=sp,
            actual_mw=act,
            decision_forecast_mw=dec_fc,
            latest_forecast_mw=lat_fc,
            earliest_forecast_mw=ear_fc,
            error_mw=err,
            absolute_error_mw=abs_err,
            selected_publish_time=str(row["selected_publish_time"]) if pd.notna(row.get("selected_publish_time")) else None,
            cutoff_time=str(row["cutoff_time"]),
            versions_count=int(row.get("versions_count", 0)),
            is_eligible_forecast_present=bool(row.get("is_eligible_forecast_present", False)),
            versions=[]
        ))
        
    day_metrics = analytics_service.calculate_metrics(day_df)
    
    return DayForecastExplorerResponse(
        delivery_date=delivery_date,
        cutoff_time=cutoff_time,
        intervals=intervals,
        day_metrics=day_metrics
    )

@router.get("/{delivery_date}/{settlement_period}", response_model=ForecastIntervalDetail)
def get_interval_versions(
    delivery_date: str = Path(..., description="Delivery date in YYYY-MM-DD"),
    settlement_period: int = Path(..., ge=1, le=48, description="Settlement Period (1 to 48)"),
    cutoff_time: str = Query("11:00", description="Day-ahead decision cutoff time")
):
    try:
        res = forecast_selection_service.get_forecast_versions_for_interval(
            delivery_date_str=delivery_date,
            settlement_period=settlement_period,
            cutoff_time_str=cutoff_time
        )
        
        err = (res["decision_forecast_mw"] - res["actual_mw"]) if (res["decision_forecast_mw"] is not None and res["actual_mw"] is not None) else None
        abs_err = abs(err) if err is not None else None
        
        selected_pt = None
        for v in res["versions"]:
            if v["is_selected"]:
                selected_pt = v["publish_time"]
                break
                
        versions_items = [ForecastVersionItem(**v) for v in res["versions"]]
        
        return ForecastIntervalDetail(
            start_time=res["start_time"] or f"{delivery_date} SP{settlement_period}",
            settlement_date=delivery_date,
            settlement_period=settlement_period,
            actual_mw=res["actual_mw"],
            decision_forecast_mw=res["decision_forecast_mw"],
            latest_forecast_mw=versions_items[-1].generation_mw if versions_items else None,
            earliest_forecast_mw=versions_items[0].generation_mw if versions_items else None,
            error_mw=err,
            absolute_error_mw=abs_err,
            selected_publish_time=selected_pt,
            cutoff_time=res["cutoff_time"],
            versions_count=res["versions_count"],
            is_eligible_forecast_present=res["is_eligible_forecast_present"],
            versions=versions_items
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
