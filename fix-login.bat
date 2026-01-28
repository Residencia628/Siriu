@echo off
cls
color 0A
echo ====================================================================
echo   VERIFICADOR DE CONFIGURACION - SIRIU LOGIN FIX
echo ====================================================================
echo.

echo [1/4] Verificando backend en Render...
echo ----------------------------------------
powershell -Command "try { $response = irm https://siriu-backend.onrender.com/health; Write-Host '✓ Backend OK:' $response.status } catch { Write-Host '✗ Backend DOWN' }"
echo.

echo [2/4] Probando endpoint de login...
echo -----------------------------------
powershell -Command "try { $headers = @{ 'Content-Type' = 'application/json' }; $body = @{ email='admin@universidad.edu'; password='admin123' } | ConvertTo-Json; irm -Method POST -Uri 'https://siriu-backend.onrender.com/api/auth/login' -Headers $headers -Body $body | Out-Null; Write-Host '✓ Login endpoint OK' } catch { Write-Host '✗ Login endpoint ERROR:' $_.Exception.Message }"
echo.

echo [3/4] URLs importantes:
echo ----------------------
echo Frontend: https://siriu.netlify.app
echo Backend:  https://siriu-backend.onrender.com
echo API Login: https://siriu-backend.onrender.com/api/auth/login
echo Health:   https://siriu-backend.onrender.com/health
echo.

echo [4/4] Pasos a seguir:
echo -------------------
echo 1. En Netlify Dashboard:
echo    Site settings ^> Environment variables
echo    Verificar: REACT_APP_BACKEND_URL = https://siriu-backend.onrender.com
echo.
echo 2. En Render Dashboard:
echo    Seleccionar siriu-backend ^> Environment
echo    Verificar: CORS_ORIGINS = https://siriu.netlify.app
echo.
echo 3. En Netlify:
echo    Deploys ^> Trigger deploy ^> Clear cache and deploy site
echo.
echo 4. Probar login en: https://siriu.netlify.app
echo    Credenciales: admin@universidad.edu / admin123
echo.

echo ====================================================================
echo   Presiona cualquier tecla para continuar...
echo ====================================================================
pause >nul
