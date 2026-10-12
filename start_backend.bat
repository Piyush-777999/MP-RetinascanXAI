@echo off
chcp 65001 > nul
SET PYTHONIOENCODING=utf-8

echo  RetinaScan-XAI -- Start Backend Server
echo  FastAPI + PyTorch + ResNet-50 XAI Engine
echo ============================================================
echo.

REM ── Auto-detect Python (tries python, then py launcher) ──────────────────
SET PY=python
python --version > nul 2>&1
IF ERRORLEVEL 1 (
    SET PY=py
    py --version > nul 2>&1
    IF ERRORLEVEL 1 (
        echo [ERROR] Python not found in PATH.
        echo         Install Python 3.10+ from https://python.org
        pause
        exit /b 1
    )
)

REM ── Move to Backend directory (relative to this .bat file) ───────────────
cd /d "%~dp0Backend"

REM ── Model presence check ─────────────────────────────────────────────────
IF EXIST "..\ml_script\retinascan_resnet50_v2.pth" (
    echo [REAL MODE]  RetinaScan-XAI v2 model found in ml_script!
    echo              Multi-dataset ResNet-50 v2 inference + Grad-CAM + Lesion Segmentation enabled.
) ELSE IF EXIST "retinascan_resnet50.pth" (
    echo [REAL MODE]  RetinaScan-XAI model found!
    echo              Live ResNet-50 inference + Grad-CAM + Lesion Segmentation enabled.
) ELSE (
    echo [MOCK MODE]  No model file found.
    echo              Returning pre-computed results with realistic lesion data.
)

echo.
echo Starting FastAPI on http://localhost:8000
echo Press Ctrl+C to stop.
echo.
%PY% main.py
pause
