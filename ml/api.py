"""
DEMO DATA ONLY — replace with verified real datasets before real-world deployment.
FastAPI ML service for Maharashtra agricultural risk.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import joblib
import pathlib
import numpy as np
import json
try:
    from satellite.providers import get_provider as get_sat_provider
    from satellite.config import PROCESSING_VERSION as SAT_PROC_VERSION
except Exception:
    get_sat_provider = None
    SAT_PROC_VERSION = "v1"

app = FastAPI(title="GeoFarm ML Demo", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = pathlib.Path(__file__).parent / "models"
FEATURES = [
    "temperature", "humidity", "rainfall", "soil_moisture",
    "ndvi", "ndwi", "pest_reports", "disease_reports", "crop_stress", "historical_yield",
]

# Load models lazily
_models = {}

def load_models():
    global _models
    if _models:
        return _models
    try:
        _models["disease"] = joblib.load(MODEL_DIR / "disease_model.joblib")
        _models["pest"] = joblib.load(MODEL_DIR / "pest_model.joblib")
        _models["water"] = joblib.load(MODEL_DIR / "water_model.joblib")
        _models["yield"] = joblib.load(MODEL_DIR / "yield_model.joblib")
    except Exception as e:
        raise RuntimeError(f"Model load failed: {e}. Run `python train.py` first.")
    return _models

def risk_level(score: float) -> str:
    if score >= 70: return "HIGH"
    if score >= 40: return "MEDIUM"
    return "LOW"

def overall_risk(disease: float, pest: float, water: float) -> float:
    """
    Transparent weighting — documented for demo honesty.
    overall = 0.4*disease + 0.3*pest + 0.3*water, clipped 0-100
    """
    val = 0.4 * disease + 0.3 * pest + 0.3 * water
    return float(np.clip(val, 0, 100))

class PredictInput(BaseModel):
    district: str
    temperature: float
    humidity: float
    rainfall: float
    soil_moisture: float
    ndvi: float
    ndwi: float
    pest_reports: int
    disease_reports: int
    crop_stress: float
    historical_yield: float

    @field_validator("district")
    @classmethod
    def district_ok(cls, v):
        if not v or len(v.strip()) < 2: raise ValueError("invalid district")
        if v != v.strip(): raise ValueError("district has leading/trailing spaces")
        return v.strip()

    @field_validator("temperature")
    @classmethod
    def temp_ok(cls, v):
        if not np.isfinite(v) or v < -10 or v > 55: raise ValueError("temperature out of range -10..55")
        return v
    @field_validator("humidity")
    @classmethod
    def hum_ok(cls, v):
        if not np.isfinite(v) or v < 0 or v > 100: raise ValueError("humidity 0..100")
        return v
    @field_validator("rainfall")
    @classmethod
    def rain_ok(cls, v):
        if not np.isfinite(v) or v < 0 or v > 200: raise ValueError("rainfall 0..200")
        return v
    @field_validator("soil_moisture")
    @classmethod
    def soil_ok(cls, v):
        if not np.isfinite(v) or v < 0 or v > 100: raise ValueError("soil_moisture 0..100")
        return v
    @field_validator("ndvi")
    @classmethod
    def ndvi_ok(cls, v):
        if not np.isfinite(v) or v < -1 or v > 1: raise ValueError("ndvi -1..1")
        return v
    @field_validator("ndwi")
    @classmethod
    def ndwi_ok(cls, v):
        if not np.isfinite(v) or v < -1 or v > 1: raise ValueError("ndwi -1..1")
        return v
    @field_validator("pest_reports")
    @classmethod
    def pest_ok(cls, v):
        if v < 0 or v > 100: raise ValueError("pest_reports 0..100")
        return v
    @field_validator("disease_reports")
    @classmethod
    def disease_ok(cls, v):
        if v < 0 or v > 100: raise ValueError("disease_reports 0..100")
        return v
    @field_validator("crop_stress")
    @classmethod
    def stress_ok(cls, v):
        if not np.isfinite(v) or v < 0 or v > 1: raise ValueError("crop_stress 0..1")
        return v
    @field_validator("historical_yield")
    @classmethod
    def yield_ok(cls, v):
        if not np.isfinite(v) or v < 0 or v > 100: raise ValueError("historical_yield 0..100")
        return v

# District list must match GeoJSON NAME_2 values
DISTRICTS = [
    'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Bhandara', 'Bid', 'Buldana', 'Chandrapur',
    'Dhule', 'Garhchiroli', 'Gondiya', 'Greater Bombay', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur',
    'Latur', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Parbhani', 'Pune',
    'Raigarh', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal',
]

CROP_POOL = ['Grapes', 'Cotton', 'Onion', 'Soybean', 'Sugarcane', 'Wheat']

META_DIR = pathlib.Path(__file__).parent / "data" / "metadata"

def load_sources():
    try:
        with open(META_DIR / "sources.json") as f:
            return json.load(f)
    except Exception:
        return []

def load_quality():
    try:
        with open(META_DIR / "data_quality.json") as f:
            return json.load(f)
    except Exception:
        return {"districtCount": 0, "status": "metadata not found"}

def district_features(district: str):
    # Deterministic synthetic features per district (hash seeded) — DEMO ONLY
    h = hash(district) & 0xffffffff
    rng = np.random.default_rng(h % (2**31))
    # Curated realistic-ish for Nashik/Ahmednagar to match existing cases
    if district == "Nashik":
        return dict(temperature=28.0, humidity=72, rainfall=4.2, soil_moisture=62, ndvi=0.71, ndwi=0.32, pest_reports=8, disease_reports=5, crop_stress=0.28, historical_yield=76)
    if district == "Ahmednagar":
        return dict(temperature=30.5, humidity=58, rainfall=2.1, soil_moisture=48, ndvi=0.62, ndwi=0.18, pest_reports=11, disease_reports=4, crop_stress=0.35, historical_yield=68)
    if district == "Pune":
        return dict(temperature=27.2, humidity=64, rainfall=5.0, soil_moisture=58, ndvi=0.74, ndwi=0.28, pest_reports=5, disease_reports=6, crop_stress=0.22, historical_yield=81)
    return dict(
        temperature=float(rng.uniform(20, 34)),
        humidity=float(rng.uniform(35, 88)),
        rainfall=float(rng.uniform(0, 12)),
        soil_moisture=float(rng.uniform(22, 78)),
        ndvi=float(rng.uniform(0.35, 0.85)),
        ndwi=float(rng.uniform(-0.1, 0.45)),
        pest_reports=int(rng.integers(0, 12)),
        disease_reports=int(rng.integers(0, 10)),
        crop_stress=float(rng.uniform(0.1, 0.65)),
        historical_yield=float(rng.uniform(45, 85)),
    )

def crop_for(district: str) -> str:
    if district == "Nashik": return "Grapes"
    if district == "Ahmednagar": return "Cotton"
    if district == "Pune": return "Grapes"
    return CROP_POOL[hash(district) % len(CROP_POOL)]

@app.get("/health")
def health():
    try:
        load_models()
        ok = True
    except Exception:
        ok = False
    return {"status": "ok" if ok else "degraded", "model": "random-forest", "dataSource": "DEMO_SYNTHETIC"}

@app.get("/data-sources")
def data_sources():
    sources = load_sources()
    # Return with type field for frontend distinction
    return {"sources": sources}

@app.get("/data-quality")
def data_quality():
    return load_quality()

def predict_from_features(feats: dict):
    models = load_models()
    X = np.array([[feats[f] for f in FEATURES]], dtype=float)
    disease = float(np.clip(models["disease"].predict(X)[0], 0, 100))
    pest = float(np.clip(models["pest"].predict(X)[0], 0, 100))
    water = float(np.clip(models["water"].predict(X)[0], 0, 100))
    yld = float(np.clip(models["yield"].predict(X)[0], 0, 100))
    overall = overall_risk(disease, pest, water)
    return dict(diseaseRisk=round(disease, 1), pestRisk=round(pest, 1), waterStress=round(water, 1), yieldIndex=round(yld, 1), overallRisk=round(overall, 1), riskLevel=risk_level(overall))

@app.post("/predict")
def predict(inp: PredictInput):
    feats = {f: getattr(inp, f) for f in FEATURES}
    try:
        out = predict_from_features(feats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {
        "district": inp.district,
        "overallRisk": out["overallRisk"],
        "riskLevel": out["riskLevel"],
        "pestRisk": out["pestRisk"],
        "diseaseRisk": out["diseaseRisk"],
        "waterStress": out["waterStress"],
        "yieldIndex": out["yieldIndex"],
        "crop": crop_for(inp.district),
        "dataSource": "DEMO_SYNTHETIC",
        "sourceYear": "synthetic - seed 42",
    }

@app.get("/districts")
def districts():
    try:
        load_models()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    results = []
    for d in DISTRICTS:
        feats = district_features(d)
        out = predict_from_features(feats)
        # Provenance: currently demo synthetic; when real dataset is connected,
        # set dataSource to REAL_OFFICIAL and sourceYear to official year,
        # and allow pest/disease/water to be null if not yet available.
        results.append({
            "district": d,
            "overallRisk": out["overallRisk"],
            "riskLevel": out["riskLevel"],
            "pestRisk": out["pestRisk"],
            "diseaseRisk": out["diseaseRisk"],
            "waterStress": out["waterStress"],
            "yieldIndex": out["yieldIndex"],
            "crop": crop_for(d),
            "dataSource": "DEMO_SYNTHETIC",
            "sourceYear": "synthetic - seed 42",
        })
    return results

# --- Satellite endpoints (never break existing /health,/predict,/districts) ---
@app.get("/satellite/health")
def satellite_health():
    if get_sat_provider is None:
        return {"available": False, "provider": "demo", "reason": "satellite module not loaded"}
    try:
        p = get_sat_provider()
        return {"available": p.is_available() and p.name != "demo", "provider": p.name, "dataSource": p.data_source if p.is_available() and p.name != "demo" else "GeoFarm Prototype", "processingVersion": SAT_PROC_VERSION}
    except Exception as e:
        return {"available": False, "provider": "demo", "reason": str(e)}

@app.get("/satellite/districts")
def satellite_districts():
    if get_sat_provider is None:
        raise HTTPException(status_code=500, detail="satellite module not loaded")
    try:
        p = get_sat_provider()
        data = p.fetch_all(DISTRICTS)
        # Convert to list with provenance
        out = []
        for district, v in data.items():
            if isinstance(v, dict) and "error" in v:
                out.append({"district": district, "ndvi": None, "ndwi": None, "quality": {"status": "unavailable"}, "provenance": {"provider": v.get("provider","demo"), "dataSource": "GeoFarm Prototype", "isRealData": False, "sourceDate": None, "processingVersion": SAT_PROC_VERSION}, "provider": v.get("provider","demo"), "isRealData": False})
                continue
            out.append({
                "district": district,
                "ndvi": {"mean": v.get("ndviMean"), "min": v.get("ndviMin"), "max": v.get("ndviMax")},
                "ndwi": {"mean": v.get("ndwiMean"), "min": v.get("ndwiMin"), "max": v.get("ndwiMax")},
                "quality": v.get("quality", {"status": "good"}),
                "provenance": {"provider": v.get("provider","demo"), "dataSource": v.get("dataSource","GeoFarm Prototype"), "sourceDate": v.get("sourceDate"), "processingVersion": v.get("processingVersion", SAT_PROC_VERSION), "isRealData": v.get("isRealData", False)},
                "provider": v.get("provider","demo"),
                "dataSource": v.get("dataSource","GeoFarm Prototype"),
                "isRealData": v.get("isRealData", False),
                "validPixelPercent": v.get("validPixelPercent"),
                "cloudPercent": v.get("cloudPercent"),
                "sourceDate": v.get("sourceDate"),
            })
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/satellite/district/{district}")
def satellite_district(district: str):
    if get_sat_provider is None:
        raise HTTPException(status_code=500, detail="satellite module not loaded")
    # Validate district exists in our list (case-insensitive)
    norm = next((d for d in DISTRICTS if d.lower() == district.lower()), None)
    if not norm:
        raise HTTPException(status_code=404, detail="district not found")
    try:
        p = get_sat_provider()
        v = p.fetch_district(norm)
        return {
            "district": norm,
            "ndvi": {"mean": v.get("ndviMean"), "min": v.get("ndviMin"), "max": v.get("ndviMax")},
            "ndwi": {"mean": v.get("ndwiMean"), "min": v.get("ndwiMin"), "max": v.get("ndwiMax")},
            "quality": v.get("quality", {"status": "good"}),
            "provenance": {"provider": v.get("provider","demo"), "dataSource": v.get("dataSource","GeoFarm Prototype"), "sourceDate": v.get("sourceDate"), "processingVersion": v.get("processingVersion", SAT_PROC_VERSION), "isRealData": v.get("isRealData", False)},
            "provider": v.get("provider","demo"),
            "dataSource": v.get("dataSource","GeoFarm Prototype"),
            "isRealData": v.get("isRealData", False),
            "validPixelPercent": v.get("validPixelPercent"),
            "cloudPercent": v.get("cloudPercent"),
            "sourceDate": v.get("sourceDate"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/satellite/summary")
def satellite_summary():
    if get_sat_provider is None:
        raise HTTPException(status_code=500, detail="satellite module not loaded")
    try:
        p = get_sat_provider()
        data = p.fetch_all(DISTRICTS)
        vals = [v for v in data.values() if isinstance(v, dict) and v.get("ndviMean") is not None]
        if not vals:
            return {"count": 0, "provider": p.name, "isRealData": False}
        ndvi_vals = [v["ndviMean"] for v in vals]
        ndwi_vals = [v["ndwiMean"] for v in vals]
        return {
            "count": len(vals),
            "provider": p.name,
            "isRealData": vals[0].get("isRealData", False) if vals else False,
            "dataSource": vals[0].get("dataSource", "GeoFarm Prototype") if vals else "GeoFarm Prototype",
            "ndvi": {"mean": round(float(np.mean(ndvi_vals)),3), "min": round(float(np.min(ndvi_vals)),3), "max": round(float(np.max(ndvi_vals)),3)},
            "ndwi": {"mean": round(float(np.mean(ndwi_vals)),3), "min": round(float(np.min(ndwi_vals)),3), "max": round(float(np.max(ndwi_vals)),3)},
            "processingVersion": SAT_PROC_VERSION,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
