from io import StringIO
from fastapi import APIRouter, Response, Query, HTTPException
import pandas as pd

from app.services.forecast_selection import forecast_selection_service
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/exports", tags=["Exports"])

@router.get("/evaluation.csv")
def export_evaluation_csv(
    cutoff_time: str = Query("11:00"),
    matching_mode: str = Query("mapped")
):
    """Download cleaned evaluation dataset as CSV."""
    try:
        df = forecast_selection_service.select_forecasts(cutoff_time_str=cutoff_time, matching_mode=matching_mode)
        # Select clean columns
        cols = [
            "start_time", "settlement_date", "settlement_period",
            "actual_generation_mw", "decision_forecast_mw", "error_mw", "absolute_error_mw",
            "latest_forecast_mw", "earliest_forecast_mw", "selected_publish_time", "cutoff_time"
        ]
        available_cols = [c for c in cols if c in df.columns]
        csv_buffer = StringIO()
        df[available_cols].to_csv(csv_buffer, index=False)
        
        return Response(
            content=csv_buffer.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=wind_evaluation_jan2026_{cutoff_time.replace(':', '')}.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/daily-accuracy.csv")
def export_daily_accuracy_csv(
    cutoff_time: str = Query("11:00"),
    matching_mode: str = Query("mapped")
):
    """Download daily accuracy metrics as CSV."""
    try:
        df = forecast_selection_service.select_forecasts(cutoff_time_str=cutoff_time, matching_mode=matching_mode)
        daily_items = analytics_service.calculate_daily_metrics(df)
        
        df_daily = pd.DataFrame([d.model_dump() for d in daily_items])
        csv_buffer = StringIO()
        df_daily.to_csv(csv_buffer, index=False)
        
        return Response(
            content=csv_buffer.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=daily_accuracy_jan2026_{cutoff_time.replace(':', '')}.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
