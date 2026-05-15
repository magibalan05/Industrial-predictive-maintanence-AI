import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib
import sys

# Allow running from any location
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))

from app.config.settings import (
    TRAINING_SAMPLES, RANDOM_STATE, MODEL_PATH, SCALER_PATH, SAVED_MODELS_DIR
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

def generate_synthetic_dataset(n_samples: int = TRAINING_SAMPLES) -> pd.DataFrame:
    """
    Create a labelled synthetic industrial sensor dataset.
    Labels: 0=Healthy, 1=Warning, 2=Critical
    """
    np.random.seed(RANDOM_STATE)
    n_each = n_samples // 3
    n_critical = n_samples - 2 * n_each

    # ── Healthy class ────────────────────────────────────────────────────────
    healthy = pd.DataFrame({
        "temperature": np.random.normal(50, 8, n_each),
        "vibration":   np.random.normal(1.0, 0.3, n_each),
        "voltage":     np.random.normal(228, 4, n_each),
        "current":     np.random.normal(18, 3, n_each),
        "pressure":    np.random.normal(80, 8, n_each),
        "rpm":         np.random.normal(1800, 80, n_each),
        "label": 0,
    })

    # ── Warning class ────────────────────────────────────────────────────────
    warning = pd.DataFrame({
        "temperature": np.random.normal(78, 5, n_each),
        "vibration":   np.random.normal(3.2, 0.4, n_each),
        "voltage":     np.random.normal(243, 3, n_each),
        "current":     np.random.normal(36, 4, n_each),
        "pressure":    np.random.normal(128, 6, n_each),
        "rpm":         np.random.normal(4200, 150, n_each),
        "label": 1,
    })

    # ── Critical class ───────────────────────────────────────────────────────
    critical = pd.DataFrame({
        "temperature": np.random.normal(93, 4, n_critical),
        "vibration":   np.random.normal(4.8, 0.3, n_critical),
        "voltage":     np.random.normal(249, 2, n_critical),
        "current":     np.random.normal(48, 3, n_critical),
        "pressure":    np.random.normal(144, 4, n_critical),
        "rpm":         np.random.normal(4850, 100, n_critical),
        "label": 2,
    })

    df = pd.concat([healthy, warning, critical], ignore_index=True).sample(
        frac=1, random_state=RANDOM_STATE
    )
    return df

def train():
    logger.info("Generating synthetic dataset (%d samples)…", TRAINING_SAMPLES)
    df = generate_synthetic_dataset()

    features = ["temperature", "vibration", "voltage", "current", "pressure", "rpm"]
    X = df[features].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    # Scale
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    # Train
    logger.info("Training Random Forest Classifier…")
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_split=5,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    model.fit(X_train_s, y_train)

    # Evaluate
    y_pred = model.predict(X_test_s)
    acc = accuracy_score(y_test, y_pred)
    logger.info("Accuracy: %.4f", acc)
    logger.info("\n%s", classification_report(y_test, y_pred, target_names=["Healthy", "Warning", "Critical"]))

    # Save
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    logger.info("Model saved → %s", MODEL_PATH)
    logger.info("Scaler saved → %s", SCALER_PATH)
    return acc

if __name__ == "__main__":
    train()
