"""
Demo/fallback provider — deterministic synthetic NDVI/NDWI per district.
Clearly labelled as not real satellite observations.
"""
from .base import SatelliteProvider
import hashlib
import random

def _hash_district(district: str) -> int:
    return int(hashlib.md5(district.encode()).hexdigest()[:8], 16)

class DemoProvider(SatelliteProvider):
    name = "demo"
    data_source = "GeoFarm Prototype"

    def is_available(self) -> bool:
        # Always available as fallback, but marks isRealData False
        return True

    def fetch_district(self, district: str):
        # Deterministic synthetic values in plausible NDVI (-1..1) range
        # Curated for demo: Nashik higher, Ahmednagar moderate
        if district == "Nashik":
            ndvi, ndwi = 0.61, -0.12
            valid, cloud = 94, 8
        elif district == "Ahmednagar":
            ndvi, ndwi = 0.48, 0.05
            valid, cloud = 89, 12
        elif district == "Pune":
            ndvi, ndwi = 0.58, 0.02
            valid, cloud = 91, 9
        else:
            h = _hash_district(district)
            rnd = random.Random(h)
            ndvi = round(rnd.uniform(0.32, 0.72), 2)
            ndwi = round(rnd.uniform(-0.25, 0.25), 2)
            valid = int(rnd.uniform(78, 96))
            cloud = int(rnd.uniform(5, 18))

        from ..processing.quality import assess_quality
        quality = assess_quality(ndvi, ndwi, valid, cloud)

        return {
            "district": district,
            "ndviMean": ndvi,
            "ndviMin": round(max(-1, ndvi - 0.15), 2),
            "ndviMax": round(min(1, ndvi + 0.12), 2),
            "ndwiMean": ndwi,
            "ndwiMin": round(max(-1, ndwi - 0.12), 2),
            "ndwiMax": round(min(1, ndwi + 0.10), 2),
            "validPixelPercent": valid,
            "cloudPercent": cloud,
            "provider": self.name,
            "dataSource": self.data_source,
            "sourceDate": "2026-09-01",
            "processingVersion": "v1",
            "isRealData": False,
            "quality": quality,
        }
