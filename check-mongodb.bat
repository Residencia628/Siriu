@echo off
echo ========================================
echo   MongoDB Connection Check
echo ========================================
echo.

echo Checking if MongoDB is running...
echo.

powershell -Command "try { $connection = New-Object System.Net.Sockets.TcpClient('localhost', 27017); $connection.Close(); Write-Host 'SUCCESS: MongoDB is running on localhost:27017' -ForegroundColor Green; exit 0 } catch { Write-Host 'ERROR: MongoDB is NOT running on localhost:27017' -ForegroundColor Red; Write-Host ''; Write-Host 'Please start MongoDB before running the application.' -ForegroundColor Yellow; Write-Host 'Install from: https://www.mongodb.com/try/download/community' -ForegroundColor Yellow; exit 1 }"

echo.
echo ========================================
pause
