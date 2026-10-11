@echo off
setlocal
cd /d "%~dp0"
chcp 65001 > nul
title RetinaScan-XAI - Training All 3 Models

echo ============================================================
echo  RetinaScan-XAI -- Automated Sequential Training Runner
echo  RTX 4060 GPU / CUDA 12.1 / Python 3.12 (train_env)
echo ============================================================
echo.
echo This script will train all 3 models in sequence:
echo   [1/3] ResNet-50 Classifier  [APTOS + MESSIDOR-2, ~5,406 images]
echo   [2/3] Lesion U-Net          [IDRiD dataset, ~54 annotated images]
echo   [3/3] Blood Vessel U-Net    [DRIVE dataset, ~20 annotated images]
echo.
echo NOTE: Checkpoint resume is active on all models.
echo If PC restarts or gets interrupted, just run this file again to continue!
echo ============================================================
echo.

set "PY=%~dp0ml_script\train_env\Scripts\python.exe"

if not exist "%PY%" (
    echo [ERROR] Virtual environment python not found at: %PY%
    echo Please make sure ml_script\train_env is created.
    goto error
)

echo.
echo ============================================================
echo --- STEP 1 OF 3: Training ResNet-50 Classifier [APTOS + MESSIDOR-2] ---
echo Started at: %TIME%
echo ============================================================
"%PY%" ml_script\train_classifier_v2.py
if errorlevel 1 goto error1

echo.
echo ============================================================
echo --- STEP 2 OF 3: Training Lesion Segmentation U-Net [IDRiD] ---
echo Started at: %TIME%
echo ============================================================
"%PY%" ml_script\train_lesion_seg.py
if errorlevel 1 goto error2

echo.
echo ============================================================
echo --- STEP 3 OF 3: Training Blood Vessel Segmentation U-Net [DRIVE] ---
echo Started at: %TIME%
echo ============================================================
"%PY%" ml_script\train_vessel_seg.py
if errorlevel 1 goto error3

echo.
echo ============================================================
echo  ALL 3 MODELS SUCCESSFULLY TRAINED!
echo ============================================================
echo Generated artifacts in ml_script/:
echo   - ml_script/retinascan_resnet50_v2.pth
echo   - ml_script/lesion_unet.pth
echo   - ml_script/vessel_unet.pth
echo   - ml_script/evaluation_report_v2.json
echo   - ml_script/lesion_seg_report.json
echo   - ml_script/vessel_seg_report.json
echo ============================================================
goto finish

:error1
echo.
echo [ERROR] Step 1 (ResNet-50 Classifier) failed!
goto error

:error2
echo.
echo [ERROR] Step 2 (Lesion Segmentation U-Net) failed!
goto error

:error3
echo.
echo [ERROR] Step 3 (Blood Vessel Segmentation U-Net) failed!
goto error

:error
echo.
echo ============================================================
echo [STOPPED] Training process halted due to error.
echo ============================================================

:finish
pause
