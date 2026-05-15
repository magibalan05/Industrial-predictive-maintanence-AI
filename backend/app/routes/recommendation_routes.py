from fastapi import APIRouter
from app.database.database import fetch_recommendations
from app.utils.logger import get_logger

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])
logger = get_logger(__name__)

@router.get("/")
def get_recommendations(limit: int = 20):
    return {"data": fetch_recommendations(limit=limit)}
