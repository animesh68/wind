from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Health check
class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    data_loaded: bool
    ingestion_timestamp: Optional[str] = None
    delivery_date_range: Optional[str] = None

# KPI Metrics
class AccuracyMetrics(BaseModel):
    mae_mw: float = Field(..., description="Mean Absolute Error in MW")
    rmse_mw: float = Field(..., description="Root Mean Squared Error in MW")
    mbe_mw: float = Field(..., description="Mean Bias Error in MW (+ overforecast, - underforecast)")
    wape_percent: float = Field(..., description="Weighted Absolute Percentage Error (%)")
    accuracy_indicator_percent: float = Field(..., description="Derived WAPE-based Accuracy Indicator (100 - WAPE, clamped >= 0)")
    max_absolute_error_mw: float = Field(..., description="Maximum Absolute Error in MW")
    median_absolute_error_mw: float = Field(..., description="Median Absolute Error in MW")
    overforecasting_pct: float = Field(..., description="Percentage of intervals with overforecasting (forecast > actual)")
    underforecasting_pct: float = Field(..., description="Percentage of intervals with underforecasting (forecast < actual)")
    matched_intervals: int = Field(..., description="Number of intervals evaluated")
    total_forecast_mwh: float = Field(..., description="Total forecasted energy in MWh (sum of MW * 0.5h)")
    total_actual_mwh: float = Field(..., description="Total actual energy in MWh (sum of MW * 0.5h)")

# Dynamic Analytical Insight
class AnalyticalInsight(BaseModel):
    category: str
    title: str
    description: str
    value: Optional[str] = None
    severity: str = "info"  # info, warning, success

# Time series point for charts
class TimeSeriesDataPoint(BaseModel):
    start_time: str
    settlement_date: str
    settlement_period: int
    actual_mw: Optional[float] = None
    forecast_mw: Optional[float] = None
    error_mw: Optional[float] = None  # forecast - actual
    absolute_error_mw: Optional[float] = None
    publish_time: Optional[str] = None
    is_missing: bool = False

# Market Overview Response
class MarketOverviewResponse(BaseModel):
    metrics: AccuracyMetrics
    cutoff_time: str
    matching_mode: str
    insights: List[AnalyticalInsight]
    time_series: List[TimeSeriesDataPoint]
    daily_summaries: List[Dict[str, Any]]

# Forecast Version Item
class ForecastVersionItem(BaseModel):
    publish_time: str
    generation_mw: float
    is_eligible: bool
    is_selected: bool
    lead_time_hours: float
    cutoff_time: str

# Forecast Interval Detail
class ForecastIntervalDetail(BaseModel):
    start_time: str
    settlement_date: str
    settlement_period: int
    actual_mw: Optional[float] = None
    decision_forecast_mw: Optional[float] = None
    latest_forecast_mw: Optional[float] = None
    earliest_forecast_mw: Optional[float] = None
    error_mw: Optional[float] = None
    absolute_error_mw: Optional[float] = None
    selected_publish_time: Optional[str] = None
    cutoff_time: str
    versions_count: int
    is_eligible_forecast_present: bool
    versions: List[ForecastVersionItem] = []

# Day Forecast Explorer Response
class DayForecastExplorerResponse(BaseModel):
    delivery_date: str
    cutoff_time: str
    intervals: List[ForecastIntervalDetail]
    day_metrics: AccuracyMetrics

# Accuracy Daily Item
class DailyAccuracyItem(BaseModel):
    settlement_date: str
    mae_mw: float
    rmse_mw: float
    mbe_mw: float
    wape_percent: float
    accuracy_indicator_percent: float
    max_absolute_error_mw: float
    actual_mwh: float
    forecast_mwh: float
    intervals_count: int

# Accuracy Hourly Item
class HourlyAccuracyItem(BaseModel):
    hour_of_day: int
    hour_label: str
    mae_mw: float
    rmse_mw: float
    mbe_mw: float
    wape_percent: float
    avg_actual_mw: float
    avg_forecast_mw: float
    intervals_count: int

# Scatter point
class ScatterPoint(BaseModel):
    start_time: str
    settlement_date: str
    settlement_period: int
    actual_mw: float
    forecast_mw: float
    error_mw: float

# Error histogram bin
class ErrorHistogramBin(BaseModel):
    bin_start: float
    bin_end: float
    bin_center: float
    count: int
    percentage: float

# Accuracy Summary Response
class AccuracySummaryResponse(BaseModel):
    metrics: AccuracyMetrics
    daily_metrics: List[DailyAccuracyItem]
    hourly_metrics: List[HourlyAccuracyItem]
    scatter_points: List[ScatterPoint]
    error_histogram: List[ErrorHistogramBin]
    observations_text: str

# Forecast Evolution Point
class EvolutionPoint(BaseModel):
    publish_time: str
    generation_mw: float
    lead_time_hours: float
    is_before_cutoff: bool
    is_decision_forecast: bool
    error_vs_actual_mw: Optional[float] = None

# Forecast Evolution Response
class ForecastEvolutionResponse(BaseModel):
    delivery_date: str
    start_time: str
    settlement_period: int
    actual_mw: Optional[float] = None
    cutoff_time: str
    earliest_forecast_mw: Optional[float] = None
    decision_forecast_mw: Optional[float] = None
    latest_forecast_mw: Optional[float] = None
    revision_spread_mw: float
    points: List[EvolutionPoint]
    explanation: str

# Data Quality Metrics
class DataQualityResponse(BaseModel):
    total_actual_records: int
    total_forecast_records: int
    expected_settlement_intervals: int  # 1488
    actual_completeness_pct: float
    forecast_completeness_pct: float
    matched_observations_exact: int
    matched_observations_mapped: int
    missing_intervals_exact: int
    missing_intervals_mapped: int
    duplicate_actuals: int
    duplicate_forecasts: int
    invalid_generation_records: int
    earliest_actual_time: Optional[str] = None
    latest_actual_time: Optional[str] = None
    earliest_forecast_publish_time: Optional[str] = None
    latest_forecast_publish_time: Optional[str] = None
    last_ingestion_timestamp: Optional[str] = None
    source_api_status: str
    data_quality_warnings: List[str]
    assumptions: List[str]
    ingestion_logs: List[Dict[str, Any]]
