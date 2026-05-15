import random
import math
from datetime import datetime, timezone
from app.config import settings
from app.config.settings import SENSOR_RANGES, ANOMALY_INJECTION_PROBABILITY
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Tracks per-equipment drift state for realistic Digital Twin simulation
_digital_twin_states: dict[str, dict] = {}

def _get_twin_state(equipment_id: str, equipment_type: str) -> dict:
    if equipment_id not in _digital_twin_states:
        _digital_twin_states[equipment_id] = {
            "temp_drift": 0.0,
            "vib_drift": 0.0,
            "anomaly_active": False,
            "anomaly_counter": 0,
            "tick": 0,
            "load_factor": random.uniform(0.7, 1.1)
        }
    return _digital_twin_states[equipment_id]

def generate_digital_twin_telemetry(equipment: dict) -> dict:
    """
    Generate high-fidelity telemetry data representing the virtual behavior 
    of an industrial asset (Digital Twin).
    
    This simulation layer models operational drift, gradual performance degradation, 
    and transient anomalies.
    """
    eq_type = equipment["type"]
    eq_id = equipment["id"]
    ranges = SENSOR_RANGES.get(eq_type, SENSOR_RANGES["Motor"])
    state = _get_twin_state(eq_id, eq_type)
    
    # Global Enterprise Load Override
    global_load = settings.SIMULATION_LOAD_FACTOR

    state["tick"] += 1
    tick = state["tick"]
    load = state["load_factor"]

    # ── Decide if an anomaly event starts ────────────────────────────────────
    # Manual Injection OR Random Probability
    should_inject = settings.INJECT_CRITICAL_FAULT or (random.random() < ANOMALY_INJECTION_PROBABILITY)
    
    if not state["anomaly_active"] and should_inject:
        state["anomaly_active"] = True
        state["anomaly_counter"] = random.randint(3, 8)  # lasts 3-8 operational cycles
        logger.debug("Digital Twin anomaly signature detected for %s", eq_id)

    if state["anomaly_active"]:
        state["anomaly_counter"] -= 1
        if state["anomaly_counter"] <= 0:
            state["anomaly_active"] = False
            state["temp_drift"] = 0.0
            state["vib_drift"] = 0.0

    anomaly = state["anomaly_active"]

    # ── Temperature (with sinusoidal drift + anomaly spike) ──────────────────
    lo, hi = ranges["temperature"]
    # Base temp fluctuates with global load
    base_temp = (lo + hi) / 2 + (hi - lo) / 4 * math.sin(tick * 0.1) * global_load

    if anomaly:
        state["temp_drift"] = min(state["temp_drift"] + 2.5, 30)
    temp = round(base_temp + state["temp_drift"] + random.uniform(-1.5, 1.5), 1)
    temp = max(lo - 5, min(hi + 35, temp))

    # ── Mechanical Vibration Analysis ────────────────────────────────────────
    vlo, vhi = ranges["vibration"]
    base_vib = random.uniform(vlo, vhi) * load
    if anomaly:
        state["vib_drift"] = min(state["vib_drift"] + 0.4, 3.0)
    vib = round(base_vib + state["vib_drift"] + random.uniform(-0.05, 0.05), 3)
    vib = max(0, min(vhi + 3.5, vib))

    # ── Electrical Grid Stability (Voltage) ──────────────────────────────────
    volo, vohi = ranges["voltage"]
    volt = round(random.gauss((volo + vohi) / 2, 3), 1)
    if anomaly and random.random() < 0.4:
        volt += random.choice([-15, 15])
    volt = max(volo - 10, min(vohi + 15, volt))

    # ── Power Consumption (Current) ──────────────────────────────────────────
    clo, chi = ranges["current"]
    curr = round(random.gauss((clo + chi) / 2, 2) * load, 1)
    if anomaly:
        curr += random.uniform(5, 15)
    curr = max(clo - 2, min(chi + 20, curr))

    # ── System Pressure Dynamics ─────────────────────────────────────────────
    plo, phi = ranges["pressure"]
    pres = round(random.gauss((plo + phi) / 2, 5), 1)
    if anomaly:
        pres += random.uniform(10, 30)
    pres = max(plo - 5, min(phi + 40, pres))

    # ── Rotational Dynamics (RPM) ────────────────────────────────────────────
    rlo, rhi = ranges["rpm"]
    if rlo == 0 and rhi == 0:
        rpm = 0
    else:
        rpm = round(random.gauss((rlo + rhi) / 2, 50) * load)
        if anomaly:
            rpm += random.choice([-300, 300])
        rpm = max(rlo - 100, min(rhi + 500, rpm))

    return {
        "equipment_id":   eq_id,
        "equipment_name": equipment["name"],
        "equipment_type": eq_type,
        "temperature":    temp,
        "vibration":      vib,
        "voltage":        volt,
        "current":        curr,
        "pressure":       pres,
        "rpm":            rpm,
        "load_factor":    round(load, 2),
        "anomaly_active": anomaly,
        "timestamp":      datetime.now(timezone.utc).isoformat(),
    }
