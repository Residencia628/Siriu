@echo off
cls
echo ====================================================================
echo   VERIFICACION FINAL - SIRIU DEPLOYADO
echo ====================================================================
echo.

echo ??? URLs FINALES:
echo Frontend: https://siriu.netlify.app
echo Backend:  https://siriu-backend.onrender.com
echo.

echo 1. Verificar backend:
echo Abre: https://siriu-backend.onrender.com/health
echo Debe mostrar: {"status": "healthy", "database": "connected"}
echo.

echo 2. Probar aplicacion:
echo Abre: https://siriu.netlify.app
echo Login con:
echo   Usuario: admin@universidad.edu
echo   Password: admin123
echo.

echo 3. Funcionalidades a probar:
echo - Dashboard principal
echo - Inventario de equipos
echo - CRUD de equipos
echo - Gestión de edificios/ubicaciones
echo - Dashboards BI
echo.

echo 4. Dashboards de monitoreo:
echo MongoDB Atlas: https://cloud.mongodb.com
echo Render Dashboard: https://dashboard.render.com
echo Netlify Dashboard: https://app.netlify.com/sites/siriu
echo.

echo ====================================================================
echo   ??? FELICIDADES! Tu aplicacion esta LIVE en produccion!
echo ====================================================================
pause
