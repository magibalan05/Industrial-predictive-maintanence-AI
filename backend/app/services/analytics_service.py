from app.database.database import fetch_analytics_summary, fetch_sensor_history, fetch_predictions
from app.utils.logger import get_logger

logger = get_logger(__name__)

def get_dashboard_analytics() -> dict:
    """Aggregate key KPIs for the analytics dashboard."""
    summary = fetch_analytics_summary()

    # Recent 200 sensor readings for trend data
    history = fetch_sensor_history(limit=200)
    recent_preds = fetch_predictions(limit=100)

    # Build per-equipment health snapshot
    equipment_health = {}
    for p in recent_preds:
        eid = p["equipment_id"]
        if eid not in equipment_health:
            equipment_health[eid] = {
                "equipment_id":   eid,
                "equipment_name": p["equipment_name"],
                "health_score":   p["health_score"],
                "risk_label":     p["risk_label"],
                "last_updated":   p["timestamp"],
            }

    return {
        "summary": summary,
        "equipment_health": list(equipment_health.values()),
        "recent_sensor_history_count": len(history),
    }
