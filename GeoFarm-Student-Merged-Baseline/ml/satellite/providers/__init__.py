from .base import SatelliteProvider
from .demo_provider import DemoProvider
from .gee_provider import GeeProvider

def get_provider():
    """Return real provider if available, else demo fallback — never crashes."""
    gee = GeeProvider()
    if gee.is_available():
        return gee
    return DemoProvider()

__all__ = ["SatelliteProvider", "DemoProvider", "GeeProvider", "get_provider"]
