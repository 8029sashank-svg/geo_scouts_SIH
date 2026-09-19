# GeoFarm Satellite — Sentinel-2 NDVI/NDWI (Prototype)

> **Not an official Maharashtra Government system.** Prototype ML intelligence — clearly labels real vs demo data. NDVI/NDWI are **indicators only** and should not be interpreted as standalone diagnoses of crop disease, drought, or yield.

## What NDVI / NDWI mean
- **NDVI** `= (NIR - RED)/(NIR+RED)` — vegetation / crop-health indicator. Sentinel-2 `NIR=B8, RED=B4`, range -1..1. Higher ≈ more vigorous vegetation.
- **NDWI** (Gao 1996 vegetation water) `= (NIR - SWIR)/(NIR+SWIR)` — water-stress-related. Sentinel-2 `NIR=B8, SWIR=B11`, range -1..1. Lower ≈ more water stress. **One formulation only** in this project; McFeeters (Green-NIR) is not used.

## Sentinel-2 bands
- `B4` RED (665 nm), `B8` NIR (842 nm), `B11` SWIR (1610 nm) — `COPERNICUS/S2_SR_HARMONIZED`

## Google Earth Engine setup
```bash
pip install earthengine-api
# Environment variables (do not hardcode)
set GEE_PROJECT_ID=your-gcp-project
# Optional service account JSON path
set GEE_CREDENTIALS_PATH=C:\path\to\service-account.json
# Date range
set SATELLITE_START_DATE=2026-08-01
set SATELLITE_END_DATE=2026-09-15
set MAX_CLOUD_PERCENT=20
# Authenticate once:
earthengine authenticate
python -c "import ee; ee.Initialize(project='your-project')"
```
Provider auto-detects: if `GEE_PROJECT_ID` missing or `earthengine-api` not installed/initialized, `DemoProvider` serves deterministic synthetic district means.

## Data processing flow
```
Provider (GEE or Demo)
 → indices/ndvi, ndwi (formulas above)
 → processing/district_aggregation (per-district mean/min/max)
 → processing/quality (validPixel/cloud checks)
 → FastAPI cached dataset
 → React → 3D map
```
Frontend never calls GEE directly.

## Real vs demo
- **Real:** `provider="sentinel-2"`, `dataSource="Google Earth Engine / Sentinel-2"`, `isRealData:true`, `sourceDate` actual image date
- **Demo:** `provider="demo"`, `dataSource="GeoFarm Prototype"`, `isRealData:false`, `sourceDate="2026-09-01"` (synthetic)

UI labels: **Satellite-derived • Sentinel-2** vs **Prototype • Demo satellite layer**

## Limitations
- NDVI/NDWI alone cannot diagnose disease or predict yield
- Cloud masking and valid-pixel thresholds are demo-tuned; real pipeline needs QA60 + scene-specific tuning
- District aggregation is mean-only (no texture/variance yet)

## How to run
```bash
cd ml
pip install -r requirements.txt  # includes earthengine-api optional
python -m uvicorn api:app --reload --port 8000
# Test
curl http://localhost:8000/satellite/health
curl http://localhost:8000/satellite/districts
curl http://localhost:8000/satellite/district/Nashik
curl http://localhost:8000/satellite/summary
```

## How to verify provenance
Every district payload includes `provenance: {provider, dataSource, sourceDate, processingVersion, isRealData, quality}` — check `quality.status` (`good`/`warning`/`insufficient_data`/`unavailable`).

## Fallback
If credentials missing, API returns `available:false, provider:demo` and all satellite endpoints serve demo values with `isRealData:false` — app continues via 2D fallback and existing ML risk layers.
