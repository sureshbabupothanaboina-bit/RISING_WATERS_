Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Pushing RISING WATERS Project to GitHub" -ForegroundColor Cyan
Write-Host "Repository: https://github.com/sureshbabupothanaboina-bit/RISING_WATERS_.git" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

git init
git remote remove origin 2>$null
git remote add origin https://github.com/sureshbabupothanaboina-bit/RISING_WATERS_.git
git add .
git commit -m "Initial commit: Machine Learning Flood Prediction System (XGBoost 96.55%) & Flask App"
git branch -M main
git push -u origin main

Write-Host "========================================================" -ForegroundColor Green
Write-Host "Repository upload process complete!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
