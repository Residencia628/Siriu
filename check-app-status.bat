@echo off
echo ========================================
echo   Application Status Check
echo ========================================
echo.

echo [Backend - Port 8000]
netstat -ano | findstr ":8000" >nul
if %errorlevel% equ 0 (
    echo   ✓ Backend is RUNNING on port 8000
    echo   URL: http://localhost:8000/docs
) else (
    echo   ✗ Backend is NOT running
)

echo.
echo [Frontend - Port 3000]
netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo   ✓ Frontend is RUNNING on port 3000
    echo   URL: http://localhost:3000
) else (
    echo   ✗ Frontend is NOT running
)

echo.
echo [MongoDB - Port 27017]
netstat -ano | findstr ":27017" >nul
if %errorlevel% equ 0 (
    echo   ✓ MongoDB is RUNNING on port 27017
) else (
    echo   ✗ MongoDB is NOT running
)

echo.
echo ========================================
echo   Access Instructions
echo ========================================
echo.
echo 1. Open browser (Chrome/Edge/Firefox)
echo 2. Go to: http://localhost:3000
echo 3. Clear cache: Ctrl+Shift+Del (select all, clear)
echo 4. Or use Incognito: Ctrl+Shift+N
echo 5. Login with:
echo    Email: admin@universidad.edu
echo    Password: admin123
echo.
echo If page is blank:
echo    - Press Ctrl+Shift+R (hard refresh)
echo    - Open DevTools (F12) and check Console
echo    - Check Network tab for errors
echo.
pause
