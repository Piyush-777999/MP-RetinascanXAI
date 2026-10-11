@echo off
SET PY="C:\Users\Piyush\AppData\Local\Programs\Python\Python312\python.exe"
echo ============================================================
echo  RetinaScan-XAI — Training ResNet-50 on RTX 4060
echo ============================================================
%PY% ml_script\train_model.py
pause
