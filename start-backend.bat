@echo off
echo ========================================
echo   Starting Backend Server
echo ========================================
echo.

cd /d %~dp0backend

echo Checking MongoDB connection...
echo Make sure MongoDB is running on localhost:27017
echo.

echo Starting FastAPI server on http://localhost:8000
echo.
echo API Documentation will be available at:
echo   - http://localhost:8000/docs (Swagger UI)
echo   - http://localhost:8000/redoc (ReDoc)
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
