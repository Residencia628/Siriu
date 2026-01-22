@echo off
echo ========================================
echo   Deploy to Google Cloud Platform
echo ========================================
echo.

set /p PROJECT_ID="Enter your GCP Project ID: "
set /p REGION="Enter region (default: us-central1): "
if "%REGION%"=="" set REGION=us-central1

echo.
echo Project ID: %PROJECT_ID%
echo Region: %REGION%
echo.
echo Press any key to start deployment...
pause > nul

echo.
echo ========================================
echo   Step 1: Setting GCP Project
echo ========================================
gcloud config set project %PROJECT_ID%

echo.
echo ========================================
echo   Step 2: Enable Required APIs
echo ========================================
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable secretmanager.googleapis.com

echo.
echo ========================================
echo   Step 3: Building Backend Container
echo ========================================
cd backend
gcloud builds submit --tag gcr.io/%PROJECT_ID%/inventory-backend

echo.
echo ========================================
echo   Step 4: Deploying to Cloud Run
echo ========================================
gcloud run deploy inventory-backend ^
  --image gcr.io/%PROJECT_ID%/inventory-backend ^
  --platform managed ^
  --region %REGION% ^
  --allow-unauthenticated ^
  --set-env-vars USE_FIRESTORE=true,GCP_PROJECT_ID=%PROJECT_ID%

echo.
echo Getting backend URL...
for /f "tokens=*" %%i in ('gcloud run services describe inventory-backend --region %REGION% --format="value(status.url)"') do set BACKEND_URL=%%i

echo Backend URL: %BACKEND_URL%

cd ..

echo.
echo ========================================
echo   Step 5: Building Frontend
echo ========================================
cd frontend

echo Creating production .env file...
echo REACT_APP_BACKEND_URL=%BACKEND_URL% > .env.production

echo Building React app...
call npm run build

echo.
echo ========================================
echo   Step 6: Deploying Frontend to Firebase
echo ========================================
echo.
echo Please run manually:
echo   1. firebase login
echo   2. firebase init hosting (select 'build' as public directory)
echo   3. Update .firebaserc with your project ID
echo   4. firebase deploy
echo.

cd ..

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Backend URL: %BACKEND_URL%
echo Frontend: Deploy manually with Firebase CLI
echo.
echo Next steps:
echo 1. Initialize Firestore in GCP Console
echo 2. Deploy frontend with Firebase CLI
echo 3. Update CORS_ORIGINS in Cloud Run with frontend URL
echo.
pause
