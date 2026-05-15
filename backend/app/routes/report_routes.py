from fastapi import APIRouter
from app.database.database import fetch_alerts, fetch_sensor_history, fetch_predictions
from app.services.analytics_service import get_dashboard_analytics
from app.utils.logger import get_logger

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])
logger = get_logger(__name__)

@router.get("/alerts")
def get_alerts(limit: int = 50, unacknowledged_only: bool = False):
    return {"data": fetch_alerts(limit=limit, unacknowledged_only=unacknowledged_only)}

@router.get("/analytics")
def analytics():
    return get_dashboard_analytics()

@router.get("/sensor-log")
def sensor_log(limit: int = 200):
    return {"data": fetch_sensor_history(limit=limit)}

@router.get("/predictions-log")
def predictions_log(limit: int = 200):
    return {"data": fetch_predictions(limit=limit)}
