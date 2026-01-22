@echo off
echo ========================================
echo   Starting Full Application Stack
echo ========================================
echo.
echo This will start both Backend and Frontend servers
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Make sure MongoDB is running on localhost:27017
echo.
echo Press any key to continue...
pause > nul
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Backend API: http://localhost:8000/docs
echo Frontend App: http://localhost:3000
echo.
echo Default login:
echo   Email: admin@universidad.edu
echo   Password: admin123
echo.
echo Close this window or press Ctrl+C to exit
echo (Backend and Frontend will continue running in separate windows)
echo ========================================
pause
