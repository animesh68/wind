import time
from typing import List, Dict, Any, Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.config import settings
from app.core.logging import logger
from app.core.exceptions import DataIngestionError

class ElexonClient:
    """Client for Elexon BMRS API with exponential backoff and retry."""

    def __init__(self, timeout: int = 30, max_retries: int = 3):
        self.timeout = timeout
        self.session = requests.Session()
        retry_strategy = Retry(
            total=max_retries,
            backoff_factor=1.5,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)
        self.session.headers.update({
            "Accept": "application/json",
            "User-Agent": "WindIntelligencePlatform/1.0"
        })

    def fetch_actual_generation(
        self,
        settlement_date_from: str = "2026-01-01",
        settlement_date_to: str = "2026-01-31",
        fuel_type: str = "WIND"
    ) -> List[Dict[str, Any]]:
        """
        Fetch FUELHH half-hourly actual generation stream filtered to fuelType WIND.
        Endpoint: /datasets/FUELHH/stream
        """
        params = {
            "settlementDateFrom": settlement_date_from,
            "settlementDateTo": settlement_date_to,
            "fuelType": fuel_type
        }
        url = settings.FUELHH_STREAM_URL
        logger.info(f"Fetching FUELHH data from {url} for {settlement_date_from} to {settlement_date_to}")
        try:
            resp = self.session.get(url, params=params, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()
            if not isinstance(data, list):
                if isinstance(data, dict) and "data" in data:
                    data = data["data"]
                else:
                    raise DataIngestionError(f"Unexpected response format from FUELHH: {type(data)}")
            logger.info(f"Retrieved {len(data)} FUELHH records")
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch FUELHH: {e}")
            raise DataIngestionError(f"Failed to fetch FUELHH actuals from Elexon API: {e}")

    def fetch_wind_forecasts(
        self,
        publish_datetime_from: str = "2025-12-30T00:00:00Z",
        publish_datetime_to: str = "2026-02-01T23:59:59Z"
    ) -> List[Dict[str, Any]]:
        """
        Fetch WINDFOR national wind generation forecast stream by publish time window.
        Endpoint: /datasets/WINDFOR/stream
        """
        params = {
            "publishDateTimeFrom": publish_datetime_from,
            "publishDateTimeTo": publish_datetime_to
        }
        url = settings.WINDFOR_STREAM_URL
        logger.info(f"Fetching WINDFOR data from {url} for {publish_datetime_from} to {publish_datetime_to}")
        try:
            resp = self.session.get(url, params=params, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()
            if not isinstance(data, list):
                if isinstance(data, dict) and "data" in data:
                    data = data["data"]
                else:
                    raise DataIngestionError(f"Unexpected response format from WINDFOR: {type(data)}")
            logger.info(f"Retrieved {len(data)} WINDFOR forecast records")
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch WINDFOR: {e}")
            raise DataIngestionError(f"Failed to fetch WINDFOR forecasts from Elexon API: {e}")

    def check_api_health(self) -> Dict[str, Any]:
        """Check live connectivity to Elexon BMRS API."""
        try:
            t0 = time.time()
            resp = self.session.get(
                settings.FUELHH_STREAM_URL,
                params={"settlementDateFrom": "2026-01-01", "settlementDateTo": "2026-01-01", "settlementPeriod": 1, "fuelType": "WIND"},
                timeout=5
            )
            latency_ms = int((time.time() - t0) * 1000)
            return {
                "available": resp.status_code == 200,
                "status_code": resp.status_code,
                "latency_ms": latency_ms,
                "error": None
            }
        except Exception as e:
            return {
                "available": False,
                "status_code": None,
                "latency_ms": None,
                "error": str(e)
            }

elexon_client = ElexonClient()

