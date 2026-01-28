@echo off
cls
echo ====================================================================
echo   DIAGNOSTICO DE CONEXION - SIRIU
echo ====================================================================
echo.

echo 1. Verificando backend...
powershell -Command "irm https://siriu-backend.onrender.com/health | ConvertTo-Json"
echo.

echo 2. URLs a verificar:
echo Frontend: https://siriu.netlify.app
echo Backend:  https://siriu-backend.onrender.com
echo Health:   https://siriu-backend.onrender.com/health
echo Login API: https://siriu-backend.onrender.com/api/auth/login
echo.

echo 3. Pasos a seguir si hay errores:
echo - Verificar CORS_ORIGINS en Render Dashboard
echo - Verificar REACT_APP_BACKEND_URL en Netlify
echo - Forzar redeploy en Netlify (Clear cache)
echo - Probar login nuevamente
echo.

echo 4. En caso de persistir el error:
echo - Abrir Developer Tools (F12) en el navegador
echo - Pestaña Network
echo - Ver que URL esta fallando
echo.

pause