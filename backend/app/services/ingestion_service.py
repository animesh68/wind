import json
from datetime import datetime, timezone
from typing import Dict, Any, List
import pandas as pd

from app.config import settings
from app.core.logging import logger
from app.core.timestamps import parse_iso_datetime, calculate_settlement_period, format_iso_utc
from app.services.elexon_client import elexon_client
from app.storage.parquet_store import parquet_store

class IngestionService:
    """Manages downloading, cleaning, validating and persisting raw Elexon datasets."""

    def ingest_actuals(self, start_date: str = "2026-01-01", end_date: str = "2026-01-31") -> pd.DataFrame:
        """Ingest FUELHH WIND records for the specified settlement date window."""
        logger.info(f"Starting actuals ingestion for {start_date} to {end_date}")
        raw_records = elexon_client.fetch_actual_generation(
            settlement_date_from=start_date,
            settlement_date_to=end_date,
            fuel_type="WIND"
        )
        
        # Save raw JSON backup
        raw_file = settings.RAW_ACTUALS_PATH / f"fuelhh_wind_{start_date}_{end_date}.json"
        with open(raw_file, "w", encoding="utf-8") as f:
            json.dump(raw_records, f)
        
        processed_rows = []
        for r in raw_records:
            fuel_type = r.get("fuelType")
            if fuel_type != "WIND":
                continue
            
            raw_start = r.get("startTime")
            raw_pub = r.get("publishTime")
            gen = r.get("generation")
            
            dt = parse_iso_datetime(raw_start)
            pub_dt = parse_iso_datetime(raw_pub) if raw_pub else dt
            settlement_date, sp = calculate_settlement_period(dt)
            
            processed_rows.append({
                "start_time": format_iso_utc(dt),
                "publish_time": format_iso_utc(pub_dt),
                "settlement_date": str(r.get("settlementDate") or settlement_date),
                "settlement_period": int(r.get("settlementPeriod") or sp),
                "fuel_type": fuel_type,
                "actual_generation_mw": float(gen) if gen is not None else None,
                "is_valid": gen is not None and float(gen) >= 0
            })
            
        df = pd.DataFrame(processed_rows)
        # Deduplicate by start_time if any duplicates exist
        df = df.drop_duplicates(subset=["start_time"]).sort_values("start_time").reset_index(drop=True)
        
        # Persist Parquet
        parquet_store.save_df(df, settings.ACTUAL_PARQUET, cache_key="actual_generation")
        logger.info(f"Ingested {len(df)} actual wind generation records")
        return df

    def ingest_forecasts(
        self,
        publish_from: str = "2025-12-30T00:00:00Z",
        publish_to: str = "2026-02-01T23:59:59Z"
    ) -> pd.DataFrame:
        """Ingest WINDFOR records across all publication versions."""
        logger.info(f"Starting forecast ingestion for publications from {publish_from} to {publish_to}")
        raw_records = elexon_client.fetch_wind_forecasts(
            publish_datetime_from=publish_from,
            publish_datetime_to=publish_to
        )
        
        # Save raw JSON backup
        raw_file = settings.RAW_FORECASTS_PATH / "windfor_versions.json"
        with open(raw_file, "w", encoding="utf-8") as f:
            json.dump(raw_records, f)
            
        processed_rows = []
        for r in raw_records:
            raw_pub = r.get("publishTime")
            raw_start = r.get("startTime")
            gen = r.get("generation")
            
            if not raw_pub or not raw_start:
                continue
                
            pub_dt = parse_iso_datetime(raw_pub)
            start_dt = parse_iso_datetime(raw_start)
            
            settlement_date, sp = calculate_settlement_period(start_dt)
            lead_hours = (start_dt - pub_dt).total_seconds() / 3600.0
            
            processed_rows.append({
                "publish_time": format_iso_utc(pub_dt),
                "start_time": format_iso_utc(start_dt),
                "settlement_date": str(settlement_date),
                "settlement_period": int(sp),
                "forecast_generation_mw": float(gen) if gen is not None else None,
                "lead_time_hours": lead_hours,
                "is_valid": gen is not None and float(gen) >= 0
            })
            
        df = pd.DataFrame(processed_rows)
        # Drop exact duplicates on (publish_time, start_time)
        df = df.drop_duplicates(subset=["publish_time", "start_time"]).sort_values(["start_time", "publish_time"]).reset_index(drop=True)
        
        # Persist Parquet
        parquet_store.save_df(df, settings.FORECAST_VERSIONS_PARQUET, cache_key="forecast_versions")
        logger.info(f"Ingested {len(df)} forecast records across distinct publications")
        return df

    def run_full_ingestion(self) -> Dict[str, Any]:
        """Execute complete ingestion pipeline for January 2026."""
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        logger.info(f"--- Running full January 2026 data ingestion at {now_str} ---")
        
        df_actuals = self.ingest_actuals()
        df_forecasts = self.ingest_forecasts()
        
        metadata = {
            "ingestion_timestamp": now_str,
            "period": "January 2026",
            "sources": {
                "actuals": "Elexon BMRS FUELHH (fuelType=WIND)",
                "forecasts": "Elexon BMRS WINDFOR"
            },
            "actuals_summary": {
                "total_records": len(df_actuals),
                "expected_records": 1488,
                "completeness_pct": round(len(df_actuals) / 1488 * 100, 2),
                "min_start_time": df_actuals["start_time"].min() if not df_actuals.empty else None,
                "max_start_time": df_actuals["start_time"].max() if not df_actuals.empty else None,
            },
            "forecasts_summary": {
                "total_records": len(df_forecasts),
                "distinct_publish_times": int(df_forecasts["publish_time"].nunique()) if not df_forecasts.empty else 0,
                "distinct_target_intervals": int(df_forecasts["start_time"].nunique()) if not df_forecasts.empty else 0,
                "min_publish_time": df_forecasts["publish_time"].min() if not df_forecasts.empty else None,
                "max_publish_time": df_forecasts["publish_time"].max() if not df_forecasts.empty else None,
            },
            "status": "SUCCESS"
        }
        
        parquet_store.save_metadata(metadata)
        logger.info("Ingestion completed and metadata saved.")
        return metadata

ingestion_service = IngestionService()
