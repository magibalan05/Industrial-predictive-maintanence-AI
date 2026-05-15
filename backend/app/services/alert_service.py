from app.config.settings import THRESHOLDS
from app.utils.helper import utc_now_iso
from app.database.database import insert_alert
from app.utils.logger import get_logger

logger = get_logger(__name__)

def generate_alerts(sensor_data: dict, risk_level: int) -> list[dict]:
    """Generate alerts based on sensor thresholds and ML risk level."""
    ts     = utc_now_iso()
    eq_id  = sensor_data["equipment_id"]
    eq_name= sensor_data["equipment_name"]
    alerts = []

    checks = [
        ("temperature", sensor_data["temperature"],  "°C"),
        ("vibration",   sensor_data["vibration"],    "mm/s"),
        ("voltage",     sensor_data["voltage"],      "V"),
        ("current",     sensor_data["current"],      "A"),
        ("pressure",    sensor_data["pressure"],     "PSI"),
    ]
    if sensor_data.get("rpm", 0) > 0:
        checks.append(("rpm", sensor_data["rpm"], "RPM"))

    for sensor, value, unit in checks:
        th = THRESHOLDS.get(sensor)
        if not th:
            continue
        if value >= th["critical"]:
            severity = "Critical"
            message  = (
                f"CRITICAL: {sensor.title()} on {eq_name} reached {value}{unit} "
                f"(threshold: {th['critical']}{unit}). Immediate action required!"
            )
        elif value >= th["warning"]:
            severity = "Warning"
            message  = (
                f"WARNING: {sensor.title()} on {eq_name} is {value}{unit} "
                f"(threshold: {th['warning']}{unit}). Monitor closely."
            )
        else:
            continue

        alert = {
            "equipment_id":   eq_id,
            "equipment_name": eq_name,
            "severity":       severity,
            "message":        message,
            "sensor":         sensor,
            "value":          value,
            "timestamp":      ts,
        }
        alerts.append(alert)
        try:
            insert_alert(alert)
        except Exception as e:
            logger.warning("Failed to persist alert: %s", e)

    return alerts
