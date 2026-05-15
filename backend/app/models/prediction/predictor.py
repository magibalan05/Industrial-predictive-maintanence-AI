import os
import numpy as np
import joblib
from app.config.settings import MODEL_PATH, SCALER_PATH, RISK_LABELS
from app.utils.logger import get_logger

logger = get_logger(__name__)

_model  = None
_scaler = None

FEATURES = ["temperature", "vibration", "voltage", "current", "pressure", "rpm"]

def _load():
    global _model, _scaler
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. "
                "Run: python -m app.models.training.train_model"
            )
        _model  = joblib.load(MODEL_PATH)
        _scaler = joblib.load(SCALER_PATH)
        logger.info("ML model loaded from %s", MODEL_PATH)

def predict(sensor_data: dict) -> dict:
    """
    Predict risk level for a sensor reading.
    Returns: { risk_level, risk_label, confidence, feature_importances }
    """
    _load()
    X = np.array([[sensor_data.get(f, 0) for f in FEATURES]], dtype=float)
    X_scaled = _scaler.transform(X)

    risk_level  = int(_model.predict(X_scaled)[0])
    proba       = _model.predict_proba(X_scaled)[0]
    confidence  = float(round(proba[risk_level] * 100, 1))

    # Feature importances (for explainability)
    importances = {
        f: round(float(imp), 4)
        for f, imp in zip(FEATURES, _model.feature_importances_)
    }

    return {
        "risk_level":          risk_level,
        "risk_label":          RISK_LABELS[risk_level],
        "confidence":          confidence,
        "probabilities":       {
            "healthy":  round(float(proba[0]) * 100, 1),
            "warning":  round(float(proba[1]) * 100, 1),
            "critical": round(float(proba[2]) * 100, 1),
        },
        "feature_importances": importances,
    }
