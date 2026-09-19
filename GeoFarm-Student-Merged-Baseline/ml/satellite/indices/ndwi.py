"""
NDWI — vegetation / water-stress-related indicator
Documented formulation for this project (one definition, clearly stated):

NDWI = (NIR - SWIR) / (NIR + SWIR)
Sentinel-2: NIR = B8, SWIR = B11

This is the Gao 1996 vegetation water-content NDWI, appropriate for water-stress indication.
Do not mix with McFeeters NDWI (Green-NIR) without explanation.
Range: -1 to +1.
"""

def ndwi(nir: float, swir: float):
    if nir is None or swir is None:
        return None
    denom = nir + swir
    if denom == 0:
        return None
    return (nir - swir) / denom
