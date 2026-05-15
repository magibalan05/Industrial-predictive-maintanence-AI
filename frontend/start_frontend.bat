@echo off
echo =====================================================
echo  Industrial Predictive Maintenance AI — Frontend
echo =====================================================
cd /d "%~dp0"

echo [1/2] Checking Node.js...
node --version || (echo Node.js not found. Please install Node.js && pause && exit /b 1)

echo [2/2] Starting Vite development server...
echo  Local: http://localhost:5173
echo.
npm run dev

pause
