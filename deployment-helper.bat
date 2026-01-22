@echo off
REM ====================================================================
REM Script de Ayuda para Deployment Gratuito - SIRIU
REM ====================================================================

echo.
echo ====================================================================
echo   DEPLOYMENT GRATUITO - SIRIU
echo   Opciones de Testing en Cloud antes de Google Cloud Platform
echo ====================================================================
echo.

:menu
echo.
echo Selecciona tu plataforma de deployment:
echo.
echo [1] Render.com (RECOMENDADO - Mas facil)
echo [2] Railway.app (Medio - Requiere CLI)
echo [3] Fly.io (Avanzado - Mejor rendimiento)
echo [4] Ver resumen de opciones
echo [5] Configurar MongoDB Atlas
echo [6] Salir
echo.
set /p option="Ingresa tu opcion (1-6): "

if "%option%"=="1" goto render
if "%option%"=="2" goto railway
if "%option%"=="3" goto flyio
if "%option%"=="4" goto summary
if "%option%"=="5" goto mongodb
if "%option%"=="6" goto exit
echo Opcion invalida, intenta de nuevo
goto menu

:render
echo.
echo ====================================================================
echo   RENDER.COM - DEPLOYMENT FACIL
echo ====================================================================
echo.
echo Pasos a seguir:
echo.
echo 1. Crear cuenta en: https://render.com
echo 2. Conectar con GitHub
echo 3. New ^> Web Service
echo 4. Seleccionar tu repositorio
echo 5. Configuracion:
echo    - Name: siriu-backend
echo    - Environment: Docker
echo    - Root Directory: backend
echo    - Plan: Free
echo.
echo 6. Variables de Entorno a agregar:
echo    MONGO_URL = (tu connection string de MongoDB Atlas)
echo    DB_NAME = siriu
echo    USE_FIRESTORE = false
echo    JWT_SECRET_KEY = (click Generate para crear una)
echo    CORS_ORIGINS = *
echo    PORT = 8080
echo.
echo 7. Click "Create Web Service"
echo.
echo Tiempo estimado: 10-15 minutos
echo.
echo Archivo de configuracion: render.yaml (ya creado en tu proyecto)
echo.
pause
goto menu

:railway
echo.
echo ====================================================================
echo   RAILWAY.APP - DEPLOYMENT CON CLI
echo ====================================================================
echo.
echo Pasos a seguir:
echo.
echo 1. Instalar Railway CLI:
echo    npm install -g @railway/cli
echo.
echo 2. Ejecutar comandos:
echo    cd backend
echo    railway login
echo    railway init
echo    railway add mongodb
echo    railway up
echo.
echo 3. Configurar variables:
echo    railway variables set USE_FIRESTORE=false
echo    railway variables set JWT_SECRET_KEY=$(openssl rand -hex 32)
echo    railway variables set CORS_ORIGINS="*"
echo.
echo Credito mensual: $5 USD gratis
echo.
echo Archivo de configuracion: railway.json (ya creado en backend/)
echo.
pause
goto menu

:flyio
echo.
echo ====================================================================
echo   FLY.IO - DEPLOYMENT GLOBAL
echo ====================================================================
echo.
echo Pasos a seguir:
echo.
echo 1. Instalar flyctl:
echo    iwr https://fly.io/install.ps1 -useb ^| iex
echo.
echo 2. Ejecutar comandos:
echo    fly auth login
echo    cd backend
echo    fly launch --name siriu-backend
echo    fly secrets set MONGO_URL="tu-mongo-url"
echo    fly secrets set USE_FIRESTORE=false
echo    fly deploy
echo.
echo Free tier: 3 VMs gratis permanentemente
echo.
echo Archivo de configuracion: fly.toml (ya creado en backend/)
echo.
pause
goto menu

:summary
echo.
echo ====================================================================
echo   RESUMEN DE OPCIONES
echo ====================================================================
echo.
echo +----------------+-------------+-------------+-------------------+
echo ^| Plataforma     ^| Setup       ^| Free Tier   ^| Mejor Para        ^|
echo +----------------+-------------+-------------+-------------------+
echo ^| Render         ^| Muy Facil   ^| 750h/mes    ^| Testing general   ^|
echo ^| Railway        ^| Medio       ^| $5 credito  ^| Desarrollo activo ^|
echo ^| Fly.io         ^| Medio       ^| 3 VMs       ^| Produccion real   ^|
echo +----------------+-------------+-------------+-------------------+
echo.
echo RECOMENDACION: Render + MongoDB Atlas + Vercel
echo.
echo Ventajas:
echo  - Zero configuracion CLI
echo  - 100%% interfaz web
echo  - Auto-deploy desde GitHub
echo  - SSL automatico
echo  - Sin tarjeta de credito
echo.
echo Limitaciones:
echo  - Backend duerme despues de 15 min
echo  - Primer request lento (~30s)
echo.
echo Para mas detalles, lee:
echo  - DEPLOYMENT_FREE_GUIDE.md (guia completa)
echo  - DEPLOYMENT_SUMMARY.md (resumen ejecutivo)
echo.
pause
goto menu

:mongodb
echo.
echo ====================================================================
echo   CONFIGURAR MONGODB ATLAS
echo ====================================================================
echo.
echo Pasos a seguir:
echo.
echo 1. Ir a: https://www.mongodb.com/cloud/atlas/register
echo 2. Crear cuenta gratuita
echo 3. Create a Deployment ^> M0 (Free)
echo 4. Cloud Provider: AWS
echo 5. Region: Selecciona el mas cercano
echo.
echo 6. Security ^> Database Access:
echo    - Username: siriu_admin
echo    - Password: (generar y guardar)
echo    - Role: Atlas admin
echo.
echo 7. Security ^> Network Access:
echo    - IP Address: 0.0.0.0/0
echo    - Comment: Allow all
echo.
echo 8. Connect ^> Connect your application:
echo    - Copiar connection string
echo    - Formato:
echo      mongodb+srv://siriu_admin:PASSWORD@cluster.mongodb.net/siriu
echo.
echo 9. Inicializar base de datos (desde tu PC):
echo    cd backend
echo    set MONGO_URL=tu-connection-string
echo    node init_mongodb.js
echo    node init_tipos_marcas.js
echo.
echo Free tier: 512MB storage permanente
echo.
pause
goto menu

:exit
echo.
echo ====================================================================
echo   RECURSOS ADICIONALES
echo ====================================================================
echo.
echo Documentacion:
echo  - DEPLOYMENT_FREE_GUIDE.md - Guia completa paso a paso
echo  - DEPLOYMENT_SUMMARY.md - Resumen ejecutivo
echo.
echo Archivos de configuracion creados:
echo  - render.yaml - Configuracion para Render
echo  - backend/railway.json - Configuracion para Railway
echo  - backend/fly.toml - Configuracion para Fly.io
echo.
echo Endpoints agregados en server.py:
echo  - GET / - Root endpoint
echo  - GET /health - Health check
echo  - GET /api/health - API health check
echo.
echo ====================================================================
echo   Buena suerte con tu deployment! 🚀
echo ====================================================================
echo.
exit /b 0
