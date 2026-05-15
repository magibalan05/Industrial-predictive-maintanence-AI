@echo off
echo =====================================================
echo  Industrial Predictive Maintenance AI — Backend
echo =====================================================
cd /d "%~dp0"

echo [1/3] Checking Python...
python --version || (echo Python not found. Please install Python 3.10+ && pause && exit /b 1)

echo [2/3] Installing dependencies...
pip install -r requirements.txt

echo [3/3] Starting FastAPI server...
echo  API Docs:   http://localhost:8000/docs
echo  WebSocket:  ws://localhost:8000/ws
echo  Dashboard:  http://localhost:5173
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
