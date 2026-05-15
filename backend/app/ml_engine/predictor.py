import os
import numpy as np
import joblib

# ── Simulation Settings ───────────────────────────────────────────────────────
from app.config.settings import (
    MODEL_PATH, SCALER_PATH, RISK_LABELS, 
    SIMULATION_LOAD_FACTOR, INJECT_CRITICAL_FAULT
)
from app.utils.logger import get_logger
from app.ml_engine.explainable_ai import generate_reasoning

logger = get_logger(__name__)

_model  = None
_scaler = None

FEATURES = ["temperature", "vibration", "voltage", "current", "pressure", "rpm"]

def _load():
    global _model, _scaler
    if _model is None:
        # Resolve paths to ensure they work regardless of current working directory
        model_p = os.path.abspath(MODEL_PATH)
        scaler_p = os.path.abspath(SCALER_PATH)
        
        if not os.path.exists(model_p):
            # Fallback for some environments where paths might be relative to project root
            root_model = os.path.join(os.getcwd(), "backend", "app", "models", "saved_models", "random_forest.pkl")
            root_scaler = os.path.join(os.getcwd(), "backend", "app", "models", "saved_models", "scaler.pkl")
            
            if os.path.exists(root_model):
                model_p = root_model
                scaler_p = root_scaler
            else:
                raise FileNotFoundError(f"Digital Twin Model not found at {model_p}.")
            
        _model  = joblib.load(model_p)
        _scaler = joblib.load(scaler_p)
        logger.info("Adaptive ML model loaded successfully.")

def predict_industrial_risk(sensor_data: dict) -> dict:
    """
    Apply Adaptive ML inference to evaluate industrial asset risk.
    Integrates Explainable AI (XAI) for reasoning generation.
    """
    try:
        _load()
        X = np.array([[sensor_data.get(f, 0) for f in FEATURES]], dtype=float)
        X_scaled = _scaler.transform(X)

        risk_level  = int(_model.predict(X_scaled)[0])
        proba       = _model.predict_proba(X_scaled)[0]
        confidence  = float(round(proba[risk_level] * 100, 1))

        # Feature importances for XAI reasoning
        importances = {
            f: round(float(imp), 4)
            for f, imp in zip(FEATURES, _model.feature_importances_)
        }

        # Generate Explainable AI reasoning
        reasoning = generate_reasoning(
            sensor_data, 
            risk_level, 
            importances, 
            sensor_data.get("equipment_type", "Motor")
        )

        # ── Stage 7.5: Remaining Useful Life (RUL) Estimation ───────────────────
        # Heuristic based on risk level, confidence, and degradation trends
        if risk_level == 0:
            estimated_rul = 2400 + (confidence * 10)  # ~100 days
        elif risk_level == 1:
            estimated_rul = 480 - (confidence * 4)    # ~20 days descending
        else:
            estimated_rul = max(2, 48 - (confidence * 0.4)) # ~2 days descending

        return {
            "risk_level":          risk_level,
            "risk_label":          RISK_LABELS[risk_level],
            "confidence":          confidence,
            "estimated_rul_hours": round(estimated_rul, 1),
            "reasoning":           reasoning,
            "probabilities":       {
                "healthy":  round(float(proba[0]) * 100, 1),
                "warning":  round(float(proba[1]) * 100, 1),
                "critical": round(float(proba[2]) * 100, 1),
            },
            "feature_importances": importances,
        }
    except Exception as e:
        logger.error("Prediction Error: %s", e)
        return {
            "risk_level": 0,
            "risk_label": "Error",
            "confidence": 0,
            "reasoning": f"Intelligence Engine Offline: {str(e)}",
            "probabilities": {"healthy": 0, "warning": 0, "critical": 0},
            "feature_importances": {}
        }
