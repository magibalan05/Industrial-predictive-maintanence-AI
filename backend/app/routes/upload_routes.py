from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.upload_service import process_upload
from app.database.database import (
    fetch_uploaded_datasets,
    fetch_uploaded_readings,
    delete_uploaded_dataset,
)
from app.utils.logger import get_logger

router = APIRouter(prefix="/upload", tags=["Data Upload"])
logger = get_logger(__name__)

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
MAX_FILE_SIZE_MB   = 10

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a CSV or Excel file with sensor readings.
    Runs ML prediction on every row and returns results.
    """
    # ── Validate extension ────────────────────────────────────────────────────
    ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Accepted: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # ── Read bytes ────────────────────────────────────────────────────────────
    file_bytes = await file.read()
    size_mb    = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Max allowed: {MAX_FILE_SIZE_MB} MB."
        )

    # ── Process ───────────────────────────────────────────────────────────────
    try:
        result = process_upload(file_bytes, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Upload processing failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Processing error: {e}")

    return {"status": "success", "data": result}

@router.get("/datasets")
def list_datasets():
    """List all uploaded datasets."""
    return {"datasets": fetch_uploaded_datasets()}

@router.get("/datasets/{dataset_id}/readings")
def get_dataset_readings(dataset_id: int, limit: int = 500):
    """Get all processed rows for a dataset."""
    rows = fetch_uploaded_readings(dataset_id, limit=limit)
    if not rows:
        raise HTTPException(status_code=404, detail="Dataset not found or empty.")
    return {"dataset_id": dataset_id, "rows": rows}

@router.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: int):
    """Delete an uploaded dataset and all its readings."""
    delete_uploaded_dataset(dataset_id)
    return {"status": "deleted", "dataset_id": dataset_id}
