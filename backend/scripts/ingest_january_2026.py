import sys
from pathlib import Path

# Add backend to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.ingestion_service import ingestion_service
from app.core.logging import logger

def main():
    logger.info("=== Starting Elexon January 2026 Ingestion Script ===")
    try:
        metadata = ingestion_service.run_full_ingestion()
        print("\n--- Ingestion Succeeded! ---")
        print(f"Actuals count: {metadata['actuals_summary']['total_records']}")
        print(f"Forecasts count: {metadata['forecasts_summary']['total_records']}")
        print(f"Distinct publish times: {metadata['forecasts_summary']['distinct_publish_times']}")
        print(f"Completeness: {metadata['actuals_summary']['completeness_pct']}%")
        print("----------------------------\n")
    except Exception as e:
        logger.error(f"Ingestion failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()

