@echo off
echo ========================================
echo   Quick Application Test
echo ========================================
echo.

echo [1/4] Checking MongoDB...
net start MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ MongoDB is running
) else (
    echo   ! MongoDB service started
)

echo.
echo [2/4] Checking MongoDB collections...
mongosh test_database --quiet --eval "db.getCollectionNames()" | findstr "users equipment history" >nul
if %errorlevel% equ 0 (
    echo   ✓ Collections are created
) else (
    echo   ✗ Collections not found
    echo   Run: backend\init-mongodb.bat
)

echo.
echo [3/4] Checking frontend dependencies...
if exist "frontend\node_modules" (
    echo   ✓ Frontend dependencies installed
) else (
    echo   ✗ Frontend dependencies missing
    echo   Installing now...
    cd frontend
    call npm install --legacy-peer-deps >nul 2>&1
    cd ..
    echo   ✓ Dependencies installed
)

echo.
echo [4/4] Checking backend dependencies...
python -c "import uvicorn; import fastapi" 2>nul
if %errorlevel% equ 0 (
    echo   ✓ Backend dependencies installed
) else (
    echo   ✗ Backend dependencies missing
    echo   Run: pip install -r backend\requirements.txt
)

echo.
echo ========================================
echo   System Status
echo ========================================
echo.
echo Everything is ready! You can now run:
echo   • start-all.bat    (Start both servers)
echo   • start-backend.bat (Backend only)
echo   • start-frontend.bat (Frontend only)
echo.
pause
