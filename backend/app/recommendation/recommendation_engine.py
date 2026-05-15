from app.config.settings import THRESHOLDS
from app.utils.helper import utc_now_iso
from app.database.database import insert_recommendation
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Rule-based Enterprise Recommendation Logic
MAINTENANCE_RULES = [
    (
        lambda s: s["temperature"] >= THRESHOLDS["temperature"]["critical"],
        "CRITICAL",
        "Thermal Critical: Shutdown Required",
        "Digital Twin thermal simulation has reached critical failure point. Shut down equipment and inspect cooling system/coolant levels immediately.",
    ),
    (
        lambda s: THRESHOLDS["temperature"]["warning"] <= s["temperature"] < THRESHOLDS["temperature"]["critical"],
        "HIGH",
        "Thermal Warning: Maintenance Alert",
        "Temperature trending above safety margin. Inspect ventilation ducts and cooling fan performance.",
    ),
    (
        lambda s: s["vibration"] >= THRESHOLDS["vibration"]["critical"],
        "CRITICAL",
        "Mechanical Instability: Stop Asset",
        "Severe vibration patterns detected. Potential bearing failure or shaft misalignment. Immediate mechanical inspection required.",
    ),
    (
        lambda s: THRESHOLDS["vibration"]["warning"] <= s["vibration"] < THRESHOLDS["vibration"]["critical"],
        "HIGH",
        "Mechanical Alert: Vibration Spike",
        "Vibration levels exceeding operational baseline. Schedule lubrication and alignment check.",
    ),
    (
        lambda s: s["pressure"] >= THRESHOLDS["pressure"]["critical"],
        "CRITICAL",
        "System Pressure Critical",
        "Hydraulic/Pneumatic pressure exceeded safe limits. Verify relief valve operation immediately.",
    ),
]

def generate_enterprise_recommendations(sensor_data: dict, risk_level: int) -> list[dict]:
    """
    Stage 10 — Maintenance Recommendation Engine.
    Generates intelligent actions based on adaptive threshold analysis.
    """
    ts = utc_now_iso()
    eq_id   = sensor_data["equipment_id"]
    eq_name = sensor_data["equipment_name"]
    recommendations = []

    for condition_fn, priority, title, description in MAINTENANCE_RULES:
        try:
            if condition_fn(sensor_data):
                rec = {
                    "equipment_id":   eq_id,
                    "equipment_name": eq_name,
                    "priority":       priority,
                    "title":          title,
                    "description":    description,
                    "timestamp":      ts,
                }
                recommendations.append(rec)
                
                # Persist to database for historical reporting
                if len(recommendations) <= 3:
                    try:
                        insert_recommendation(rec)
                    except Exception as e:
                        logger.warning("Database persistence failed for recommendation: %s", e)
        except Exception:
            continue

    # Prescriptive baseline for Healthy assets
    if not recommendations and risk_level == 0:
        recommendations.append({
            "equipment_id":   eq_id,
            "equipment_name": eq_name,
            "priority":       "LOW",
            "title":          "Asset Healthy: Maintain Baseline",
            "description":    "Operational parameters are stable. Continue following standard Industry 4.0 preventative maintenance schedules.",
            "timestamp":      ts,
        })

    return recommendations
