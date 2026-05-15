def compute_asset_health(sensor_data: dict, risk_level: int, confidence: float) -> int:
    """
    Stage 9 — Risk Classification System.
    Computes a normalized health score (0-100) based on AI risk levels and 
    confidence metrics.
    """
    # Baseline health based on risk level
    base_health = {
        0: 100,  # Healthy
        1: 65,   # Warning
        2: 25    # Critical
    }.get(risk_level, 100)
    
    # Adjust based on model confidence
    if risk_level > 0:
        # If model is highly confident in a failure, lower the health further
        penalty = (confidence / 100) * 10
        health = max(5, int(base_health - penalty))
    else:
        # If model is confident it's healthy, health is high
        bonus = (confidence / 100) * 5
        health = min(100, int(base_health - (5 - bonus)))
        
    return health
