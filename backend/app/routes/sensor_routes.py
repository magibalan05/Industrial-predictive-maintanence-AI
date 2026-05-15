from fastapi import APIRouter
from app.simulation.sensor_simulator import simulate_sensor_reading
from app.simulation.equipment_generator import get_all_equipment, get_equipment_by_id
from app.database.database import fetch_sensor_history
from app.utils.logger import get_logger

router = APIRouter(prefix="/sensors", tags=["Sensors"])
logger = get_logger(__name__)

@router.get("/simulate")
def simulate_all():
    """Trigger a one-shot simulation for all equipment (REST fallback)."""
    equipment_list = get_all_equipment()
    readings = [simulate_sensor_reading(eq) for eq in equipment_list]
    return {"status": "ok", "readings": readings}

@router.get("/simulate/{equipment_id}")
def simulate_one(equipment_id: str):
    eq = get_equipment_by_id(equipment_id)
    if not eq:
        return {"error": "Equipment not found"}
    return simulate_sensor_reading(eq)

@router.get("/history")
def sensor_history(equipment_id: str = None, limit: int = 100):
    return {"data": fetch_sensor_history(equipment_id=equipment_id, limit=limit)}

@router.get("/equipment")
def list_equipment():
    return {"equipment": get_all_equipment()}
