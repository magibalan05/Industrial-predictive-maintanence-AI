import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

try:
    from app.ml_engine.predictor import predict_industrial_risk
    print("Import successful")
    
    test_data = {
        "equipment_id": "TEST-001",
        "equipment_name": "Test Motor",
        "equipment_type": "Motor",
        "temperature": 95,
        "vibration": 5.0,
        "voltage": 230,
        "current": 20,
        "pressure": 100,
        "rpm": 1800
    }
    
    result = predict_industrial_risk(test_data)
    print("Prediction result:", result)
except Exception as e:
    print("Error:", e)
    import traceback
    traceback.print_exc()
