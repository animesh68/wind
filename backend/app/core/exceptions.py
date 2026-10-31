class WindIntelligenceException(Exception):
    """Base exception for WIND INTELLIGENCE platform."""
    pass

class DataIngestionError(WindIntelligenceException):
    """Raised when data ingestion from Elexon BMRS fails."""
    pass

class DataValidationError(WindIntelligenceException):
    """Raised when dataset validation finds critical schema violations."""
    pass

class ForecastSelectionError(WindIntelligenceException):
    """Raised when forecast selection logic encounters an unrecoverable state."""
    pass

class ResourceNotFoundError(WindIntelligenceException):
    """Raised when a requested delivery date or dataset is not found."""
    pass
