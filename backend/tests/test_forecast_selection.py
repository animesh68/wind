import pandas as pd
import pytest
from datetime import datetime, timezone
from app.services.forecast_selection import ForecastSelectionService

def test_forecast_version_selection_logic(monkeypatch):
    service = ForecastSelectionService()
    
    mock_actuals = pd.DataFrame([
        {
            "start_time": "2026-01-02T12:00:00Z",
            "settlement_date": "2026-01-02",
            "settlement_period": 25,
            "actual_generation_mw": 5000.0,
            "is_valid": True
        }
    ])
    
    # 4 forecast versions published for this delivery time:
    # 1. Very early (Dec 31, 2025 04:00Z) -> 4000 MW
    # 2. Before cutoff (Jan 1, 2026 09:00Z) -> 4500 MW
    # 3. Exactly at cutoff (Jan 1, 2026 11:00Z) -> 4800 MW  <-- Latest Eligible!
    # 4. After cutoff (Jan 1, 2026 15:00Z) -> 5200 MW     <-- Look-ahead! Must NOT be selected!
    mock_forecasts = pd.DataFrame([
        {
            "publish_time": "2025-12-31T04:00:00Z",
            "start_time": "2026-01-02T12:00:00Z",
            "settlement_date": "2026-01-02",
            "settlement_period": 25,
            "forecast_generation_mw": 4000.0,
            "lead_time_hours": 56.0,
            "is_valid": True
        },
        {
            "publish_time": "2026-01-01T09:00:00Z",
            "start_time": "2026-01-02T12:00:00Z",
            "settlement_date": "2026-01-02",
            "settlement_period": 25,
            "forecast_generation_mw": 4500.0,
            "lead_time_hours": 27.0,
            "is_valid": True
        },
        {
            "publish_time": "2026-01-01T11:00:00Z",
            "start_time": "2026-01-02T12:00:00Z",
            "settlement_date": "2026-01-02",
            "settlement_period": 25,
            "forecast_generation_mw": 4800.0,
            "lead_time_hours": 25.0,
            "is_valid": True
        },
        {
            "publish_time": "2026-01-01T15:00:00Z",
            "start_time": "2026-01-02T12:00:00Z",
            "settlement_date": "2026-01-02",
            "settlement_period": 25,
            "forecast_generation_mw": 5200.0,
            "lead_time_hours": 21.0,
            "is_valid": True
        }
    ])
    
    from app.storage.parquet_store import parquet_store
    monkeypatch.setattr(parquet_store, "load_df", lambda path, cache_key=None: mock_actuals if "actual" in cache_key else mock_forecasts)
    
    df_matched = service.select_forecasts(cutoff_time_str="11:00", matching_mode="exact")
    
    assert len(df_matched) == 1
    row = df_matched.iloc[0]
    # The decision-time forecast must be exactly the 11:00 publication (4800 MW)
    assert row["decision_forecast_mw"] == 4800.0
    assert row["selected_publish_time"] == "2026-01-01T11:00:00Z"
    # Latest historical forecast (prior to start_time) is the 15:00 publication (5200 MW)
    assert row["latest_forecast_mw"] == 5200.0
    # Earliest is 4000 MW
    assert row["earliest_forecast_mw"] == 4000.0
    # Error: 4800 - 5000 = -200 MW
    assert row["error_mw"] == -200.0

def test_missing_eligible_forecast_remains_missing(monkeypatch):
    service = ForecastSelectionService()
    
    mock_actuals = pd.DataFrame([
        {
            "start_time": "2026-01-03T10:00:00Z",
            "settlement_date": "2026-01-03",
            "settlement_period": 21,
            "actual_generation_mw": 3500.0,
            "is_valid": True
        }
    ])
    
    # Only forecast published AFTER cutoff (at 14:00 on D-1)
    mock_forecasts = pd.DataFrame([
        {
            "publish_time": "2026-01-02T14:00:00Z",
            "start_time": "2026-01-03T10:00:00Z",
            "settlement_date": "2026-01-03",
            "settlement_period": 21,
            "forecast_generation_mw": 4200.0,
            "lead_time_hours": 20.0,
            "is_valid": True
        }
    ])
    
    from app.storage.parquet_store import parquet_store
    monkeypatch.setattr(parquet_store, "load_df", lambda path, cache_key=None: mock_actuals if "actual" in cache_key else mock_forecasts)
    
    df_matched = service.select_forecasts(cutoff_time_str="11:00", matching_mode="exact")
    row = df_matched.iloc[0]
    
    # Decision forecast must be None / NaN, NOT zero and NOT 4200
    assert pd.isna(row["decision_forecast_mw"])
    assert row["is_eligible_forecast_present"] == False
    assert row["selected_publish_time"] is None
    # Latest historical is still 4200
    assert row["latest_forecast_mw"] == 4200.0

