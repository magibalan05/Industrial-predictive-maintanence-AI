from pydantic import BaseModel
from fastapi import APIRouter
from app.config import settings
from app.simulation.digital_twin_engine import generate_digital_twin_telemetry
from app.simulation.equipment_generator import get_all_equipment, get_equipment_by_id
from app.database.database import fetch_sensor_history
from app.utils.logger import get_logger

router = APIRouter(prefix="/sensors", tags=["Digital Twins"])
logger = get_logger(__name__)

@router.get("/simulate")
def simulate_all():
    """Trigger a one-shot digital twin telemetry generation for all equipment."""
    equipment_list = get_all_equipment()
    readings = [generate_digital_twin_telemetry(eq) for eq in equipment_list]
    return {"status": "ok", "readings": readings}

@router.get("/simulate/{equipment_id}")
def simulate_one(equipment_id: str):
    eq = get_equipment_by_id(equipment_id)
    if not eq:
        return {"error": "Equipment digital twin not found"}
    return generate_digital_twin_telemetry(eq)

@router.get("/history")
def sensor_history(equipment_id: str = None, limit: int = 100):
    return {"data": fetch_sensor_history(equipment_id=equipment_id, limit=limit)}

@router.get("/equipment")
def list_equipment():
    return {"equipment": get_all_equipment()}

# ── Global Control States (Live Override) ──────────────────────────────────
SIMULATION_LOAD_FACTOR = 1.0  # Default 100%
INJECT_CRITICAL_FAULT = False

# ── Simulation Settings ───────────────────────────────────────────────────────


class ControlRequest(BaseModel):
    load_factor: float = 1.0
    inject_fault: bool = False

@router.post("/control")
def update_simulation_control(req: ControlRequest):
    """Update global simulation parameters (Enterprise Control Center)."""
    settings.SIMULATION_LOAD_FACTOR = req.load_factor
    settings.INJECT_CRITICAL_FAULT = req.inject_fault
    logger.info("Simulation control updated: Load=%.1f, Fault=%s", 
                req.load_factor, req.inject_fault)
    return {"status": "updated", "load": settings.SIMULATION_LOAD_FACTOR, "fault": settings.INJECT_CRITICAL_FAULT}

