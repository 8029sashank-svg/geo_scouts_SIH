"""
Satellite provider configuration.
Uses environment variables; no credentials hardcoded.
GEE requires GEE_PROJECT_ID; otherwise demo fallback is used.
"""
import os

# Date range for Sentinel-2 queries (configurable)
SATELLITE_START_DATE = os.getenv("SATELLITE_START_DATE", "2026-08-01")
SATELLITE_END_DATE = os.getenv("SATELLITE_END_DATE", "2026-09-15")
MAX_CLOUD_PERCENT = int(os.getenv("MAX_CLOUD_PERCENT", "20"))

# Google Earth Engine
GEE_PROJECT_ID = os.getenv("GEE_PROJECT_ID", "")
# Optional: path to service account JSON
GEE_CREDENTIALS_PATH = os.getenv("GEE_CREDENTIALS_PATH", "")

# Processing
PROCESSING_VERSION = "v1"
