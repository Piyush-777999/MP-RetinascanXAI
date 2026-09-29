@echo off
echo ============================================================
echo  RetinaScan-XAI — Start Frontend App
echo ============================================================
cd /d "%~dp0Frontend\retinascan-app"

echo Starting Vite development server...
echo The app will open in your browser automatically.
echo Press Ctrl+C to stop.
echo.

npm run dev -- --open
pause
