import pytest
from app.services.quality_service import quality_service

def test_quality_service_evaluation():
    res = quality_service.evaluate_quality()
    assert res.total_actual_records == 1488
    assert res.total_forecast_records > 10000
    assert res.expected_settlement_intervals == 1488
    assert res.actual_completeness_pct == 100.0
    assert res.duplicate_actuals == 0
    assert len(res.assumptions) > 0
    assert "ONLINE" in res.source_api_status

