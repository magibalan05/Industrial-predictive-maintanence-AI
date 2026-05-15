from app.config.settings import THRESHOLDS
from app.utils.helper import utc_now_iso
from app.database.database import insert_recommendation
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Rule templates: (condition_fn, priority, title, description)
RULES = [
    (
        lambda s: s["temperature"] >= THRESHOLDS["temperature"]["critical"],
        "CRITICAL",
        "Immediate Cooling Required",
        "Temperature has exceeded critical threshold. Shut down equipment and inspect the cooling system immediately. Check coolant levels, fan operation, and heat sink integrity.",
    ),
    (
        lambda s: THRESHOLDS["temperature"]["warning"] <= s["temperature"] < THRESHOLDS["temperature"]["critical"],
        "HIGH",
        "Temperature Elevated — Monitor Closely",
        "Temperature is in warning zone. Inspect cooling fan and ventilation ducts. Check for blocked air filters. Schedule maintenance within 24 hours.",
    ),
    (
        lambda s: s["vibration"] >= THRESHOLDS["vibration"]["critical"],
        "CRITICAL",
        "Severe Vibration — Stop Equipment",
        "Extreme vibration detected. Possible bearing failure or rotor imbalance. Stop operation immediately and perform mechanical inspection.",
    ),
    (
        lambda s: THRESHOLDS["vibration"]["warning"] <= s["vibration"] < THRESHOLDS["vibration"]["critical"],
        "HIGH",
        "High Vibration — Inspect Bearings",
        "Vibration levels are elevated. Possible bearing wear or shaft misalignment. Inspect motor mounts and coupling. Lubricate bearings if necessary.",
    ),
    (
        lambda s: s["pressure"] >= THRESHOLDS["pressure"]["critical"],
        "CRITICAL",
        "Critical Pressure — Safety Risk",
        "Pressure has exceeded safe operating limits. Check pressure relief valve immediately. Reduce load or shut down to prevent equipment damage.",
    ),
    (
        lambda s: THRESHOLDS["pressure"]["warning"] <= s["pressure"] < THRESHOLDS["pressure"]["critical"],
        "HIGH",
        "Pressure Warning — Check Valves",
        "Operating pressure is higher than normal. Inspect pressure relief valves and seals. Monitor closely over the next hour.",
    ),
    (
        lambda s: s["current"] >= THRESHOLDS["current"]["critical"],
        "CRITICAL",
        "Overcurrent Detected — Electrical Risk",
        "Current draw is critically high. Risk of electrical damage and fire. Check for short circuits, insulation breakdown, or overloading. Disconnect if safe to do so.",
    ),
    (
        lambda s: THRESHOLDS["current"]["warning"] <= s["current"] < THRESHOLDS["current"]["critical"],
        "MEDIUM",
        "Elevated Current Draw",
        "Current is above normal range. Check for overloading, motor winding issues, or power supply problems.",
    ),
    (
        lambda s: s.get("rpm", 0) >= THRESHOLDS["rpm"]["critical"],
        "CRITICAL",
        "Overspeed Detected",
        "RPM has exceeded safe limits. Risk of mechanical failure. Engage governor control immediately and reduce load.",
    ),
]

def generate_recommendations(sensor_data: dict, risk_level: int) -> list[dict]:
    """Generate rule-based maintenance recommendations for the given sensor snapshot."""
    ts = utc_now_iso()
    eq_id   = sensor_data["equipment_id"]
    eq_name = sensor_data["equipment_name"]
    results = []

    for condition_fn, priority, title, description in RULES:
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
                results.append(rec)
                if len(results) <= 3:   # Persist up to 3 per cycle
                    try:
                        insert_recommendation(rec)
                    except Exception as e:
                        logger.warning("Failed to persist recommendation: %s", e)
        except Exception:
            pass

    # Default healthy recommendation
    if not results and risk_level == 0:
        results.append({
            "equipment_id":   eq_id,
            "equipment_name": eq_name,
            "priority":       "LOW",
            "title":          "Equipment Operating Normally",
            "description":    "All sensor readings are within normal operating parameters. Continue scheduled preventive maintenance as planned.",
            "timestamp":      ts,
        })

    return results
