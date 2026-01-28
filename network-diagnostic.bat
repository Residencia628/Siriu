@echo off
title Network and CORS Diagnostic Tool
color 0A

echo ========================================
echo   NETWORK AND CORS DIAGNOSTIC TOOL
echo ========================================
echo.

echo 1. Testing basic connectivity to backend...
echo ------------------------------------------
ping -n 3 siriu-backend.onrender.com
echo.
timeout /t 2 /nobreak >nul

echo 2. Testing DNS resolution...
echo ----------------------------
nslookup siriu-backend.onrender.com
echo.
timeout /t 2 /nobreak >nul

echo 3. Testing direct HTTPS connection...
echo -------------------------------------
powershell -Command "& {try { $response = Invoke-WebRequest -Uri 'https://siriu-backend.onrender.com/' -TimeoutSec 10 -ErrorAction Stop; Write-Host '✅ Connection successful' -ForegroundColor Green; Write-Host 'Status Code:' $response.StatusCode; } catch { Write-Host '❌ Connection failed:' $_.Exception.Message -ForegroundColor Red; }}"
echo.
timeout /t 2 /nobreak >nul

echo 4. Testing CORS endpoints...
echo ---------------------------
python test_enhanced_cors.py
echo.
timeout /t 3 /nobreak >nul

echo 5. Checking current git status...
echo --------------------------------
git status
echo.
timeout /t 2 /nobreak >nul

echo 6. Testing local development server...
echo -------------------------------------
echo This will test if the issue is environment-specific
echo Press Ctrl+C to skip this test
echo.
cd frontend
timeout /t 3 /nobreak >nul
echo Starting local development server...
start "" npm start
timeout /t 10 /nobreak >nul
taskkill /IM node.exe /F >nul 2>&1
cd ..

echo.
echo ========================================
echo   DIAGNOSTIC COMPLETE
echo ========================================
echo.
echo 📋 Next steps:
echo 1. Check the test results above
echo 2. If connection fails, check your firewall/antivirus
echo 3. If CORS fails, wait for Render deployment to complete
echo 4. Clear browser cache and test again
echo 5. Try different network/connection if issues persist
echo.
pause