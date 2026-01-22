@echo off
echo ========================================
echo   Test Docker Build Locally
echo ========================================
echo.
echo This script builds and tests the Docker container locally
echo before deploying to Google Cloud Platform
echo.
pause

cd backend

echo.
echo ========================================
echo   Step 1: Building Docker Image
echo ========================================
docker build -t inventory-backend:test .

if %errorlevel% neq 0 (
    echo ERROR: Docker build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Step 2: Running Container Locally
echo ========================================
echo.
echo Starting container on http://localhost:8080
echo.
echo Using MongoDB (local mode)
echo Press Ctrl+C to stop
echo.

docker run -p 8080:8080 ^
  -e USE_FIRESTORE=false ^
  -e MONGO_URL=mongodb://host.docker.internal:27017 ^
  -e DB_NAME=test_database ^
  -e CORS_ORIGINS=* ^
  inventory-backend:test

cd ..
