import math
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

from app.models.schemas import (
    AccuracyMetrics,
    AnalyticalInsight,
    DailyAccuracyItem,
    HourlyAccuracyItem,
    ScatterPoint,
    ErrorHistogramBin
)
from app.core.logging import logger

class AnalyticsService:
    """Quantitative analytics engine for wind generation forecast accuracy."""

    def calculate_metrics(self, df_matched: pd.DataFrame) -> AccuracyMetrics:
        """
        Calculate headline accuracy metrics for a matched DataFrame.
        error = forecast - actual
        """
        valid = df_matched[
            df_matched["actual_generation_mw"].notna() &
            df_matched["decision_forecast_mw"].notna()
        ].copy()
        
        n = len(valid)
        if n == 0:
            return AccuracyMetrics(
                mae_mw=0.0,
                rmse_mw=0.0,
                mbe_mw=0.0,
                wape_percent=0.0,
                accuracy_indicator_percent=0.0,
                max_absolute_error_mw=0.0,
                median_absolute_error_mw=0.0,
                overforecasting_pct=0.0,
                underforecasting_pct=0.0,
                matched_intervals=0,
                total_forecast_mwh=0.0,
                total_actual_mwh=0.0
            )
            
        actual = valid["actual_generation_mw"].values
        forecast = valid["decision_forecast_mw"].values
        
        errors = forecast - actual
        abs_errors = np.abs(errors)
        
        mae = float(np.mean(abs_errors))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        mbe = float(np.mean(errors))
        
        sum_abs_errors = float(np.sum(abs_errors))
        sum_actual = float(np.sum(np.abs(actual)))
        
        if sum_actual > 0:
            wape = float((sum_abs_errors / sum_actual) * 100.0)
        else:
            wape = 0.0
            
        accuracy_indicator = max(0.0, 100.0 - wape)
        
        max_abs_err = float(np.max(abs_errors))
        median_abs_err = float(np.median(abs_errors))
        
        overforecast_count = int(np.sum(errors > 0))
        underforecast_count = int(np.sum(errors < 0))
        
        overforecast_pct = round((overforecast_count / n) * 100.0, 2)
        underforecast_pct = round((underforecast_count / n) * 100.0, 2)
        
        # Energy in MWh: each half-hour MW observation is multiplied by 0.5 hours
        total_forecast_mwh = float(np.sum(forecast) * 0.5)
        total_actual_mwh = float(np.sum(actual) * 0.5)
        
        return AccuracyMetrics(
            mae_mw=round(mae, 2),
            rmse_mw=round(rmse, 2),
            mbe_mw=round(mbe, 2),
            wape_percent=round(wape, 2),
            accuracy_indicator_percent=round(accuracy_indicator, 2),
            max_absolute_error_mw=round(max_abs_err, 2),
            median_absolute_error_mw=round(median_abs_err, 2),
            overforecasting_pct=overforecast_pct,
            underforecasting_pct=underforecast_pct,
            matched_intervals=n,
            total_forecast_mwh=round(total_forecast_mwh, 2),
            total_actual_mwh=round(total_actual_mwh, 2)
        )

    def calculate_daily_metrics(self, df_matched: pd.DataFrame) -> List[DailyAccuracyItem]:
        """Aggregate metrics by calendar delivery date."""
        daily_items = []
        for date_str, group in df_matched.groupby("settlement_date"):
            metrics = self.calculate_metrics(group)
            daily_items.append(DailyAccuracyItem(
                settlement_date=date_str,
                mae_mw=metrics.mae_mw,
                rmse_mw=metrics.rmse_mw,
                mbe_mw=metrics.mbe_mw,
                wape_percent=metrics.wape_percent,
                accuracy_indicator_percent=metrics.accuracy_indicator_percent,
                max_absolute_error_mw=metrics.max_absolute_error_mw,
                actual_mwh=metrics.total_actual_mwh,
                forecast_mwh=metrics.total_forecast_mwh,
                intervals_count=metrics.matched_intervals
            ))
        return sorted(daily_items, key=lambda x: x.settlement_date)

    def calculate_hourly_metrics(self, df_matched: pd.DataFrame) -> List[HourlyAccuracyItem]:
        """Aggregate metrics by hour of day (0 to 23)."""
        valid = df_matched[
            df_matched["actual_generation_mw"].notna() &
            df_matched["decision_forecast_mw"].notna()
        ].copy()
        
        valid["dt"] = pd.to_datetime(valid["start_time"], utc=True)
        valid["hour"] = valid["dt"].dt.hour
        
        hourly_items = []
        for hour, group in valid.groupby("hour"):
            metrics = self.calculate_metrics(group)
            avg_act = float(group["actual_generation_mw"].mean())
            avg_fc = float(group["decision_forecast_mw"].mean())
            
            hourly_items.append(HourlyAccuracyItem(
                hour_of_day=int(hour),
                hour_label=f"{int(hour):02d}:00",
                mae_mw=metrics.mae_mw,
                rmse_mw=metrics.rmse_mw,
                mbe_mw=metrics.mbe_mw,
                wape_percent=metrics.wape_percent,
                avg_actual_mw=round(avg_act, 2),
                avg_forecast_mw=round(avg_fc, 2),
                intervals_count=metrics.matched_intervals
            ))
        return sorted(hourly_items, key=lambda x: x.hour_of_day)

    def generate_scatter_points(self, df_matched: pd.DataFrame, max_points: int = 1500) -> List[ScatterPoint]:
        """Generate actual vs forecast points for correlation scatter plot."""
        valid = df_matched[
            df_matched["actual_generation_mw"].notna() &
            df_matched["decision_forecast_mw"].notna()
        ]
        
        points = []
        for _, r in valid.head(max_points).iterrows():
            points.append(ScatterPoint(
                start_time=str(r["start_time"]),
                settlement_date=str(r["settlement_date"]),
                settlement_period=int(r["settlement_period"]),
                actual_mw=round(float(r["actual_generation_mw"]), 1),
                forecast_mw=round(float(r["decision_forecast_mw"]), 1),
                error_mw=round(float(r["error_mw"]), 1)
            ))
        return points

    def generate_error_histogram(self, df_matched: pd.DataFrame, bins_count: int = 20) -> List[ErrorHistogramBin]:
        """Generate error distribution frequency bins."""
        valid = df_matched[
            df_matched["error_mw"].notna()
        ]
        errors = valid["error_mw"].values
        if len(errors) == 0:
            return []
            
        counts, bin_edges = np.histogram(errors, bins=bins_count)
        total = len(errors)
        
        hist_bins = []
        for i in range(len(counts)):
            b_start = float(bin_edges[i])
            b_end = float(bin_edges[i+1])
            b_center = (b_start + b_end) / 2.0
            hist_bins.append(ErrorHistogramBin(
                bin_start=round(b_start, 1),
                bin_end=round(b_end, 1),
                bin_center=round(b_center, 1),
                count=int(counts[i]),
                percentage=round((int(counts[i]) / total) * 100.0, 2)
            ))
        return hist_bins

    def generate_dynamic_insights(self, df_matched: pd.DataFrame) -> List[AnalyticalInsight]:
        """Compute factual analytical insights directly from the processed dataset."""
        insights = []
        daily_metrics = self.calculate_daily_metrics(df_matched)
        if not daily_metrics:
            return insights
            
        # 1. Best accuracy day (Lowest WAPE / Highest Accuracy)
        best_day = min(daily_metrics, key=lambda x: x.wape_percent if x.wape_percent > 0 else 999)
        insights.append(AnalyticalInsight(
            category="Best Day Performance",
            title=f"Highest Forecast Accuracy: {best_day.settlement_date}",
            description=f"Recorded lowest WAPE of {best_day.wape_percent:.1f}% (derived accuracy {best_day.accuracy_indicator_percent:.1f}%) with MAE of {best_day.mae_mw:.1f} MW.",
            value=f"{best_day.accuracy_indicator_percent:.1f}% Accuracy",
            severity="success"
        ))
        
        # 2. Worst accuracy day (Highest WAPE / Highest MAE)
        worst_day = max(daily_metrics, key=lambda x: x.mae_mw)
        insights.append(AnalyticalInsight(
            category="Volatility Peak",
            title=f"Maximum Forecast Discrepancy: {worst_day.settlement_date}",
            description=f"Experienced maximum daily MAE of {worst_day.mae_mw:.1f} MW and max peak interval error of {worst_day.max_absolute_error_mw:.1f} MW.",
            value=f"{worst_day.mae_mw:.1f} MW MAE",
            severity="warning"
        ))
        
        # 3. Overall Market Bias
        overall = self.calculate_metrics(df_matched)
        bias_type = "Overforecasting (+)" if overall.mbe_mw > 0 else "Underforecasting (-)"
        severity = "warning" if abs(overall.mbe_mw) > 500 else "info"
        insights.append(AnalyticalInsight(
            category="Directional Bias",
            title=f"National Bias Tendency: {bias_type}",
            description=f"Mean Bias Error across January 2026 was {overall.mbe_mw:+.1f} MW. {overall.overforecasting_pct:.1f}% of intervals experienced overforecasting, while {overall.underforecasting_pct:.1f}% experienced underforecasting.",
            value=f"{overall.mbe_mw:+.1f} MW MBE",
            severity=severity
        ))
        
        # 4. Hourly vulnerability pattern
        hourly_metrics = self.calculate_hourly_metrics(df_matched)
        if hourly_metrics:
            highest_err_hour = max(hourly_metrics, key=lambda x: x.mae_mw)
            lowest_err_hour = min(hourly_metrics, key=lambda x: x.mae_mw)
            insights.append(AnalyticalInsight(
                category="Diurnal Pattern",
                title=f"Hourly Error Discrepancy",
                description=f"Forecast uncertainty peaked at {highest_err_hour.hour_label} (MAE {highest_err_hour.mae_mw:.1f} MW), compared to minimum error at {lowest_err_hour.hour_label} (MAE {lowest_err_hour.mae_mw:.1f} MW).",
                value=f"Peak {highest_err_hour.hour_label}",
                severity="info"
            ))
            
        return insights

analytics_service = AnalyticsService()

