# GeoFarm ML — Maharashtra Agricultural Risk (Demo)

> **DEMO DATA ONLY — replace with verified real datasets before real-world deployment.** This service generates **synthetic** training data and predictions for prototype purposes. Do not present as government or live-satellite data.

## What it does
- Trains 4 RandomForestRegressor models (disease, pest, water stress, yield) on synthetic features resembling weather, soil, vegetation indices, and field reports.
- Computes `overallRisk = 0.4*disease + 0.3*pest + 0.3*water` (0–100, LOW <40, MEDIUM 40–69, HIGH ≥70).
- Serves FastAPI endpoints for per-district and single-district prediction.

## Synthetic dataset
Features: `temperature, humidity, rainfall, soil_moisture, ndvi, ndwi, pest_reports, disease_reports, crop_stress, historical_yield`
Targets are deterministic formulas + Gaussian noise, seed 42, 1200 rows → `ml/data/demo_synthetic.csv`.

## Setup
```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# Windows CMD
.venv\Scripts\activate.bat
pip install -r requirements.txt
```

## Train
```bash
cd ml
python train.py
# prints R2/RMSE per target and saves:
# models/disease_model.joblib
# models/pest_model.joblib
# models/water_model.joblib
# models/yield_model.joblib
```

## Run API
```bash
uvicorn api:app --reload --port 8000
# or: python -m uvicorn api:app --reload --port 8000
```

Endpoints:
- `GET /health` → `{status, model, dataSource}`
- `GET /districts` → array of 34 districts with `{district, overallRisk, riskLevel, pestRisk, diseaseRisk, waterStress, yieldIndex, crop, dataSource}`
- `POST /predict` with JSON body `{district, temperature, humidity, rainfall, soil_moisture, ndvi, ndwi, pest_reports, disease_reports, crop_stress, historical_yield}` → same shape single object. Validates ranges, rejects NaN/Infinity.

## React integration
`src/scout/data/districtIntelligence.js` now tries `fetch(http://localhost:8000/districts)` and falls back to the in-file mock map (`DEMO_SYNTHETIC`) if the service is down — map never white-screens. The 3D map shows a subtle “Demo intelligence — offline” vs “Prototype ML Intelligence · Demo synthetic data” label.

## Before real deployment
- Replace `train.py` synthetic generator with real satellite/weather/field datasets.
- Retrain and re-evaluate with proper cross-validation.
- Remove or gate `DEMO_SYNTHETIC` labels and add data provenance.

## Real Data Status

> Phase 9 — foundation for verified Maharashtra data. Every source is labelled with `source`, `sourceUrl`, `year`, `geographicLevel`, `dataType` and `REAL_OFFICIAL` vs `DEMO_SYNTHETIC` so the API/UI can never mix them silently. See `ml/data/metadata/sources.json` and `ml/data/metadata/data_quality.json`.

| Feature | Status | Source |
|---|---|---|
| Crop production (area/production/productivity) | REAL — source registered, values pending extraction | Maharashtra Agriculture Dept (2024-25 PDF) + OGD/UPAg (1997-2025) — see `sources.json` |
| Rainfall | NOT CONNECTED YET | — |
| NDVI | NOT CONNECTED YET | — |
| NDWI | NOT CONNECTED YET | — |
| Soil moisture | NOT CONNECTED YET | — |
| Pest reports | EXISTING Geo-Farm prototype data (NEARBY_CASES) — not government | — |
| Disease reports | EXISTING Geo-Farm prototype data (NEARBY_CASES) — not government | — |
| Temperature / Humidity | NOT CONNECTED YET | — |
| District mapping | Normalized GeoJSON ↔ official names via `ml/data/district_mapping.json` | — |

Processed skeleton: `ml/data/processed/district_agriculture_features.csv` (34 rows, one per GeoJSON district) currently holds `null` for all feature columns — intentionally, so no fake model is trained on missing data. `GET /districts` and the 3D map still serve `DEMO_SYNTHETIC` predictions until the skeleton is filled with verified values. Check `GET /data-sources` and `GET /data-quality` for live provenance.

## Test
```bash
# Python
python train.py
curl http://localhost:8000/health
curl http://localhost:8000/districts | head
curl -X POST http://localhost:8000/predict -H "Content-Type: application/json" -d "{\"district\":\"Nashik\",\"temperature\":28,\"humidity\":72,\"rainfall\":4.2,\"soil_moisture\":62,\"ndvi\":0.71,\"ndwi\":0.32,\"pest_reports\":8,\"disease_reports\":5,\"crop_stress\":0.28,\"historical_yield\":76}"
# React: npm run dev, open Farm Map → toggle 3D, search Nashik, switch layers, kill ML (Ctrl-C) → map stays on fallback.
```
