import io
import json
import uuid
from datetime import datetime, timezone

import pandas as pd

from app.models.prediction.predictor import predict
from app.utils.helper import compute_health_score, utc_now_iso
from app.services.alert_service import generate_alerts
from app.services.recommendation_service import generate_recommendations
from app.database.database import (
    insert_uploaded_dataset,
    insert_uploaded_readings_bulk,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Accepted column aliases → canonical name
COLUMN_ALIASES = {
    "temp":          "temperature",
    "temperature":   "temperature",
    "vib":           "vibration",
    "vibration":     "vibration",
    "volt":          "voltage",
    "voltage":       "voltage",
    "curr":          "current",
    "current":       "current",
    "amp":           "current",
    "amps":          "current",
    "press":         "pressure",
    "pressure":      "pressure",
    "psi":           "pressure",
    "speed":         "rpm",
    "rpm":           "rpm",
    "equip_id":      "equipment_id",
    "equipment_id":  "equipment_id",
    "equip_name":    "equipment_name",
    "equipment_name":"equipment_name",
    "name":          "equipment_name",
    "equip_type":    "equipment_type",
    "equipment_type":"equipment_type",
    "type":          "equipment_type",
    "time":          "timestamp",
    "timestamp":     "timestamp",
    "date":          "timestamp",
    "datetime":      "timestamp",
}

REQUIRED_SENSORS = ["temperature", "vibration", "voltage", "current", "pressure", "rpm"]

def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Rename columns to canonical names using aliases (case-insensitive)."""
    df.columns = [c.strip().lower() for c in df.columns]
    rename = {}
    for col in df.columns:
        if col in COLUMN_ALIASES:
            rename[col] = COLUMN_ALIASES[col]
    return df.rename(columns=rename)

def _fill_equipment_defaults(df: pd.DataFrame, filename: str) -> pd.DataFrame:
    if "equipment_id" not in df.columns:
        df["equipment_id"] = "UP-001"
    if "equipment_name" not in df.columns:
        df["equipment_name"] = filename.replace(".csv", "").replace(".xlsx", "")[:20]
    if "equipment_type" not in df.columns:
        df["equipment_type"] = "Uploaded"
    if "timestamp" not in df.columns:
        df["timestamp"] = utc_now_iso()
    # Fill missing sensors with 0
    for s in REQUIRED_SENSORS:
        if s not in df.columns:
            df[s] = 0.0
    return df

def process_upload(file_bytes: bytes, filename: str) -> dict:
    """
    Parse uploaded CSV or Excel, run ML predictions on each row.
    Returns summary + processed rows.
    """
    # ── Parse file ────────────────────────────────────────────────────────────
    try:
        if filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            # use sep=None to automatically detect comma or semicolon
            df = pd.read_csv(io.BytesIO(file_bytes), sep=None, engine='python')
    except Exception as e:
        raise ValueError(f"Could not parse file: {e}")

    if df.empty:
        raise ValueError("Uploaded file is empty.")

    # Convert all NaN to 0 to prevent ML model crashing
    df.fillna(0, inplace=True)


    df = _normalise_columns(df)
    df = _fill_equipment_defaults(df, filename)

    # ── Run ML on each row ───────────────────────────────────────────────────
    processed_rows = []
    healthy_count = warning_count = critical_count = 0

    for _, row in df.iterrows():
        sensor = {
            "equipment_id":   str(row.get("equipment_id", "UP-001")),
            "equipment_name": str(row.get("equipment_name", "Uploaded")),
            "equipment_type": str(row.get("equipment_type", "Uploaded")),
            "temperature":    float(row.get("temperature", 0)),
            "vibration":      float(row.get("vibration", 0)),
            "voltage":        float(row.get("voltage", 0)),
            "current":        float(row.get("current", 0)),
            "pressure":       float(row.get("pressure", 0)),
            "rpm":            float(row.get("rpm", 0)),
            "timestamp":      str(row.get("timestamp", utc_now_iso())),
        }

        try:
            ml = predict(sensor)
            risk_level  = ml["risk_level"]
            risk_label  = ml["risk_label"]
            confidence  = ml["confidence"]
            health_score = compute_health_score(risk_level)
        except Exception as e:
            logger.error("ML error on row %s: %s", sensor, e)
            risk_level = 0; risk_label = "Healthy"; confidence = 0.0; health_score = 100


        if risk_level == 0: healthy_count  += 1
        elif risk_level == 1: warning_count += 1
        else: critical_count += 1

        processed_rows.append({
            **sensor,
            "risk_level":   risk_level,
            "risk_label":   risk_label,
            "confidence":   confidence,
            "health_score": health_score,
        })

    # ── Persist to DB ─────────────────────────────────────────────────────────
    meta = {
        "filename":       f"{uuid.uuid4().hex[:8]}_{filename}",
        "original_name":  filename,
        "row_count":      len(processed_rows),
        "columns":        json.dumps(list(df.columns.tolist())),
        "healthy_count":  healthy_count,
        "warning_count":  warning_count,
        "critical_count": critical_count,
        "uploaded_at":    utc_now_iso(),
    }
    dataset_id = insert_uploaded_dataset(meta)
    insert_uploaded_readings_bulk(dataset_id, processed_rows)

    logger.info("Dataset '%s' processed: %d rows (H:%d W:%d C:%d)",
                filename, len(processed_rows), healthy_count, warning_count, critical_count)

    return {
        "dataset_id":     dataset_id,
        "filename":       filename,
        "row_count":      len(processed_rows),
        "healthy_count":  healthy_count,
        "warning_count":  warning_count,
        "critical_count": critical_count,
        "uploaded_at":    meta["uploaded_at"],
        "rows":           processed_rows,
    }
