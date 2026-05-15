import sqlite3
import os
from app.config.settings import DB_PATH
from app.utils.logger import get_logger

logger = get_logger(__name__)

def get_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create all tables if they don't exist."""
    conn = get_connection()
    cur = conn.cursor()

    cur.executescript("""
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            equipment_id TEXT NOT NULL,
            equipment_name TEXT NOT NULL,
            equipment_type TEXT NOT NULL,
            temperature  REAL,
            vibration    REAL,
            voltage      REAL,
            current      REAL,
            pressure     REAL,
            rpm          REAL,
            data_source  TEXT DEFAULT 'simulated',
            timestamp    TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS predictions (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            equipment_id  TEXT NOT NULL,
            equipment_name TEXT NOT NULL,
            risk_level    INTEGER NOT NULL,
            risk_label    TEXT NOT NULL,
            confidence    REAL NOT NULL,
            health_score  INTEGER NOT NULL,
            data_source   TEXT DEFAULT 'simulated',
            timestamp     TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS alerts (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            equipment_id  TEXT NOT NULL,
            equipment_name TEXT NOT NULL,
            severity      TEXT NOT NULL,
            message       TEXT NOT NULL,
            sensor        TEXT,
            value         REAL,
            acknowledged  INTEGER DEFAULT 0,
            data_source   TEXT DEFAULT 'simulated',
            timestamp     TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS recommendations (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            equipment_id  TEXT NOT NULL,
            equipment_name TEXT NOT NULL,
            priority      TEXT NOT NULL,
            title         TEXT NOT NULL,
            description   TEXT NOT NULL,
            timestamp     TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS uploaded_datasets (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            filename      TEXT NOT NULL,
            original_name TEXT NOT NULL,
            row_count     INTEGER NOT NULL,
            columns       TEXT NOT NULL,
            healthy_count INTEGER DEFAULT 0,
            warning_count INTEGER DEFAULT 0,
            critical_count INTEGER DEFAULT 0,
            uploaded_at   TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS uploaded_readings (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            dataset_id    INTEGER NOT NULL,
            equipment_id  TEXT,
            equipment_name TEXT,
            equipment_type TEXT,
            temperature   REAL,
            vibration     REAL,
            voltage       REAL,
            current       REAL,
            pressure      REAL,
            rpm           REAL,
            risk_level    INTEGER,
            risk_label    TEXT,
            confidence    REAL,
            health_score  INTEGER,
            timestamp     TEXT,
            FOREIGN KEY(dataset_id) REFERENCES uploaded_datasets(id)
        );
    """)

    # ── Migrations: add columns if upgrading from old DB ─────────────────────
    for col, default in [
        ("data_source", "'simulated'"),
    ]:
        try:
            cur.execute(f"ALTER TABLE sensor_readings ADD COLUMN {col} TEXT DEFAULT {default}")
            conn.commit()
        except Exception:
            pass
        try:
            cur.execute(f"ALTER TABLE predictions ADD COLUMN {col} TEXT DEFAULT {default}")
            conn.commit()
        except Exception:
            pass
        try:
            cur.execute(f"ALTER TABLE alerts ADD COLUMN {col} TEXT DEFAULT {default}")
            conn.commit()
        except Exception:
            pass

    conn.commit()
    conn.close()
    logger.info("Database initialised at %s", DB_PATH)

def insert_sensor_reading(data: dict, data_source: str = "simulated"):
    conn = get_connection()
    conn.execute("""
        INSERT INTO sensor_readings
            (equipment_id, equipment_name, equipment_type,
             temperature, vibration, voltage, current, pressure, rpm,
             data_source, timestamp)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
    """, (
        data["equipment_id"], data["equipment_name"], data["equipment_type"],
        data["temperature"], data["vibration"], data["voltage"],
        data["current"], data["pressure"], data["rpm"],
        data_source, data["timestamp"]
    ))
    conn.commit()
    conn.close()

def insert_prediction(data: dict, data_source: str = "simulated"):
    conn = get_connection()
    conn.execute("""
        INSERT INTO predictions
            (equipment_id, equipment_name, risk_level, risk_label,
             confidence, health_score, data_source, timestamp)
        VALUES (?,?,?,?,?,?,?,?)
    """, (
        data["equipment_id"], data["equipment_name"],
        data["risk_level"], data["risk_label"],
        data["confidence"], data["health_score"],
        data_source, data["timestamp"]
    ))
    conn.commit()
    conn.close()

def insert_alert(data: dict, data_source: str = "simulated"):
    conn = get_connection()
    conn.execute("""
        INSERT INTO alerts
            (equipment_id, equipment_name, severity, message,
             sensor, value, data_source, timestamp)
        VALUES (?,?,?,?,?,?,?,?)
    """, (
        data["equipment_id"], data["equipment_name"],
        data["severity"], data["message"],
        data.get("sensor"), data.get("value"),
        data_source, data["timestamp"]
    ))
    conn.commit()
    conn.close()

def insert_recommendation(data: dict):
    conn = get_connection()
    conn.execute("""
        INSERT INTO recommendations
            (equipment_id, equipment_name, priority, title, description, timestamp)
        VALUES (?,?,?,?,?,?)
    """, (
        data["equipment_id"], data["equipment_name"],
        data["priority"], data["title"], data["description"], data["timestamp"]
    ))
    conn.commit()
    conn.close()

