@echo off
echo ========================================
echo   Starting Frontend Server
echo ========================================
echo.

cd /d %~dp0frontend

echo Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --legacy-peer-deps
    echo.
)

echo Installing compatibility fixes...
call npm install ajv@^8.0.0 --legacy-peer-deps --silent

echo.
echo Starting React development server...
echo The application will open at http://localhost:3000
echo.
echo Default credentials:
echo   Email: admin@universidad.edu
echo   Password: admin123
echo.
echo IMPORTANT: If page is blank:
echo   1. Press Ctrl+Shift+R (hard refresh)
echo   2. Or open in Incognito mode (Ctrl+Shift+N)
echo   3. Check browser console (F12) for errors
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

set BROWSER=default
call npm start
