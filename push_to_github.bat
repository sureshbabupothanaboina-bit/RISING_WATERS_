@echo off
echo ========================================================
echo Pushing RISING WATERS Project to GitHub
echo Repository: https://github.com/sureshbabupothanaboina-bit/RISING_WATERS_.git
echo ========================================================

set GIT_CMD=git
if exist "mingit\cmd\git.exe" set GIT_CMD=mingit\cmd\git.exe

%GIT_CMD% init
%GIT_CMD% remote remove origin 2>nul
%GIT_CMD% remote add origin https://github.com/sureshbabupothanaboina-bit/RISING_WATERS_.git
%GIT_CMD% add .
%GIT_CMD% commit -m "Initial commit: Machine Learning Flood Prediction System (XGBoost 96.55%) & Flask App"
%GIT_CMD% branch -M main
%GIT_CMD% push -u origin main

echo ========================================================
echo Repository upload process complete!
echo ========================================================
pause
