from fastapi import APIRouter
from app.services.prediction_service import run_prediction
from app.database.database import fetch_predictions
from app.utils.logger import get_logger

router = APIRouter(prefix="/predictions", tags=["Predictions"])
logger = get_logger(__name__)

@router.post("/predict")
def predict_endpoint(sensor_data: dict):
    """Run ML prediction on provided sensor data."""
    result = run_prediction(sensor_data)
    return result

@router.get("/history")
def prediction_history(equipment_id: str = None, limit: int = 100):
    return {"data": fetch_predictions(equipment_id=equipment_id, limit=limit)}
