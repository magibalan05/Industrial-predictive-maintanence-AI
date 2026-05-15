@echo off
echo =====================================================
echo  Industrial Predictive Maintenance AI
echo  Starting ALL services...
echo =====================================================

echo.
echo [Step 1] Launching Backend (FastAPI)...
start "PredictiveAI - Backend" cmd /k "cd /d "%~dp0backend" && pip install -r requirements.txt && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo [Step 2] Launching Frontend (Vite React)...
start "PredictiveAI - Frontend" cmd /k "cd /d "%~dp0frontend" && npm install && npm run dev"

echo.
echo =====================================================
echo  Services starting in separate windows:
echo   Backend API:  http://localhost:8000
echo   API Docs:     http://localhost:8000/docs
echo   Dashboard:    http://localhost:5173
echo   WebSocket:    ws://localhost:8000/ws
echo =====================================================
echo.
pause
