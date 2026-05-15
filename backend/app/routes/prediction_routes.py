from fastapi import APIRouter
from app.ml_engine.predictor import predict_industrial_risk
from app.database.database import fetch_predictions
from app.utils.logger import get_logger

router = APIRouter(prefix="/predictions", tags=["ML Predictions"])
logger = get_logger(__name__)

@router.post("/predict")
def predict_endpoint(sensor_data: dict):
    """Run Adaptive ML inference on provided industrial telemetry."""
    return predict_industrial_risk(sensor_data)

@router.get("/history")
def prediction_history(equipment_id: str = None, limit: int = 100):
    return {"data": fetch_predictions(equipment_id=equipment_id, limit=limit)}
