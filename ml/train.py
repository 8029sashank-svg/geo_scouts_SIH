"""
DEMO DATA ONLY — replace with verified real datasets before real-world deployment.
Synthetic Maharashtra agricultural risk training.
Fixed seed for reproducibility.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
import joblib
import pathlib

# Fixed seed
RNG = np.random.default_rng(42)

FEATURES = [
    "temperature",      # 18-38 C
    "humidity",         # 30-95 %
    "rainfall",         # 0-25 mm
    "soil_moisture",    # 15-85 %
    "ndvi",            # 0.15-0.92
    "ndwi",            # -0.2 to 0.6
    "pest_reports",      # 0-15
    "disease_reports",   # 0-12
    "crop_stress",      # 0-1
    "historical_yield",  # 35-92
]

def synth_row():
    temperature = float(RNG.uniform(18, 38))
    humidity = float(RNG.uniform(30, 95))
    rainfall = float(RNG.uniform(0, 25))
    soil_moisture = float(RNG.uniform(15, 85))
    ndvi = float(RNG.uniform(0.15, 0.92))
    ndwi = float(RNG.uniform(-0.2, 0.6))
    pest_reports = int(RNG.integers(0, 16))
    disease_reports = int(RNG.integers(0, 13))
    crop_stress = float(RNG.uniform(0, 1))
    historical_yield = float(RNG.uniform(35, 92))

    # Plausible synthetic targets (clip 0-100, add noise)
    # Disease rises with humidity, crop_stress, disease_reports, low ndvi
    disease_risk = (
        0.35 * (humidity - 30) / 65 * 100
        + 0.25 * crop_stress * 100
        + 0.20 * disease_reports / 12 * 100
        + 0.20 * (0.92 - ndvi) / 0.77 * 100
        + RNG.normal(0, 6)
    )
    pest_risk = (
        0.30 * pest_reports / 15 * 100
        + 0.25 * (temperature - 18) / 20 * 100
        + 0.20 * (1 - ndvi) * 80
        + 0.15 * crop_stress * 100
        + 0.10 * (humidity - 40) / 55 * 100
        + RNG.normal(0, 6)
    )
    water_stress = (
        0.40 * (1 - soil_moisture / 85) * 100
        + 0.30 * (1 - ndwi * 0.8 + 0.16) * 60
        + 0.20 * (temperature - 22) / 16 * 100
        + 0.10 * (1 - rainfall / 25) * 100
        + RNG.normal(0, 5)
    )
    yield_index = (
        0.35 * ndvi * 100
        + 0.25 * soil_moisture / 85 * 100
        + 0.15 * historical_yield * 0.9
        + 0.15 * (1 - crop_stress) * 100
        - 0.10 * water_stress * 0.3
        + RNG.normal(0, 5)
    )
    return [
        temperature, humidity, rainfall, soil_moisture, ndvi, ndwi,
        pest_reports, disease_reports, crop_stress, historical_yield,
        np.clip(disease_risk, 0, 100),
        np.clip(pest_risk, 0, 100),
        np.clip(water_stress, 0, 100),
        np.clip(yield_index, 0, 100),
    ]

def build_dataset(n=1200):
    cols = FEATURES + ["disease_risk", "pest_risk", "water_stress", "yield_index"]
    rows = [synth_row() for _ in range(n)]
    df = pd.DataFrame(rows, columns=cols)
    return df

def train_and_save():
    df = build_dataset(1200)
    X = df[FEATURES]
    targets = ["disease_risk", "pest_risk", "water_stress", "yield_index"]
    # Save demo csv for inspection (optional)
    pathlib.Path("data").mkdir(exist_ok=True, parents=True)
    df.to_csv("data/demo_synthetic.csv", index=False)
    print(f"Demo dataset: {df.shape[0]} rows -> data/demo_synthetic.csv")

    pathlib.Path("models").mkdir(exist_ok=True, parents=True)

    for tgt in targets:
        y = df[tgt]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model = RandomForestRegressor(n_estimators=120, max_depth=12, random_state=42, n_jobs=-1)
        model.fit(X_train, y_train)
        pred = model.predict(X_test)
        r2 = r2_score(y_test, pred)
        rmse = float(np.sqrt(mean_squared_error(y_test, pred)))
        print(f"{tgt:15} R2={r2: .3f} RMSE={rmse: .2f}")
        name = tgt.replace("_risk", "").replace("_stress", "").replace("_index", "")
        # Map to requested filenames
        mapping = {
            "disease": "disease_model.joblib",
            "pest": "pest_model.joblib",
            "water": "water_model.joblib",
            "yield": "yield_model.joblib",
        }
        fname = mapping[name]
        joblib.dump(model, f"models/{fname}")
        print(f"  -> models/{fname}")

if __name__ == "__main__":
    train_and_save()
    print("Done. Models saved to ml/models/")
