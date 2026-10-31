export interface AccuracyMetrics {
  mae_mw: number;
  rmse_mw: number;
  mbe_mw: number;
  wape_percent: number;
  accuracy_indicator_percent: number;
  max_absolute_error_mw: number;
  median_absolute_error_mw: number;
  overforecasting_pct: number;
  underforecasting_pct: number;
  matched_intervals: number;
  total_forecast_mwh: number;
  total_actual_mwh: number;
}

export interface AnalyticalInsight {
  category: string;
  title: string;
  description: string;
  value?: string;
  severity: 'info' | 'warning' | 'success';
}

export interface TimeSeriesDataPoint {
  start_time: string;
  settlement_date: string;
  settlement_period: number;
  actual_mw: number | null;
  forecast_mw: number | null;
  error_mw: number | null;
  absolute_error_mw: number | null;
  publish_time: string | null;
  is_missing: boolean;
}

export interface DailySummaryItem {
  settlement_date: string;
  mae_mw: number;
  rmse_mw: number;
  mbe_mw: number;
  wape_percent: number;
  accuracy_indicator_percent: number;
  actual_mwh: number;
  forecast_mwh: number;
  intervals_count: number;
}

export interface MarketOverviewResponse {
  metrics: AccuracyMetrics;
  cutoff_time: string;
  matching_mode: string;
  insights: AnalyticalInsight[];
  time_series: TimeSeriesDataPoint[];
  daily_summaries: DailySummaryItem[];
}

export interface ForecastVersionItem {
  publish_time: string;
  generation_mw: number;
  is_eligible: boolean;
  is_selected: boolean;
  lead_time_hours: number;
  cutoff_time: string;
}

export interface ForecastIntervalDetail {
  start_time: string;
  settlement_date: string;
  settlement_period: number;
  actual_mw: number | null;
  decision_forecast_mw: number | null;
  latest_forecast_mw: number | null;
  earliest_forecast_mw: number | null;
  error_mw: number | null;
  absolute_error_mw: number | null;
  selected_publish_time: string | null;
  cutoff_time: string;
  versions_count: number;
  is_eligible_forecast_present: boolean;
  versions: ForecastVersionItem[];
}

export interface DayForecastExplorerResponse {
  delivery_date: string;
  cutoff_time: string;
  intervals: ForecastIntervalDetail[];
  day_metrics: AccuracyMetrics;
}

export interface HourlyAccuracyItem {
  hour_of_day: number;
  hour_label: string;
  mae_mw: number;
  rmse_mw: number;
  mbe_mw: number;
  wape_percent: number;
  avg_actual_mw: number;
  avg_forecast_mw: number;
  intervals_count: number;
}

export interface ScatterPoint {
  start_time: string;
  settlement_date: string;
  settlement_period: number;
  actual_mw: number;
  forecast_mw: number;
  error_mw: number;
}

export interface ErrorHistogramBin {
  bin_start: number;
  bin_end: number;
  bin_center: number;
  count: number;
  percentage: number;
}

export interface AccuracySummaryResponse {
  metrics: AccuracyMetrics;
  daily_metrics: DailySummaryItem[];
  hourly_metrics: HourlyAccuracyItem[];
  scatter_points: ScatterPoint[];
  error_histogram: ErrorHistogramBin[];
  observations_text: string;
}

export interface EvolutionPoint {
  publish_time: string;
  generation_mw: number;
  lead_time_hours: number;
  is_before_cutoff: boolean;
  is_decision_forecast: boolean;
  error_vs_actual_mw: number | null;
}

export interface ForecastEvolutionResponse {
  delivery_date: string;
  start_time: string;
  settlement_period: number;
  actual_mw: number | null;
  cutoff_time: string;
  earliest_forecast_mw: number | null;
  decision_forecast_mw: number | null;
  latest_forecast_mw: number | null;
  revision_spread_mw: number;
  points: EvolutionPoint[];
  explanation: string;
}

export interface DataQualityResponse {
  total_actual_records: number;
  total_forecast_records: number;
  expected_settlement_intervals: number;
  actual_completeness_pct: number;
  forecast_completeness_pct: number;
  matched_observations_exact: number;
  matched_observations_mapped: number;
  missing_intervals_exact: number;
  missing_intervals_mapped: number;
  duplicate_actuals: number;
  duplicate_forecasts: number;
  invalid_generation_records: number;
  earliest_actual_time: string | null;
  latest_actual_time: string | null;
  earliest_forecast_publish_time: string | null;
  latest_forecast_publish_time: string | null;
  last_ingestion_timestamp: string | null;
  source_api_status: string;
  data_quality_warnings: string[];
  assumptions: string[];
  ingestion_logs: Array<{ timestamp: string; event: string; details: string }>;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  data_loaded: boolean;
  ingestion_timestamp: string | null;
  delivery_date_range: string | null;
}

