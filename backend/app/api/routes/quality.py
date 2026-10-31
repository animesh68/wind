from fastapi import APIRouter, HTTPException

from app.models.schemas import DataQualityResponse
from app.services.quality_service import quality_service
from app.services.ingestion_service import ingestion_service

router = APIRouter(prefix="/data-quality", tags=["Data Quality"])

@router.get("", response_model=DataQualityResponse)
def get_data_quality():
    """Retrieve full data quality, audit logs, and completeness analysis."""
    try:
        return quality_service.evaluate_quality()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest")
def trigger_ingestion():
    """Trigger manual re-ingestion of January 2026 data."""
    try:
        meta = ingestion_service.run_full_ingestion()
        return {"status": "SUCCESS", "metadata": meta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

