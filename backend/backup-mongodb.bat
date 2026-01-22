@echo off
echo ========================================
echo   MongoDB Backup Script
echo ========================================
echo.

set BACKUP_DIR=.\backups
set DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set DATE=%DATE: =0%
set BACKUP_PATH=%BACKUP_DIR%\backup_%DATE%

echo Creating backup directory...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo.
echo Backing up database 'test_database'...
echo Backup location: %BACKUP_PATH%
echo.

mongodump --db test_database --out "%BACKUP_PATH%"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Backup completed successfully!
    echo ========================================
    echo.
    echo Backup saved to: %BACKUP_PATH%
    echo.
) else (
    echo.
    echo ERROR: Backup failed!
    echo.
)

pause
