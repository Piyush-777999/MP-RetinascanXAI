@echo off
chcp 65001 > nul
SET PYTHONIOENCODING=utf-8

echo  RetinaScan-XAI -- Install All Dependencies
echo  Automated Environment Setup (PyTorch, OpenCV, Node)
echo ============================================================
echo.

REM ── Auto-detect Python ───────────────────────────────────────────────────
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

echo Detected Python:
%PY% --version
echo.

REM ── Step 1: PyTorch (GPU if RTX card detected, else CPU) ─────────────────
echo [Step 1/4]  Installing PyTorch...
echo.
echo Choose your hardware:
echo   1 = NVIDIA GPU (RTX 3000/4000 series, CUDA 12.1)
echo   2 = CPU only   (slower inference, but works everywhere)
echo.
set /p HW_CHOICE="Enter 1 or 2 [default=2]: "

IF "%HW_CHOICE%"=="1" (
    echo Installing PyTorch CUDA 12.1 ...  (~2.5 GB download)
    %PY% -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
) ELSE (
    echo Installing PyTorch CPU ...  (~200 MB download)
    %PY% -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
)

echo.

REM ── Step 2: Image processing + ML ────────────────────────────────────────
echo [Step 2/4]  Installing image processing + ML libraries...
%PY% -m pip install pillow opencv-python numpy pandas scikit-learn tqdm
echo.

REM ── Step 3: Backend web framework ────────────────────────────────────────
echo [Step 3/4]  Installing FastAPI + Uvicorn...
%PY% -m pip install "fastapi>=0.111.0" "uvicorn[standard]>=0.29.0" "python-multipart>=0.0.9"
echo.

REM ── Step 4: Node.js dependencies for Frontend ────────────────────────────
echo [Step 4/4]  Installing Frontend (Node.js) dependencies...
IF EXIST "%~dp0Frontend\retinascan-app\package.json" (
    cd /d "%~dp0Frontend\retinascan-app"
    npm install
    cd /d "%~dp0"
    echo [DONE] Frontend dependencies installed.
) ELSE (
    echo [SKIP] Frontend folder not found — run this from the repo root.
)
echo.

echo ============================================================
echo  All done!
echo.
echo  NEXT STEPS:
echo   1. Download the model weights from model_link.txt
echo      and place retinascan_resnet50.pth in Backend\
echo.
echo   2. Start the backend:   double-click start_backend.bat
echo   3. Start the frontend:  double-click start_frontend.bat
echo   4. Open browser:        http://localhost:5173
echo ============================================================
pause
