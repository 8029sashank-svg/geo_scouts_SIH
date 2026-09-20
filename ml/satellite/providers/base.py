"""
Provider base — all satellite providers implement this interface.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class SatelliteProvider(ABC):
    name: str = "base"
    data_source: str = "unknown"

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if provider can serve real data (credentials, API, etc.)."""
        ...

    @abstractmethod
    def fetch_district(self, district: str) -> Dict[str, Any]:
        """
        Return district-level satellite indicators or None if unavailable.
        Expected keys: ndviMean, ndwiMean, validPixelPercent, cloudPercent, quality, etc.
        If real value cannot be obtained, return None for that field — do not fabricate.
        """
        ...

    def fetch_all(self, districts: List[str]) -> Dict[str, Dict[str, Any]]:
        out = {}
        for d in districts:
            try:
                out[d] = self.fetch_district(d)
            except Exception as e:
                out[d] = {"error": str(e), "provider": self.name, "isRealData": False}
        return out
