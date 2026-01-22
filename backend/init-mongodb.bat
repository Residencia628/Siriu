@echo off
echo ========================================
echo   MongoDB Database Initialization
echo ========================================
echo.
echo This script will:
echo 1. Create database 'test_database'
echo 2. Create collections: users, equipment, history, tipos_bien, marcas
echo 3. Add indexes for optimal performance
echo 4. Add validation schemas
echo.
pause

echo.
echo Initializing database...
mongosh < init_mongodb.js

echo.
echo Initializing default tipos_bien and marcas...
mongosh < init_tipos_marcas.js

echo.
echo ========================================
echo   Initialization Complete!
echo ========================================
echo.
echo Database: test_database
echo Collections: users, equipment, history, tipos_bien, marcas
echo.
echo Verify with: mongosh
echo   use test_database
echo   show collections
echo.
pause
