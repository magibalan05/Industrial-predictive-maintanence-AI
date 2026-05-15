import asyncio
import json
from typing import Set
from fastapi import WebSocket
from app.simulation.sensor_simulator import simulate_sensor_reading
from app.simulation.equipment_generator import get_all_equipment
from app.services.prediction_service import run_prediction
from app.services.alert_service import generate_alerts
from app.services.recommendation_service import generate_recommendations
from app.database.database import insert_sensor_reading
from app.config.settings import SIMULATION_INTERVAL_SECONDS
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Active WebSocket connections
_connections: Set[WebSocket] = set()

def register_ws(ws: WebSocket):
    _connections.add(ws)
    logger.info("WebSocket connected. Total: %d", len(_connections))

def unregister_ws(ws: WebSocket):
    _connections.discard(ws)
    logger.info("WebSocket disconnected. Total: %d", len(_connections))

async def _broadcast(payload: dict):
    dead = set()
    message = json.dumps(payload)
    for ws in _connections:
        try:
            await ws.send_text(message)
        except Exception:
            dead.add(ws)
    for ws in dead:
        unregister_ws(ws)

async def simulation_loop():
    """Background task: generate sensor data every SIMULATION_INTERVAL_SECONDS."""
    logger.info("Simulation loop started (interval=%ds)", SIMULATION_INTERVAL_SECONDS)
    equipment_list = get_all_equipment()

    while True:
        all_readings = []
        for equipment in equipment_list:
            # 1. Simulate sensors
            sensor_data = simulate_sensor_reading(equipment)

            # 2. Persist reading
            try:
                insert_sensor_reading(sensor_data)
            except Exception as e:
                logger.warning("DB insert failed: %s", e)

            # 3. Run ML prediction
            prediction = run_prediction(sensor_data)

            # 4. Generate alerts & recommendations
            alerts          = generate_alerts(sensor_data, prediction["risk_level"])
            recommendations = generate_recommendations(sensor_data, prediction["risk_level"])

            all_readings.append({
                "sensor":          sensor_data,
                "prediction":      prediction,
                "alerts":          alerts,
                "recommendations": recommendations,
            })

        # 5. Broadcast to all connected dashboards
        await _broadcast({"type": "sensor_update", "data": all_readings})

        await asyncio.sleep(SIMULATION_INTERVAL_SECONDS)
