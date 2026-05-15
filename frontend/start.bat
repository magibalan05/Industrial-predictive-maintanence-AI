@echo off
echo =====================================================
echo  Industrial Predictive Maintenance AI — Frontend
echo =====================================================
cd /d "%~dp0"

echo [1/2] Installing Node.js dependencies...
npm install

echo [2/2] Starting Vite dev server...
echo  Dashboard: http://localhost:5173
echo.
npm run dev

pause
