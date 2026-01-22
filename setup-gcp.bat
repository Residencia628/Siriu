@echo off
echo ========================================
echo   Google Cloud Platform Setup
echo ========================================
echo.
echo This script will help you set up the application on GCP
echo.
echo Prerequisites:
echo   1. Google Cloud SDK installed
echo   2. Firebase CLI installed (npm install -g firebase-tools)
echo   3. GCP Project created
echo   4. Billing enabled on project
echo.
pause

echo.
echo ========================================
echo   Step 1: Verify gcloud installation
echo ========================================
gcloud --version
if %errorlevel% neq 0 (
    echo ERROR: gcloud not found!
    echo Please install from: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Step 2: Login to Google Cloud
echo ========================================
gcloud auth login

echo.
echo ========================================
echo   Step 3: List your GCP projects
echo ========================================
gcloud projects list

echo.
set /p PROJECT_ID="Enter your GCP Project ID: "

echo.
echo ========================================
echo   Step 4: Set project and enable APIs
echo ========================================
gcloud config set project %PROJECT_ID%
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable firebase.googleapis.com

echo.
echo ========================================
echo   Step 5: Initialize Firestore
echo ========================================
echo.
echo Please complete these steps manually in GCP Console:
echo 1. Go to: https://console.cloud.google.com/firestore
echo 2. Select "Native Mode"
echo 3. Choose region (same as Cloud Run: us-central1)
echo 4. Click "Create Database"
echo.
echo Press any key after Firestore is initialized...
pause > nul

echo.
echo ========================================
echo   Step 6: Backend Dependencies
echo ========================================
cd backend
echo Installing google-cloud-firestore...
pip install google-cloud-firestore

cd ..

echo.
echo ========================================
echo   Step 7: Frontend Dependencies
echo ========================================
cd frontend
echo Installing Firebase...
call npm install firebase

cd ..

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: deploy-gcp.bat to deploy the application
echo 2. Or deploy manually:
echo    - Backend: cd backend ^&^& gcloud builds submit
echo    - Frontend: cd frontend ^&^& firebase deploy
echo.
pause
