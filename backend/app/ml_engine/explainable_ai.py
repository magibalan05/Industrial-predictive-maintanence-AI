from app.config.settings import THRESHOLDS

def generate_reasoning(sensor_data: dict, risk_level: int, importances: dict, equipment_type: str) -> str:
    """
    Generate an Explainable AI (XAI) reasoning string for a prediction.
    """
    if risk_level == 0:
        return "All parameters are operating within optimal industrial tolerances."

    if not importances:
        return "Anomaly detected via multi-variate pattern analysis."

    # Identify the top feature contributing to the decision
    top_feature = max(importances, key=importances.get)
    val = sensor_data.get(top_feature, 0)
    
    # Get thresholds for this specific sensor
    sensor_thresholds = THRESHOLDS.get(top_feature, {"warning": 999, "critical": 999})
    
    # Use the appropriate threshold level for comparison
    thresh_level = "critical" if risk_level == 2 else "warning"
    thresh = sensor_thresholds.get(thresh_level, 999)

    reason = f"Identified {risk_level_to_label(risk_level)} risk condition. "
    
    if val > thresh:
        percent_over = ((val - thresh) / thresh) * 100 if thresh != 0 else 0
        reason += f"Primary driver: {top_feature.capitalize()} at {val}, which is {percent_over:.1f}% above the safety threshold."
    else:
        reason += f"Decision influenced primarily by {top_feature.capitalize()} patterns and multi-variate correlations."

    return reason

def risk_level_to_label(level: int) -> str:
    try:
        return ["Healthy", "Warning", "Critical"][level]
    except IndexError:
        return "Unknown"
