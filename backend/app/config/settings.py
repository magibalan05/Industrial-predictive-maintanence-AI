import os

# ── Base Paths ──────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "models", "saved_models")
DB_PATH = os.path.join(BASE_DIR, "..", "data", "predictive_maintenance.db")

# ── Simulation Settings ───────────────────────────────────────────────────────
SIMULATION_INTERVAL_SECONDS = 2
ANOMALY_INJECTION_PROBABILITY = 0.15   # 15% chance of anomaly per reading

# ── Equipment Types ──────────────────────────────────────────────────────────
EQUIPMENT_LIST = [
    {"id": "EQ-001", "name": "Motor A",       "type": "Motor"},
    {"id": "EQ-002", "name": "Transformer B", "type": "Transformer"},
    {"id": "EQ-003", "name": "Generator C",   "type": "Generator"},
    {"id": "EQ-004", "name": "Turbine D",     "type": "Turbine"},
    {"id": "EQ-005", "name": "Pump Station 1","type": "Pump"},
    {"id": "EQ-006", "name": "Exhaust Fan 1", "type": "Fan"},
    {"id": "EQ-007", "name": "Compressor X",  "type": "Compressor"},
    {"id": "EQ-008", "name": "Conveyor Belt", "type": "Conveyor"},
]


# ── Sensor Normal Ranges (min, max) ─────────────────────────────────────────
SENSOR_RANGES = {
    "Motor": {
        "temperature": (30, 70),
        "vibration":   (0.1, 2.0),
        "voltage":     (215, 240),
        "current":     (10, 25),
        "pressure":    (60, 100),
        "rpm":         (1400, 2000),
    },
    "Transformer": {
        "temperature": (25, 65),
        "vibration":   (0.05, 1.0),
        "voltage":     (210, 245),
        "current":     (5, 20),
        "pressure":    (50, 90),
        "rpm":         (0, 0),          # Transformers don't rotate
    },
    "Generator": {
        "temperature": (35, 80),
        "vibration":   (0.2, 2.5),
        "voltage":     (220, 240),
        "current":     (15, 40),
        "pressure":    (70, 120),
        "rpm":         (1500, 3000),
    },
    "Turbine": {
        "temperature": (40, 90),
        "vibration":   (0.3, 3.0),
        "voltage":     (200, 250),
        "current":     (20, 50),
        "pressure":    (80, 150),
        "rpm":         (2000, 5000),
    },
    "Pump": {
        "temperature": (35, 65),
        "vibration":   (0.5, 2.5),
        "voltage":     (215, 235),
        "current":     (12, 30),
        "pressure":    (70, 110),
        "rpm":         (1400, 1800),
    },
    "Fan": {
        "temperature": (25, 50),
        "vibration":   (0.2, 1.5),
        "voltage":     (220, 240),
        "current":     (5, 15),
        "pressure":    (14, 20),
        "rpm":         (800, 1200),
    },
    "Compressor": {
        "temperature": (45, 85),
        "vibration":   (1.0, 3.5),
        "voltage":     (230, 250),
        "current":     (25, 55),
        "pressure":    (100, 200),
        "rpm":         (3000, 4500),
    },
    "Conveyor": {
        "temperature": (30, 60),
        "vibration":   (0.8, 2.2),
        "voltage":     (210, 230),
        "current":     (10, 25),
        "pressure":    (0, 0),
        "rpm":         (50, 200),
    },
}


# ── Failure Thresholds ───────────────────────────────────────────────────────
THRESHOLDS = {
    "temperature": {"warning": 75,  "critical": 90},
    "vibration":   {"warning": 3.0, "critical": 4.5},
    "voltage":     {"warning": 245, "critical": 250},
    "current":     {"warning": 40,  "critical": 50},
    "pressure":    {"warning": 130, "critical": 145},
    "rpm":         {"warning": 4500,"critical": 4900},
}

# ── Model Settings ───────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(SAVED_MODELS_DIR, "random_forest.pkl")
SCALER_PATH = os.path.join(SAVED_MODELS_DIR, "scaler.pkl")
TRAINING_SAMPLES = 12000
RANDOM_STATE = 42

# ── Risk Labels ──────────────────────────────────────────────────────────────
RISK_LABELS = {0: "Healthy", 1: "Warning", 2: "Critical"}
RISK_COLORS = {0: "#10b981", 1: "#f59e0b", 2: "#ef4444"}

# ── CORS Origins ─────────────────────────────────────────────────────────────
CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
