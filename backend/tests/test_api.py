from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "HEALTHY"
    assert data["data_loaded"] is True

def test_market_overview():
    resp = client.get("/api/overview?cutoff_time=11:00&matching_mode=mapped")
    assert resp.status_code == 200
    data = resp.json()
    assert "metrics" in data
    assert data["metrics"]["matched_intervals"] == 1488
    assert "insights" in data
    assert len(data["insights"]) > 0
    assert len(data["time_series"]) == 1488

def test_forecast_explorer_dates():
    resp = client.get("/api/forecasts/dates")
    assert resp.status_code == 200
    dates = resp.json()
    assert len(dates) == 31
    assert "2026-01-01" in dates
    assert "2026-01-31" in dates

def test_forecast_day_explorer():
    resp = client.get("/api/forecasts/2026-01-15?cutoff_time=11:00")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["intervals"]) == 48
    assert data["day_metrics"]["matched_intervals"] == 48

def test_forecast_interval_details():
    resp = client.get("/api/forecasts/2026-01-15/24?cutoff_time=11:00")
    assert resp.status_code == 200
    data = resp.json()
    assert data["settlement_period"] == 24
    assert len(data["versions"]) > 0

def test_analytics_summary():
    resp = client.get("/api/analytics/summary?cutoff_time=11:00&matching_mode=mapped")
    assert resp.status_code == 200
    data = resp.json()
    assert "metrics" in data
    assert len(data["daily_metrics"]) == 31
    assert len(data["hourly_metrics"]) == 24
    assert len(data["scatter_points"]) > 0
    assert len(data["error_histogram"]) > 0

def test_forecast_evolution():
    resp = client.get("/api/evolution?delivery_date=2026-01-15&settlement_period=24&cutoff_time=11:00")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["points"]) > 0
    assert data["revision_spread_mw"] >= 0

def test_data_quality():
    resp = client.get("/api/data-quality")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_actual_records"] == 1488
    assert data["actual_completeness_pct"] == 100.0

def test_csv_exports():
    r1 = client.get("/api/exports/evaluation.csv")
    assert r1.status_code == 200
    assert "text/csv" in r1.headers["content-type"]
    assert "start_time" in r1.text

    r2 = client.get("/api/exports/daily-accuracy.csv")
    assert r2.status_code == 200
    assert "text/csv" in r2.headers["content-type"]
    assert "settlement_date" in r2.text

