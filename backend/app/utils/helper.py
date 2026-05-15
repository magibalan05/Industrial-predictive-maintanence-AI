from datetime import datetime, timezone

def utc_now_iso() -> str:
    """Return current UTC time as ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()

def clamp(value: float, lo: float, hi: float) -> float:
    """Clamp a value between lo and hi."""
    return max(lo, min(hi, value))

def compute_health_score(risk_level: int, consecutive_anomalies: int = 0) -> int:
    """
    Compute equipment health score (0-100).
    risk_level: 0=Healthy, 1=Warning, 2=Critical
    """
    base = {0: 100, 1: 72, 2: 35}
    penalty = min(consecutive_anomalies * 3, 20)
    return clamp(base.get(risk_level, 100) - penalty, 0, 100)
