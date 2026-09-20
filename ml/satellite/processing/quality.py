"""
Satellite data quality checks.
"""

def assess_quality(ndvi, ndwi, valid_percent, cloud_percent):
    # Check ranges
    if ndvi is None or ndwi is None or valid_percent is None:
        return {"status": "unavailable", "validPixelPercent": valid_percent, "cloudPercent": cloud_percent}
    if not (-1 <= ndvi <= 1) or not (-1 <= ndwi <= 1):
        return {"status": "warning", "validPixelPercent": valid_percent, "cloudPercent": cloud_percent, "reason": "index out of range -1..1"}
    if valid_percent is not None and valid_percent < 50:
        return {"status": "insufficient_data", "validPixelPercent": valid_percent, "cloudPercent": cloud_percent}
    if cloud_percent is not None and cloud_percent > 40:
        return {"status": "warning", "validPixelPercent": valid_percent, "cloudPercent": cloud_percent}
    if valid_percent is not None and valid_percent < 75:
        return {"status": "warning", "validPixelPercent": valid_percent, "cloudPercent": cloud_percent}
    return {"status": "good", "validPixelPercent": valid_percent, "cloudPercent": cloud_percent}
