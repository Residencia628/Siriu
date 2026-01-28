@echo off
title Post-Deployment Verification
color 0A

echo ========================================
echo   POST-DEPLOYMENT VERIFICATION
echo ========================================
echo.

timeout /t 2 /nobreak >nul

echo 1. Checking GitHub repository status...
echo ----------------------------------------
git status
echo.
timeout /t 2 /nobreak >nul

echo 2. Verifying latest commit...
echo -------------------------------
git log --oneline -1
echo.
timeout /t 2 /nobreak >nul

echo 3. Testing backend CORS configuration...
echo -----------------------------------------
python test_cors_fix.py
echo.
timeout /t 3 /nobreak >nul

echo 4. Checking frontend build status...
echo -----------------------------------
cd frontend
call npm run build
if %errorlevel% equ 0 (
    echo ✅ Frontend builds successfully
) else (
    echo ❌ Frontend build failed
)
cd ..
echo.
timeout /t 2 /nobreak >nul

echo ========================================
echo   DEPLOYMENT CHECKLIST
echo ========================================
echo.
echo ☐ Check Netlify deployment: https://app.netlify.com/sites/siriu/deploys
echo ☐ Check Render deployment: https://dashboard.render.com/
echo ☐ Test login at: https://siriu.netlify.app
echo ☐ Clear browser cache and test again
echo ☐ Verify no CORS errors in browser console
echo.
echo 💡 TIP: Hard refresh with Ctrl+F5 after deployments
echo.
pause