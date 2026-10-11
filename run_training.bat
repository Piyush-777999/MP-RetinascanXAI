@echo off
setlocal
cd /d "%~dp0"
chcp 65001 > nul
title RetinaScan-XAI -- ML Training Runner

echo ============================================================
echo  RetinaScan-XAI -- ML Training Runner
echo  RTX 4060 / CUDA 12.1 / Python 3.12 (train_env)
echo ============================================================
echo.
echo Select what to train:
echo   [1] ResNet-50 Classifier  [APTOS + MESSIDOR-2, ~2-3 hrs]
echo   [2] Lesion U-Net          [IDRiD, ~45 min]
echo   [3] Vessel U-Net          [DRIVE, ~30 min]
echo   [4] Run ALL sequentially (recommended for overnight)
echo.

set "PY=%~dp0ml_script\train_env\Scripts\python.exe"

if not exist "%PY%" (
    echo [ERROR] Virtual environment python not found at: %PY%
    pause
    exit /b 1
)

choice /c 1234 /m "Select [1, 2, 3, or 4]: "

if errorlevel 4 goto opt4
if errorlevel 3 goto opt3
if errorlevel 2 goto opt2
if errorlevel 1 goto opt1
goto end

:opt1
echo.
echo ============================================================
echo [1/1] Training ResNet-50 Classifier...
echo ============================================================
"%PY%" ml_script\train_classifier_v2.py
if errorlevel 1 goto error
goto done

:opt2
echo.
echo ============================================================
echo [1/1] Training Lesion U-Net [IDRiD]...
echo ============================================================
"%PY%" ml_script\train_lesion_seg.py
if errorlevel 1 goto error
goto done

:opt3
echo.
echo ============================================================
echo [1/1] Training Vessel U-Net [DRIVE]...
echo ============================================================
"%PY%" ml_script\train_vessel_seg.py
if errorlevel 1 goto error
goto done

:opt4
echo.
echo ============================================================
echo [1/3] Training ResNet-50 Classifier [APTOS + MESSIDOR-2]...
echo ============================================================
"%PY%" ml_script\train_classifier_v2.py
if errorlevel 1 goto error1

echo.
echo ============================================================
echo [2/3] Training Lesion U-Net [IDRiD]...
echo ============================================================
"%PY%" ml_script\train_lesion_seg.py
if errorlevel 1 goto error2

echo.
echo ============================================================
echo [3/3] Training Vessel U-Net [DRIVE]...
echo ============================================================
"%PY%" ml_script\train_vessel_seg.py
if errorlevel 1 goto error3

goto done

:error1
echo.
echo [ERROR] ResNet-50 Classifier training encountered an error!
goto error

:error2
echo.
echo [ERROR] Lesion U-Net training encountered an error!
goto error

:error3
echo.
echo [ERROR] Vessel U-Net training encountered an error!
goto error

:error
echo.
echo ============================================================
echo [STOPPED] Training halted due to an error. Check logs above.
echo ============================================================
goto end

:done
echo.
echo ============================================================
echo  All training complete!
echo  Outputs in ml_script/:
echo    retinascan_resnet50_v2.pth
echo    lesion_unet.pth
echo    vessel_unet.pth
echo    evaluation_report_v2.json
echo    lesion_seg_report.json
echo    vessel_seg_report.json
echo ============================================================

:end
pause
