import os
import re
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.logging import logger
from app.core.exceptions import WindIntelligenceException
from app.storage.parquet_store import parquet_store
from app.services.ingestion_service import ingestion_service
from app.models.schemas import HealthResponse

from app.api.routes import overview, forecasts, analytics, evolution, quality, exports

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure datasets are loaded/available
    logger.info("Initializing WIND INTELLIGENCE Platform...")
    actual_exists = settings.ACTUAL_PARQUET.exists()
    fc_exists = settings.FORECAST_VERSIONS_PARQUET.exists()
    
    if not actual_exists or not fc_exists:
        logger.info("Analytical datasets not detected on disk. Initiating automated ingestion for January 2026...")
        try:
            ingestion_service.run_full_ingestion()
        except Exception as e:
            logger.error(f"Failed automated startup ingestion: {e}")
    else:
        logger.info("Pre-computed January 2026 Parquet datasets verified.")
    yield
    logger.info("Shutting down WIND INTELLIGENCE Platform...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def normalize_path_middleware(request: Request, call_next):
    raw_path = request.scope.get("path", "")
    if "//" in raw_path:
        request.scope["path"] = re.sub(r"/+", "/", raw_path)
    return await call_next(request)

# Exception handlers
@app.exception_handler(WindIntelligenceException)
async def wind_exception_handler(request: Request, exc: WindIntelligenceException):
    logger.warning(f"Domain exception: {exc}")
    return JSONResponse(
        status_code=400,
        content={"error": exc.__class__.__name__, "message": str(exc)}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "InternalServerError", "message": str(exc)}
    )

# Health endpoint
@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    meta = parquet_store.load_metadata() or {}
    has_data = settings.ACTUAL_PARQUET.exists() and settings.FORECAST_VERSIONS_PARQUET.exists()
    return HealthResponse(
        status="HEALTHY",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        data_loaded=has_data,
        ingestion_timestamp=meta.get("ingestion_timestamp"),
        delivery_date_range="2026-01-01 to 2026-01-31"
    )

# Include API Routers
app.include_router(overview.router, prefix=settings.API_PREFIX)
app.include_router(forecasts.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(evolution.router, prefix=settings.API_PREFIX)
app.include_router(quality.router, prefix=settings.API_PREFIX)
app.include_router(exports.router, prefix=settings.API_PREFIX)

