"""
NDVI — vegetation / crop-health indicator (Sentinel-2)
NDVI = (NIR - RED) / (NIR + RED)
Sentinel-2: NIR = B8, RED = B4
Range: -1 to +1. Use with disclaimer: not standalone disease/yield diagnosis.
"""

def ndvi(nir: float, red: float):
    if nir is None or red is None:
        return None
    denom = nir + red
    if denom == 0:
        return None
    return (nir - red) / denom
