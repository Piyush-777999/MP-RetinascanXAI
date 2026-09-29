@echo off
SET PY="C:\Users\Piyush\AppData\Local\Programs\Python\Python312\python.exe"
echo ============================================================
echo  RetinaScan-XAI — Install All Python Dependencies
echo  Using Python 3.12 (required for CUDA/GPU support)
echo ============================================================
echo.
echo Step 1: Installing PyTorch CUDA 12.1 (GPU version for RTX 4060)...
echo    (~2.5GB download, takes 5-15 minutes)
%PY% -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
echo.
echo Step 2: Installing other ML dependencies...
%PY% -m pip install pillow opencv-python pandas scikit-learn tqdm
echo.
echo Step 3: Installing backend dependencies...
%PY% -m pip install fastapi uvicorn python-multipart
echo.
echo ============================================================
echo  All done!
echo.
echo  NEXT STEPS:
echo  1. Train the model:    run train_model.bat
echo     (takes ~20 min on RTX 4060)
echo.
echo  2. Evaluate the model: run evaluate_model.bat
echo     (proves sensitivity + specificity to judges)
echo.
echo  3. Start the backend:  run start_backend.bat
echo ============================================================
pause
