@echo off
echo ========================================
echo   MongoDB Restore Script
echo ========================================
echo.

set BACKUP_DIR=.\backups

echo Available backups:
echo.
dir /b "%BACKUP_DIR%"
echo.

set /p BACKUP_FOLDER="Enter backup folder name: "

if not exist "%BACKUP_DIR%\%BACKUP_FOLDER%" (
    echo ERROR: Backup folder not found!
    pause
    exit /b 1
)

echo.
echo WARNING: This will replace the current database!
echo.
set /p CONFIRM="Are you sure? (yes/no): "

if not "%CONFIRM%"=="yes" (
    echo Restore cancelled.
    pause
    exit /b 0
)

echo.
echo Restoring database from %BACKUP_FOLDER%...
echo.

mongorestore --db test_database "%BACKUP_DIR%\%BACKUP_FOLDER%\test_database" --drop

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Restore completed successfully!
    echo ========================================
    echo.
) else (
    echo.
    echo ERROR: Restore failed!
    echo.
)

pause
