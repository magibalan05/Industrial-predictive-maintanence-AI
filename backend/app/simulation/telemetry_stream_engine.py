import asyncio
import json
from fastapi import WebSocket
from app.config.settings import EQUIPMENT_LIST
from app.simulation.digital_twin_engine import generate_digital_twin_telemetry
from app.ml_engine.predictor import predict_industrial_risk
from app.recommendation.recommendation_engine import generate_enterprise_recommendations
from app.analytics.health_score import compute_asset_health
from app.database.database import get_connection
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Active WebSocket connections for real-time telemetry streaming
_active_streams: set[WebSocket] = set()

async def register_stream(websocket: WebSocket):
    await websocket.accept()
    _active_streams.add(websocket)
    logger.info("New telemetry stream connection registered.")

async def unregister_stream(websocket: WebSocket):
    _active_streams.remove(websocket)
    logger.info("Telemetry stream connection closed.")

async def start_digital_twin_stream_loop():
    """
    Main Industry 4.0 execution loop:
    1. Digital Twin Simulation
    2. Adaptive ML Inference (with XAI)
    3. Adaptive Health Scoring
    4. Intelligent Recommendation Generation
    5. Real-Time Telemetry Streaming
    6. Persistent Data Archiving
    """
    logger.info("Initiating Digital Twin Telemetry Stream Engine (v2.0)...")
    
    while True:
        try:
            telemetry_batch = []
            
            for equipment in EQUIPMENT_LIST:
                # 1. Digital Twin Telemetry Generation (Stage 1)
                sensor_data = generate_digital_twin_telemetry(equipment)
                
                # 2. Adaptive ML Inference & XAI Reasoning (Stage 7-8)
                prediction = predict_industrial_risk(sensor_data)
                
                # 3. Dynamic Health Scoring (Stage 9)
                health_score = compute_asset_health(
                    sensor_data, 
                    prediction["risk_level"], 
                    prediction["confidence"]
                )
                prediction["health_score"] = health_score

                # 4. Intelligent Recommendations (Stage 10)
                recommendations = generate_enterprise_recommendations(
                    sensor_data, 
                    prediction["risk_level"]
                )
                
                # Filter for critical/high priority alerts to show in the live panel
                alerts = [r for r in recommendations if r["priority"] in ["CRITICAL", "HIGH"]]
                
                # Combined analytics payload
                payload = {
                    "sensor": sensor_data,
                    "prediction": prediction,
                    "recommendations": recommendations,
                    "alerts": alerts
                }
                telemetry_batch.append(payload)

                # 5. Persistent Data Archiving (Async)
                _archive_telemetry(sensor_data, prediction)

            # 6. Real-Time Streaming via WebSockets
            if _active_streams:
                message = json.dumps({
                    "type": "sensor_update",
                    "data": telemetry_batch
                })
                disconnected = []
                for ws in _active_streams:
                    try:
                        await ws.send_text(message)
                    except:
                        disconnected.append(ws)
                
                for ws in disconnected:
                    _active_streams.remove(ws)

            await asyncio.sleep(2.0)
            
        except Exception as e:
            logger.error("Telemetry Stream Engine Error: %s", e)
            await asyncio.sleep(5.0)

def _archive_telemetry(sensor: dict, pred: dict):
    """Save processed telemetry and predictions to the industrial history database."""
    try:
        with get_connection() as conn:
            # Save sensor log
            conn.execute("""
                INSERT INTO sensor_readings 
                (equipment_id, equipment_name, equipment_type, temperature, vibration, voltage, current, pressure, rpm, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sensor["equipment_id"], sensor["equipment_name"], sensor["equipment_type"],
                sensor["temperature"], sensor["vibration"], sensor["voltage"],
                sensor["current"], sensor["pressure"], sensor["rpm"], sensor["timestamp"]
            ))
            
            # Save prediction/alert log if Warning or Critical
            if pred["risk_level"] > 0:
                conn.execute("""
                    INSERT INTO alerts (equipment_id, equipment_name, severity, sensor, value, message, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    sensor["equipment_id"], sensor["equipment_name"], 
                    pred["risk_label"], "Multi-variate", 0.0,
                    pred["reasoning"], sensor["timestamp"]
                ))
            conn.commit()
    except Exception as e:
        logger.error("Data Archiving Error: %s", e)