def test_cutoff_boundary_inclusion_and_exclusion(monkeypatch):
    service = ForecastSelectionService()
    
    mock_actuals = pd.DataFrame([
        {
            "start_time": "2026-01-04T08:00:00Z",
            "settlement_date": "2026-01-04",
            "settlement_period": 17,
            "actual_generation_mw": 6000.0,
            "is_valid": True
        }
    ])
    
    # Version A: 10:59:59Z -> 5800 MW
    # Version B: 11:00:00Z -> 5900 MW (boundary exact match)
    # Version C: 11:00:01Z -> 6100 MW (1 second after cutoff -> ineligible)
    mock_forecasts = pd.DataFrame([
        {
            "publish_time": "2026-01-03T10:59:59Z",
            "start_time": "2026-01-04T08:00:00Z",
            "settlement_date": "2026-01-04",
            "settlement_period": 17,
            "forecast_generation_mw": 5800.0,
            "lead_time_hours": 21.0,
            "is_valid": True
        },
        {
            "publish_time": "2026-01-03T11:00:00Z",
            "start_time": "2026-01-04T08:00:00Z",
            "settlement_date": "2026-01-04",
            "settlement_period": 17,
            "forecast_generation_mw": 5900.0,
            "lead_time_hours": 21.0,
            "is_valid": True
        },
        {
            "publish_time": "2026-01-03T11:00:01Z",
            "start_time": "2026-01-04T08:00:00Z",
            "settlement_date": "2026-01-04",
            "settlement_period": 17,
            "forecast_generation_mw": 6100.0,
            "lead_time_hours": 21.0,
            "is_valid": True
        }
    ])
    
    from app.storage.parquet_store import parquet_store
    monkeypatch.setattr(parquet_store, "load_df", lambda path, cache_key=None: mock_actuals if "actual" in cache_key else mock_forecasts)
    
    df_matched = service.select_forecasts(cutoff_time_str="11:00", matching_mode="exact")
    row = df_matched.iloc[0]
    
    # Must select 5900 MW (11:00:00Z), strictly rejecting 6100 MW (11:00:01Z)
    assert row["decision_forecast_mw"] == 5900.0
    assert row["selected_publish_time"] == "2026-01-03T11:00:00Z"

def test_post_delivery_exclusion_from_latest_historical(monkeypatch):
    service = ForecastSelectionService()
    
    mock_actuals = pd.DataFrame([
        {
            "start_time": "2026-01-05T12:00:00Z",
            "settlement_date": "2026-01-05",
            "settlement_period": 25,
            "actual_generation_mw": 7000.0,
            "is_valid": True
        }
    ])
    
    # Version 1: Day ahead (Jan 4, 10:00Z) -> 6800 MW
    # Version 2: Pre-delivery (Jan 5, 11:30Z <= start_time 12:00Z) -> 6950 MW
    # Version 3: Post-delivery publication (Jan 5, 13:00Z > start_time 12:00Z) -> 7100 MW
    mock_forecasts = pd.DataFrame([
        {
            "publish_time": "2026-01-04T10:00:00Z",
            "start_time": "2026-01-05T12:00:00Z",
            "settlement_date": "2026-01-05",
            "settlement_period": 25,
            "forecast_generation_mw": 6800.0,
            "lead_time_hours": 26.0,
            "is_valid": True
        },
        {
            "publish_time": "2026-01-05T11:30:00Z",
            "start_time": "2026-01-05T12:00:00Z",
            "settlement_date": "2026-01-05",
            "settlement_period": 25,
            "forecast_generation_mw": 6950.0,
            "lead_time_hours": 0.5,
            "is_valid": True
        },
        {
            "publish_time": "2026-01-05T13:00:00Z",
            "start_time": "2026-01-05T12:00:00Z",
            "settlement_date": "2026-01-05",
            "settlement_period": 25,
            "forecast_generation_mw": 7100.0,
            "lead_time_hours": -1.0,
            "is_valid": True
        }
    ])
    
    from app.storage.parquet_store import parquet_store
    monkeypatch.setattr(parquet_store, "load_df", lambda path, cache_key=None: mock_actuals if "actual" in cache_key else mock_forecasts)
    
    df_matched = service.select_forecasts(cutoff_time_str="11:00", matching_mode="exact")
    row = df_matched.iloc[0]
    
    # Latest historical forecast prior to delivery start must be 6950 MW, not 7100 MW
    assert row["latest_forecast_mw"] == 6950.0
