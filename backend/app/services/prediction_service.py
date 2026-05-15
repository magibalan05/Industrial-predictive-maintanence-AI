from app.models.prediction.predictor import predict
from app.utils.helper import compute_health_score, utc_now_iso
from app.database.database import insert_prediction
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Track consecutive anomalies per equipment
_anomaly_counts: dict[str, int] = {}

def run_prediction(sensor_data: dict) -> dict:
    """
    Run ML prediction on sensor data, compute health score, persist result.
    Returns full prediction payload.
    """
    eq_id = sensor_data["equipment_id"]

    result = predict(sensor_data)
    risk_level = result["risk_level"]

    # Track consecutive anomaly count
    if risk_level > 0:
        _anomaly_counts[eq_id] = _anomaly_counts.get(eq_id, 0) + 1
    else:
        _anomaly_counts[eq_id] = 0

    health_score = compute_health_score(risk_level, _anomaly_counts.get(eq_id, 0))
    ts = utc_now_iso()

    payload = {
        "equipment_id":   eq_id,
        "equipment_name": sensor_data["equipment_name"],
        "equipment_type": sensor_data["equipment_type"],
        "risk_level":     risk_level,
        "risk_label":     result["risk_label"],
        "confidence":     result["confidence"],
        "probabilities":  result["probabilities"],
        "health_score":   health_score,
        "feature_importances": result["feature_importances"],
        "timestamp":      ts,
    }

    try:
        insert_prediction({**payload, "timestamp": ts})
    except Exception as e:
        logger.warning("Failed to persist prediction: %s", e)

    return payload
