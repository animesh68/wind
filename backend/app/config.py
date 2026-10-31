import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
METADATA_DIR = DATA_DIR / "metadata"

RAW_ACTUALS_DIR = RAW_DIR / "actuals"
RAW_FORECASTS_DIR = RAW_DIR / "forecasts"

class Settings(BaseModel):
    PROJECT_NAME: str = "WIND INTELLIGENCE"
    PROJECT_DESCRIPTION: str = "National Wind Generation Forecast & Accuracy Analytics"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Elexon BMRS API Endpoints
    ELEXON_BASE_URL: str = os.getenv("ELEXON_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1")
    FUELHH_STREAM_URL: str = f"{ELEXON_BASE_URL}/datasets/FUELHH/stream"
    WINDFOR_STREAM_URL: str = f"{ELEXON_BASE_URL}/datasets/WINDFOR/stream"
    
    # Analysis Window: January 2026
    ANALYSIS_START_DATE: str = "2026-01-01"
    ANALYSIS_END_DATE: str = "2026-01-31"
    
    # Default Day-Ahead Decision Cutoff: 11:00 Europe/London day before delivery date
    DEFAULT_CUTOFF_TIME: str = "11:00"
    TIMEZONE: str = "Europe/London"
    
    # Paths
    DATA_PATH: Path = DATA_DIR
    RAW_ACTUALS_PATH: Path = RAW_ACTUALS_DIR
    RAW_FORECASTS_PATH: Path = RAW_FORECASTS_DIR
    PROCESSED_PATH: Path = PROCESSED_DIR
    METADATA_PATH: Path = METADATA_DIR
    
    ACTUAL_PARQUET: Path = PROCESSED_DIR / "actual_generation.parquet"
    FORECAST_VERSIONS_PARQUET: Path = PROCESSED_DIR / "forecast_versions.parquet"
    FORECAST_SELECTED_PARQUET: Path = PROCESSED_DIR / "forecast_selected.parquet"
    EVALUATION_PARQUET: Path = PROCESSED_DIR / "evaluation_results.parquet"
    INGESTION_METADATA_JSON: Path = METADATA_DIR / "ingestion_metadata.json"

settings = Settings()

# Ensure directories exist
for p in [DATA_DIR, RAW_DIR, PROCESSED_DIR, METADATA_DIR, RAW_ACTUALS_DIR, RAW_FORECASTS_DIR]:
    p.mkdir(parents=True, exist_ok=True)
