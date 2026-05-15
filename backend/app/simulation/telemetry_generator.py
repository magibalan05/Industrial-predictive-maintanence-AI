from app.simulation.digital_twin_engine import generate_digital_twin_telemetry

def get_telemetry_packet(equipment: dict) -> dict:
    """
    Interface for the Stage 2 — Real-Time Telemetry Generation layer.
    Wraps the Digital Twin engine to provide standardized telemetry packets.
    """
    return generate_digital_twin_telemetry(equipment)
