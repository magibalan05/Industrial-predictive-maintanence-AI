import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import CORS_ORIGINS
from app.database.database import init_db
from app.simulation.telemetry_stream_engine import (
    start_digital_twin_stream_loop, register_stream, unregister_stream
)
from app.routes.sensor_routes import router as sensor_router
from app.routes.prediction_routes import router as prediction_router
from app.routes.recommendation_routes import router as recommendation_router
from app.routes.report_routes import router as report_router
from app.utils.logger import get_logger

logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Industry 4.0 Platform Startup ────────────────────────────────────────
    logger.info("Initializing Adaptive Industrial Intelligence Platform...")
    init_db()

    # Model Synchronization
    import os
    from app.config.settings import MODEL_PATH
    if not os.path.exists(MODEL_PATH):
        logger.info("ML Intelligence Model missing — Initiating Training Phase...")
        from app.models.training.train_model import train
        train()
    else:
        logger.info("Validated Digital Twin Intelligence Model at %s", MODEL_PATH)

    # Launch Digital Twin Telemetry Engine
    stream_task = asyncio.create_task(start_digital_twin_stream_loop())
    logger.info("Telemetry Stream Engine operational.")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────────
    stream_task.cancel()
    logger.info("Industrial Intelligence Platform shutting down.")


app = FastAPI(
    title="Adaptive Industrial Intelligence Platform",
    description="Digital Twin Simulation & Explainable AI for Predictive Maintenance",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS Configuration ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Infrastructure ───────────────────────────────────────────────────────
app.include_router(sensor_router, prefix="/api")
app.include_router(prediction_router, prefix="/api")
app.include_router(recommendation_router, prefix="/api")
app.include_router(report_router, prefix="/api")


# ── Industrial Telemetry Stream (WebSockets) ─────────────────────────────────
@app.websocket("/ws")
async def industrial_telemetry_ws(websocket: WebSocket):
    await register_stream(websocket)
    try:
        while True:
            # Keep connection alive; clients only receive broadcasts
            await websocket.receive_text()
    except WebSocketDisconnect:
        await unregister_stream(websocket)
    except Exception as e:
        logger.error("WebSocket Error: %s", e)
        await unregister_stream(websocket)
