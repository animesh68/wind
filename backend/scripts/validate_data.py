import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.storage.parquet_store import parquet_store
from app.config import settings
from app.services.forecast_selection import forecast_selection_service
from app.services.analytics_service import analytics_service
from app.services.quality_service import quality_service

def validate():
    print("=== Validating Ingested Parquet Datasets ===")
    df_act = parquet_store.load_df(settings.ACTUAL_PARQUET)
    df_fc = parquet_store.load_df(settings.FORECAST_VERSIONS_PARQUET)
    
    assert df_act is not None, "Actual generation Parquet missing!"
    assert df_fc is not None, "Forecast versions Parquet missing!"
    assert len(df_act) == 1488, f"Expected 1488 actual records, found {len(df_act)}"
    assert len(df_fc) > 10000, f"Expected >10000 forecast records, found {len(df_fc)}"
    
    print(f"[OK] Actual records: {len(df_act)}")
    print(f"[OK] Forecast records: {len(df_fc)}")
    
    # Test forecast selection with default cutoff 11:00
    df_matched = forecast_selection_service.select_forecasts(cutoff_time_str="11:00", matching_mode="mapped")
    print(f"[OK] Matched intervals (mapped): {len(df_matched)}")
    
    metrics = analytics_service.calculate_metrics(df_matched)
    print("\n--- Analytics Results (January 2026, 11:00 Cutoff) ---")
    print(f"MAE: {metrics.mae_mw} MW")
    print(f"RMSE: {metrics.rmse_mw} MW")
    print(f"MBE: {metrics.mbe_mw:+} MW")
    print(f"WAPE: {metrics.wape_percent}%")
    print(f"Accuracy Indicator: {metrics.accuracy_indicator_percent}%")
    print(f"Max Absolute Error: {metrics.max_absolute_error_mw} MW")
    print(f"Total Forecast Generation: {metrics.total_forecast_mwh:,.1f} MWh")
    print(f"Total Actual Generation: {metrics.total_actual_mwh:,.1f} MWh")
    print(f"Overforecasting Intervals: {metrics.overforecasting_pct}%")
    print(f"Underforecasting Intervals: {metrics.underforecasting_pct}%")
    print("----------------------------------------------------\n")
    
    quality = quality_service.evaluate_quality()
    print(f"[OK] Data completeness: {quality.actual_completeness_pct}%")
    print(f"[OK] Source API status: {quality.source_api_status}")
    print("\n=== Validation Completed Successfully! ===")

if __name__ == "__main__":
    validate()
