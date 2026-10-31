import json
import threading
from pathlib import Path
from typing import Optional, Dict, Any
import pandas as pd

from app.config import settings
from app.core.logging import logger

class ParquetStore:
    """Manages Parquet analytical file storage and in-memory caching."""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ParquetStore, cls).__new__(cls)
                cls._instance._init_cache()
            return cls._instance

    def _init_cache(self):
        self._cache: Dict[str, pd.DataFrame] = {}
        self._metadata_cache: Optional[Dict[str, Any]] = None

    def save_df(self, df: pd.DataFrame, path: Path, cache_key: Optional[str] = None):
        """Save a pandas DataFrame to Parquet and update the in-memory cache."""
        path.parent.mkdir(parents=True, exist_ok=True)
        df.to_parquet(path, index=False, engine="pyarrow")
        if cache_key:
            with self._lock:
                self._cache[cache_key] = df.copy()
        logger.info(f"Saved {len(df)} records to {path.name}")

    def load_df(self, path: Path, cache_key: Optional[str] = None) -> Optional[pd.DataFrame]:
        """Load DataFrame from cache or Parquet file."""
        if cache_key and cache_key in self._cache:
            return self._cache[cache_key]
        
        if not path.exists():
            logger.warning(f"File {path} does not exist.")
            return None
            
        df = pd.read_parquet(path, engine="pyarrow")
        if cache_key:
            with self._lock:
                self._cache[cache_key] = df
        return df

    def save_metadata(self, metadata: Dict[str, Any]):
        """Save ingestion metadata JSON."""
        settings.INGESTION_METADATA_JSON.parent.mkdir(parents=True, exist_ok=True)
        with open(settings.INGESTION_METADATA_JSON, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)
        with self._lock:
            self._metadata_cache = metadata
        logger.info("Saved ingestion metadata")

    def load_metadata(self) -> Optional[Dict[str, Any]]:
        """Load ingestion metadata JSON."""
        if self._metadata_cache is not None:
            return self._metadata_cache
        if not settings.INGESTION_METADATA_JSON.exists():
            return None
        with open(settings.INGESTION_METADATA_JSON, "r", encoding="utf-8") as f:
            data = json.load(f)
        with self._lock:
            self._metadata_cache = data
        return data

    def clear_cache(self):
        with self._lock:
            self._cache.clear()
            self._metadata_cache = None

parquet_store = ParquetStore()

