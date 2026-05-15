import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import CORS_ORIGINS
from app.database.database import init_db
from app.simulation.realtime_stream import simulation_loop, register_ws, unregister_ws
from app.routes.sensor_routes import router as sensor_router
from app.routes.prediction_routes import router as prediction_router
from app.routes.recommendation_routes import router as recommendation_router
from app.routes.report_routes import router as report_router
from app.utils.logger import get_logger


logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────────
    logger.info("Starting Industrial Predictive Maintenance AI Backend…")
    init_db()

    # Check model exists, train if not
    import os
    from app.config.settings import MODEL_PATH
    if not os.path.exists(MODEL_PATH):
        logger.info("ML model not found — training now…")
        from app.models.training.train_model import train
        train()
    else:
        logger.info("ML model found at %s", MODEL_PATH)

    # Start background simulation loop
    task = asyncio.create_task(simulation_loop())
    logger.info("Simulation loop task started.")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────────
    task.cancel()
    logger.info("Backend shutting down.")


app = FastAPI(
    title="Industrial Predictive Maintenance AI",
    description="Real-Time Sensor Simulation & Failure Prediction System",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REST Routers ──────────────────────────────────────────────────────────────
app.include_router(sensor_router)
app.include_router(prediction_router)
app.include_router(recommendation_router)
app.include_router(report_router)



# ── WebSocket Endpoint ────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    register_ws(websocket)
    try:
        while True:
            # Keep connection alive; data is pushed by simulation_loop
            await websocket.receive_text()
    except WebSocketDisconnect:
        unregister_ws(websocket)


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Industrial Predictive Maintenance AI",
        "version": "1.0.0",
        "docs": "/docs",
        "websocket": "ws://localhost:8000/ws",
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
