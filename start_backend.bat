@echo off
SET PYTHONIOENCODING=utf-8
SET PY="C:\Users\Piyush\AppData\Local\Programs\Python\Python312\python.exe"
echo ============================================================
echo  RetinaScan-XAI — Start Backend Server
echo ============================================================
cd /d "%~dp0Backend"
echo Checking for model...
if exist "retinascan_resnet50.pth" (
    echo [REAL MODE] Model found! Live inference enabled.
) else (
    echo [MOCK MODE] No model file. Running with pre-computed heatmaps.
    echo             Train first: double-click train_model.bat
)
echo.
echo Starting FastAPI on http://localhost:8000 ...
echo Press Ctrl+C to stop.
echo.
%PY% main.py
pause
