from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np

from app.config import settings
from app.core.logging import logger
from app.core.timestamps import (
    parse_iso_datetime,
    get_day_ahead_cutoff,
    format_iso_utc,
    calculate_settlement_period
)
from app.storage.parquet_store import parquet_store

class ForecastSelectionService:
    """
    Implements version selection for day-ahead energy procurement decisions,
    preventing look-ahead bias and tracking full forecast evolution.
    """

    def __init__(self):
        self._selection_cache: Dict[Tuple[str, str], pd.DataFrame] = {}

    def clear_cache(self):
        self._selection_cache.clear()

    def select_forecasts(
        self,
        cutoff_time_str: str = "11:00",
        matching_mode: str = "mapped"  # 'mapped' (half-hourly mapped) or 'exact' (hourly timestamps only)
    ) -> pd.DataFrame:
        """
        Select the latest eligible forecast published on or before the day-ahead decision cutoff.
        """
        cache_key = (cutoff_time_str, matching_mode)
        if cache_key in self._selection_cache:
            return self._selection_cache[cache_key].copy()

        df_actuals = parquet_store.load_df(settings.ACTUAL_PARQUET, cache_key="actual_generation")
        df_forecasts = parquet_store.load_df(settings.FORECAST_VERSIONS_PARQUET, cache_key="forecast_versions")
        
        if df_actuals is None or df_forecasts is None:
            raise ValueError("Datasets not loaded. Ingestion must run first.")
            
        fc = df_forecasts.copy()
        fc["pub_dt"] = pd.to_datetime(fc["publish_time"], utc=True)
        fc["start_dt"] = pd.to_datetime(fc["start_time"], utc=True)
        
        ac = df_actuals.copy()
        ac["start_dt"] = pd.to_datetime(ac["start_time"], utc=True)
        
        delivery_dates = sorted(ac["settlement_date"].unique())
        
        selected_records = []
        
        for d_str in delivery_dates:
            d_obj = datetime.strptime(d_str, "%Y-%m-%d").date()
            cutoff_dt = get_day_ahead_cutoff(d_obj, cutoff_time_str)
            cutoff_iso = format_iso_utc(cutoff_dt)
            
            fc_day = fc[fc["settlement_date"] == d_str]
            
            for start_iso, group in fc_day.groupby("start_time"):
                earliest_row = group.sort_values("pub_dt").iloc[0]
                earliest_mw = float(earliest_row["forecast_generation_mw"])
                
                # Latest historical forecast (published prior to delivery start)
                pre_delivery = group[group["pub_dt"] <= group["start_dt"]]
                if not pre_delivery.empty:
                    latest_row = pre_delivery.sort_values("pub_dt").iloc[-1]
                else:
                    latest_row = group.sort_values("pub_dt").iloc[-1]
                latest_mw = float(latest_row["forecast_generation_mw"])
                
                # Decision-time eligible forecasts: publish_time <= cutoff_dt
                eligible = group[group["pub_dt"] <= cutoff_dt]
                
                if not eligible.empty:
                    decision_row = eligible.sort_values("pub_dt").iloc[-1]
                    decision_mw = float(decision_row["forecast_generation_mw"])
                    selected_pub_time = str(decision_row["publish_time"])
                    has_eligible = True
                else:
                    decision_mw = None
                    selected_pub_time = None
                    has_eligible = False
                    
                selected_records.append({
                    "target_start_time": str(start_iso),
                    "settlement_date": str(d_str),
                    "decision_forecast_mw": decision_mw,
                    "latest_forecast_mw": latest_mw,
                    "earliest_forecast_mw": earliest_mw,
                    "selected_publish_time": selected_pub_time,
                    "cutoff_time": cutoff_iso,
                    "versions_count": len(group),
                    "is_eligible_forecast_present": has_eligible
                })
                
        df_selected = pd.DataFrame(selected_records)
        
        if matching_mode == "exact":
            # Match directly on start_time
            merged = pd.merge(
                ac,
                df_selected,
                left_on=["start_time", "settlement_date"],
                right_on=["target_start_time", "settlement_date"],
                how="left"
            )
        else:
            # Map hourly forecasts to both half-hourly settlement periods in each hour
            ac["hourly_target_time"] = ac["start_dt"].dt.floor("1h").dt.strftime("%Y-%m-%dT%H:00:00Z")
            merged = pd.merge(
                ac,
                df_selected,
                left_on=["hourly_target_time", "settlement_date"],
                right_on=["target_start_time", "settlement_date"],
                how="left"
            )
            if "hourly_target_time" in merged.columns:
                merged = merged.drop(columns=["hourly_target_time"])
                
        if "target_start_time" in merged.columns:
            merged = merged.drop(columns=["target_start_time"])
            
        merged["error_mw"] = merged["decision_forecast_mw"] - merged["actual_generation_mw"]
        merged["absolute_error_mw"] = merged["error_mw"].abs()
        
        merged["latest_error_mw"] = merged["latest_forecast_mw"] - merged["actual_generation_mw"]
        merged["latest_absolute_error_mw"] = merged["latest_error_mw"].abs()
        
        self._selection_cache[cache_key] = merged
        return merged.copy()

    def get_forecast_versions_for_interval(
        self,
        delivery_date_str: str,
        settlement_period: int,
        cutoff_time_str: str = "11:00"
    ) -> Dict[str, Any]:
        """
        Get all published forecast versions for a specific delivery date and settlement period.
        """
        df_actuals = parquet_store.load_df(settings.ACTUAL_PARQUET, cache_key="actual_generation")
        df_forecasts = parquet_store.load_df(settings.FORECAST_VERSIONS_PARQUET, cache_key="forecast_versions")
        
        if df_actuals is None or df_forecasts is None:
            raise ValueError("Datasets not loaded.")
            
        d_obj = datetime.strptime(delivery_date_str, "%Y-%m-%d").date()
        cutoff_dt = get_day_ahead_cutoff(d_obj, cutoff_time_str)
        cutoff_iso = format_iso_utc(cutoff_dt)
        
        # Get actual observation for this SP
        act_row = df_actuals[(df_actuals["settlement_date"] == delivery_date_str) & (df_actuals["settlement_period"] == settlement_period)]
        actual_mw = float(act_row["actual_generation_mw"].values[0]) if not act_row.empty else None
        start_time_iso = str(act_row["start_time"].values[0]) if not act_row.empty else None
        
        # In WINDFOR, each forecast target is hourly. Hour corresponding to SP is (SP - 1) // 2
        hour = (settlement_period - 1) // 2
        fc_hour = df_forecasts[
            (df_forecasts["settlement_date"] == delivery_date_str) &
            (pd.to_datetime(df_forecasts["start_time"], utc=True).dt.hour == hour)
        ].copy()
        
        if fc_hour.empty:
            return {
                "start_time": start_time_iso,
                "settlement_date": delivery_date_str,
                "settlement_period": settlement_period,
                "actual_mw": actual_mw,
                "decision_forecast_mw": None,
                "cutoff_time": cutoff_iso,
                "versions_count": 0,
                "is_eligible_forecast_present": False,
                "versions": []
            }
            
        fc_hour["pub_dt"] = pd.to_datetime(fc_hour["publish_time"], utc=True)
        fc_hour = fc_hour.sort_values("pub_dt")
        
        eligible = fc_hour[fc_hour["pub_dt"] <= cutoff_dt]
        latest_eligible_pub = eligible["publish_time"].iloc[-1] if not eligible.empty else None
        
        version_items = []
        for _, row in fc_hour.iterrows():
            pub_time_str = str(row["publish_time"])
            is_elig = bool(row["pub_dt"] <= cutoff_dt)
            is_sel = bool(pub_time_str == latest_eligible_pub)
            gen = float(row["forecast_generation_mw"])
            lead_h = float(row["lead_time_hours"])
            
            version_items.append({
                "publish_time": pub_time_str,
                "generation_mw": gen,
                "is_eligible": is_elig,
                "is_selected": is_sel,
                "lead_time_hours": round(lead_h, 1),
                "cutoff_time": cutoff_iso
            })
            
        decision_mw = None
        if not eligible.empty:
            decision_mw = float(eligible.iloc[-1]["forecast_generation_mw"])
            
        return {
            "start_time": start_time_iso,
            "settlement_date": delivery_date_str,
            "settlement_period": settlement_period,
            "actual_mw": actual_mw,
            "decision_forecast_mw": decision_mw,
            "cutoff_time": cutoff_iso,
            "versions_count": len(version_items),
            "is_eligible_forecast_present": decision_mw is not None,
            "versions": version_items
        }

forecast_selection_service = ForecastSelectionService()
