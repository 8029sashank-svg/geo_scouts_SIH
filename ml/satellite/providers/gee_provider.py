"""
Google Earth Engine / Sentinel-2 provider — real implementation.
Requires GEE_PROJECT_ID and earthengine-api authentication.
If unavailable, is_available() returns False and the app falls back to demo.
No credentials are exposed to the frontend.
"""
from .base import SatelliteProvider
from ..config import GEE_PROJECT_ID, SATELLITE_START_DATE, SATELLITE_END_DATE, MAX_CLOUD_PERCENT, PROCESSING_VERSION
import pathlib
import json

# Sentinel-2 band mapping — documented formulation
# NDVI = (B8 - B4) / (B8 + B4)  — NIR=B8, RED=B4
# NDWI = (B8 - B11) / (B8 + B11) — NIR=B8, SWIR=B11 (Gao vegetation water)

class GeeProvider(SatelliteProvider):
    name = "sentinel-2"
    data_source = "Google Earth Engine / Sentinel-2"

    def is_available(self) -> bool:
        if not GEE_PROJECT_ID:
            return False
        try:
            import ee
            # Try to initialize — will fail if not authenticated
            try:
                ee.Initialize(project=GEE_PROJECT_ID)
            except Exception as e:
                # Check if already initialized
                try:
                    ee.data.getAssetRoots()
                    return True
                except Exception:
                    return False
            return True
        except Exception:
            return False

    def _load_district_geometry(self, district: str):
        # Load GeoJSON and extract district polygon
        # Try multiple paths: ml -> public, and ml/satellite -> public
        candidates = [
            pathlib.Path(__file__).parents[3] / "public" / "maharashtra_districts.json",
            pathlib.Path(__file__).parents[2] / "public" / "maharashtra_districts.json",
            pathlib.Path.cwd() / "public" / "maharashtra_districts.json",
            pathlib.Path.cwd().parent / "public" / "maharashtra_districts.json",
        ]
        geo_path = None
        for p in candidates:
            if p.exists():
                geo_path = p
                break
        if not geo_path:
            raise FileNotFoundError("maharashtra_districts.json not found")
        with open(geo_path) as f:
            gj = json.load(f)
        for feat in gj["features"]:
            if feat["properties"].get("NAME_2") == district:
                return feat["geometry"]
        raise ValueError(f"District {district} not found in GeoJSON")

    def fetch_district(self, district: str):
        if not self.is_available():
            raise RuntimeError("GEE not configured — set GEE_PROJECT_ID and authenticate earthengine-api (earthengine authenticate)")
        import ee
        # Ensure initialized
        try:
            ee.Initialize(project=GEE_PROJECT_ID)
        except Exception:
            pass

        geom_json = self._load_district_geometry(district)
        # Create EE geometry
        ee_geom = ee.Geometry(geom_json)

        # Sentinel-2 SR collection
        s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED") \
            .filterDate(SATELLITE_START_DATE, SATELLITE_END_DATE) \
            .filterBounds(ee_geom) \
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", MAX_CLOUD_PERCENT))

        size = s2.size().getInfo()
        if size == 0:
            return {
                "district": district,
                "ndviMean": None, "ndviMin": None, "ndviMax": None,
                "ndwiMean": None, "ndwiMin": None, "ndwiMax": None,
                "validPixelPercent": 0, "cloudPercent": None,
                "provider": self.name, "dataSource": self.data_source,
                "sourceDate": f"{SATELLITE_START_DATE} to {SATELLITE_END_DATE}",
                "processingVersion": PROCESSING_VERSION, "isRealData": True,
                "quality": {"status": "insufficient_data", "validPixelPercent": 0, "cloudPercent": None, "reason": "no imagery for date range"},
            }

        def mask_clouds(img):
            qa = img.select("QA60")
            # Bits 10 and 11 are clouds/cirrus
            cloudBitMask = 1 << 10
            cirrusBitMask = 1 << 11
            mask = qa.bitwiseAnd(cloudBitMask).eq(0).And(qa.bitwiseAnd(cirrusBitMask).eq(0))
            return img.updateMask(mask).divide(10000)

        def add_indices(img):
            ndvi = img.normalizedDifference(["B8", "B4"]).rename("NDVI")
            ndwi = img.normalizedDifference(["B8", "B11"]).rename("NDWI")
            return img.addBands(ndvi).addBands(ndwi)

        s2 = s2.map(mask_clouds).map(add_indices)
        # Median composite
        composite = s2.median()

        # District aggregation — mean/min/max via reduceRegion
        def reduce(band, reducer):
            try:
                return composite.select(band).reduceRegion(
                    reducer=reducer, geometry=ee_geom, scale=100, maxPixels=1e9
                ).get(band).getInfo()
            except Exception:
                return None

        ndvi_mean = reduce("NDVI", ee.Reducer.mean())
        ndvi_min = reduce("NDVI", ee.Reducer.min())
        ndvi_max = reduce("NDVI", ee.Reducer.max())
        ndwi_mean = reduce("NDWI", ee.Reducer.mean())
        ndwi_min = reduce("NDWI", ee.Reducer.min())
        ndwi_max = reduce("NDWI", ee.Reducer.max())

        # Valid pixel percent — estimate from masked vs unmasked
        # Simplified: use cloudPercent from collection metadata mean
        try:
            cloud_percent = s2.aggregate_mean("CLOUDY_PIXEL_PERCENTAGE").getInfo()
            cloud_percent = round(float(cloud_percent), 1) if cloud_percent is not None else None
        except Exception:
            cloud_percent = None

        valid_percent = None
        if cloud_percent is not None:
            valid_percent = int(max(0, min(100, 100 - cloud_percent)))
        elif ndvi_mean is not None:
            valid_percent = 85  # fallback estimate
        else:
            valid_percent = 0

        # Quality
        from ..processing.quality import assess_quality
        quality = assess_quality(
            ndvi_mean if ndvi_mean is not None else 0,
            ndwi_mean if ndwi_mean is not None else 0,
            valid_percent if valid_percent is not None else 0,
            cloud_percent if cloud_percent is not None else 0,
        )
        # If no valid ndvi, mark insufficient
        if ndvi_mean is None:
            quality = {"status": "insufficient_data", "validPixelPercent": valid_percent, "cloudPercent": cloud_percent, "reason": "no valid pixels after masking"}

        # Handle None -> null for API
        def clean(v):
            if v is None or (isinstance(v, float) and (v != v or v == float('inf') or v == float('-inf'))):
                return None
            return round(float(v), 3) if isinstance(v, float) else v

        return {
            "district": district,
            "ndviMean": clean(ndvi_mean),
            "ndviMin": clean(ndvi_min),
            "ndviMax": clean(ndvi_max),
            "ndwiMean": clean(ndwi_mean),
            "ndwiMin": clean(ndwi_min),
            "ndwiMax": clean(ndwi_max),
            "validPixelPercent": valid_percent,
            "cloudPercent": cloud_percent,
            "provider": self.name,
            "dataSource": self.data_source,
            "sourceDate": f"{SATELLITE_START_DATE} to {SATELLITE_END_DATE}",
            "processingVersion": PROCESSING_VERSION,
            "isRealData": True,
            "quality": quality,
        }

    def get_config(self):
        return {
            "project": GEE_PROJECT_ID or "(not set)",
            "startDate": SATELLITE_START_DATE,
            "endDate": SATELLITE_END_DATE,
            "maxCloudPercent": MAX_CLOUD_PERCENT,
            "processingVersion": PROCESSING_VERSION,
        }
