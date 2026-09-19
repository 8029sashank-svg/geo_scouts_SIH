"""
District aggregation — cached per-district means.
Frontend should not call GEE directly; it reads the pre-aggregated dataset via FastAPI.
"""

# For demo, aggregation is in the provider itself (deterministic per-district).
# This module documents the flow and provides helpers for future real pipeline.

def aggregate_demo():
    """Return demo aggregated dict for all districts (used when GEE unavailable)."""
    from ..providers.demo_provider import DemoProvider
    from ..providers import get_provider
    # Use the active provider (will be demo when GEE not configured)
    provider = get_provider()
    districts = [
        'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Bhandara', 'Bid', 'Buldana', 'Chandrapur',
        'Dhule', 'Garhchiroli', 'Gondiya', 'Greater Bombay', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur',
        'Latur', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Parbhani', 'Pune',
        'Raigarh', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal',
    ]
    return provider.fetch_all(districts)
