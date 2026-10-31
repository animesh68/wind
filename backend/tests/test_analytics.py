import math
import numpy as np
import pandas as pd
import pytest
from app.services.analytics_service import analytics_service

def test_manual_metrics_calculation():
    # Synthetic test fixture:
    # Actuals:   [100, 200, 300, 400]
    # Forecasts: [120, 190, 330, 380]
    # Errors:    [+20, -10, +30, -20]
    # Abs Error: [ 20,  10,  30,  20]  -> Mean = 20.0 (MAE)
    # Sq Error:  [400, 100, 900, 400]  -> Mean = 450.0 -> RMSE = sqrt(450) ≈ 21.21
    # MBE:       (20 - 10 + 30 - 20) / 4 = 20 / 4 = +5.0
    # Sum Abs Error: 80
    # Sum Actual:    1000
    # WAPE: (80 / 1000) * 100 = 8.0%
    # Accuracy: 100 - 8.0 = 92.0%
    df = pd.DataFrame({
        "actual_generation_mw": [100.0, 200.0, 300.0, 400.0],
        "decision_forecast_mw": [120.0, 190.0, 330.0, 380.0]
    })
    
    m = analytics_service.calculate_metrics(df)
    assert m.mae_mw == 20.0
    assert math.isclose(m.rmse_mw, 21.21, rel_tol=1e-2)
    assert m.mbe_mw == 5.0
    assert m.wape_percent == 8.0
    assert m.accuracy_indicator_percent == 92.0
    assert m.max_absolute_error_mw == 30.0
    assert m.median_absolute_error_mw == 20.0
    assert m.overforecasting_pct == 50.0
    assert m.underforecasting_pct == 50.0
    assert m.matched_intervals == 4
    # Energy: (100+200+300+400)*0.5 = 500 MWh
    assert m.total_actual_mwh == 500.0
    # Forecast Energy: (120+190+330+380)*0.5 = 510 MWh
    assert m.total_forecast_mwh == 510.0

def test_empty_dataset_handling():
    df = pd.DataFrame({
        "actual_generation_mw": [],
        "decision_forecast_mw": []
    })
    m = analytics_service.calculate_metrics(df)
    assert m.matched_intervals == 0
    assert m.mae_mw == 0.0
    assert m.wape_percent == 0.0

def test_zero_actual_generation():
    df = pd.DataFrame({
        "actual_generation_mw": [0.0, 0.0],
        "decision_forecast_mw": [50.0, 50.0]
    })
    m = analytics_service.calculate_metrics(df)
    assert m.mae_mw == 50.0
    # WAPE safely handles zero sum without ZeroDivisionError
    assert m.wape_percent == 0.0
