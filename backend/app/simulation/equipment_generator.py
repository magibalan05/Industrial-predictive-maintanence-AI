from app.config.settings import EQUIPMENT_LIST
from app.utils.logger import get_logger

logger = get_logger(__name__)

def get_all_equipment() -> list[dict]:
    """Return list of all equipment configurations."""
    return EQUIPMENT_LIST

def get_equipment_by_id(equipment_id: str) -> dict | None:
    for eq in EQUIPMENT_LIST:
        if eq["id"] == equipment_id:
            return eq
    return None
