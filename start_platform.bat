@echo off
echo =====================================================
echo  Adaptive Industrial Intelligence Platform
echo =====================================================
echo Launching services in separate terminal windows...

:: Launch Backend
start "Backend Service" cmd /k "cd backend && start.bat"

:: Launch Frontend
start "Frontend Service" cmd /k "cd frontend && start_frontend.bat"

echo.
echo All services are starting up.
echo Backend:   http://localhost:8000
echo Frontend:  http://localhost:5173
echo =====================================================
timeout /t 5