# ── Uploaded Dataset Functions ────────────────────────────────────────────────

def insert_uploaded_dataset(meta: dict) -> int:
    """Insert dataset metadata and return its new ID."""
    conn = get_connection()
    cur = conn.execute("""
        INSERT INTO uploaded_datasets
            (filename, original_name, row_count, columns,
             healthy_count, warning_count, critical_count, uploaded_at)
        VALUES (?,?,?,?,?,?,?,?)
    """, (
        meta["filename"], meta["original_name"], meta["row_count"],
        meta["columns"],
        meta.get("healthy_count", 0), meta.get("warning_count", 0), meta.get("critical_count", 0),
        meta["uploaded_at"]
    ))
    dataset_id = cur.lastrowid
    conn.commit()
    conn.close()
    return dataset_id

def insert_uploaded_readings_bulk(dataset_id: int, rows: list):
    conn = get_connection()
    conn.executemany("""
        INSERT INTO uploaded_readings
            (dataset_id, equipment_id, equipment_name, equipment_type,
             temperature, vibration, voltage, current, pressure, rpm,
             risk_level, risk_label, confidence, health_score, timestamp)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, [
        (
            dataset_id,
            r.get("equipment_id"), r.get("equipment_name"), r.get("equipment_type"),
            r.get("temperature"), r.get("vibration"), r.get("voltage"),
            r.get("current"), r.get("pressure"), r.get("rpm"),
            r.get("risk_level"), r.get("risk_label"),
            r.get("confidence"), r.get("health_score"),
            r.get("timestamp")
        )
        for r in rows
    ])
    conn.commit()
    conn.close()

def fetch_uploaded_datasets() -> list:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM uploaded_datasets ORDER BY id DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def fetch_uploaded_readings(dataset_id: int, limit: int = 500) -> list:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM uploaded_readings WHERE dataset_id=? ORDER BY id ASC LIMIT ?",
        (dataset_id, limit)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_uploaded_dataset(dataset_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM uploaded_readings WHERE dataset_id=?", (dataset_id,))
    conn.execute("DELETE FROM uploaded_datasets WHERE id=?", (dataset_id,))
    conn.commit()
    conn.close()

# ── Original fetch functions ──────────────────────────────────────────────────

def fetch_sensor_history(equipment_id: str = None, limit: int = 200,
                         data_source: str = None) -> list:
    conn = get_connection()
    base = "SELECT * FROM sensor_readings"
    conds, params = [], []
    if equipment_id:
        conds.append("equipment_id=?"); params.append(equipment_id)
    if data_source:
        conds.append("data_source=?"); params.append(data_source)
    if conds:
        base += " WHERE " + " AND ".join(conds)
    base += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(base, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def fetch_predictions(equipment_id: str = None, limit: int = 100,
                      data_source: str = None) -> list:
    conn = get_connection()
    base = "SELECT * FROM predictions"
    conds, params = [], []
    if equipment_id:
        conds.append("equipment_id=?"); params.append(equipment_id)
    if data_source:
        conds.append("data_source=?"); params.append(data_source)
    if conds:
        base += " WHERE " + " AND ".join(conds)
    base += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(base, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def fetch_alerts(limit: int = 50, unacknowledged_only: bool = False,
                 data_source: str = None) -> list:
    conn = get_connection()
    conds, params = [], []
    if unacknowledged_only:
        conds.append("acknowledged=0")
    if data_source:
        conds.append("data_source=?"); params.append(data_source)
    query = "SELECT * FROM alerts"
    if conds:
        query += " WHERE " + " AND ".join(conds)
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def fetch_recommendations(limit: int = 20) -> list:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM recommendations ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def fetch_analytics_summary() -> dict:
    conn = get_connection()
    total    = conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
    critical = conn.execute("SELECT COUNT(*) FROM predictions WHERE risk_level=2").fetchone()[0]
    warning  = conn.execute("SELECT COUNT(*) FROM predictions WHERE risk_level=1").fetchone()[0]
    healthy  = conn.execute("SELECT COUNT(*) FROM predictions WHERE risk_level=0").fetchone()[0]
    avg_health = conn.execute("SELECT AVG(health_score) FROM predictions").fetchone()[0] or 100
    up_total = conn.execute("SELECT COUNT(*) FROM uploaded_readings").fetchone()[0]
    up_crit  = conn.execute("SELECT COUNT(*) FROM uploaded_readings WHERE risk_level=2").fetchone()[0]
    up_warn  = conn.execute("SELECT COUNT(*) FROM uploaded_readings WHERE risk_level=1").fetchone()[0]
    up_heal  = conn.execute("SELECT COUNT(*) FROM uploaded_readings WHERE risk_level=0").fetchone()[0]
    conn.close()
    return {
        "total_predictions":    total,
        "critical_count":       critical,
        "warning_count":        warning,
        "healthy_count":        healthy,
        "average_health_score": round(avg_health, 1),
        "uploaded_total":       up_total,
        "uploaded_critical":    up_crit,
        "uploaded_warning":     up_warn,
        "uploaded_healthy":     up_heal,
    }
