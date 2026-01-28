@echo off
title Browser Extension and Network Interference Detector
color 0C

echo ========================================
echo   EXTENSION/INTERFERENCE DETECTOR
echo ========================================
echo.

echo ğŸ”Ž Detectando posibles fuentes de interferencia...
echo --------------------------------------------------

echo 1. Verificando procesos de antivirus/seguridad...
echo --------------------------------------------------
tasklist | findstr /i "avast|avg|bitdefender|kaspersky|mcafee|norton|windows defender|malwarebytes"
if %errorlevel% equ 0 (
    echo âœ… Se detectaron programas de seguridad en ejecuciÃ³n
) else (
    echo âœ… No se detectaron programas de seguridad principales
)
echo.

echo 2. Verificando servicios de red...
echo ----------------------------------
netsh winsock show catalog | findstr /i "proxy\|inject"
if %errorlevel% equ 0 (
    echo âš ď¸ Se detectaron servicios de proxy/inject en WinSock
) else (
    echo âœ… WinSock limpio
)
echo.

echo 3. Verificando variables de entorno de proxy...
echo ------------------------------------------------
echo HTTP_PROXY: %HTTP_PROXY%
echo HTTPS_PROXY: %HTTPS_PROXY%
echo NO_PROXY: %NO_PROXY%
if defined HTTP_PROXY echo âš ď¸ Proxy HTTP configurado
if defined HTTPS_PROXY echo âš ď¸ Proxy HTTPS configurado
echo.

echo 4. Verificando configuraciÃ³n de red...
echo -------------------------------------
ipconfig /all | findstr /i "proxy\|gateway"
echo.

echo 5. Generando reporte de red detallado...
echo ----------------------------------------
echo Guardando informaciÃ³n de red en network-report.txt
netstat -an | findstr :443 > network-report.txt
netstat -an | findstr :80 >> network-report.txt
echo âœ… Reporte generado

echo.
echo ========================================
echo   RECOMENDACIONES INMEDIATAS
echo ========================================
echo.
echo ğŸ”§ SOLUCIONES RECOMENDADAS:
echo 1. DESACTIVA temporalmente tu antivirus/firewall
echo 2. Desactiva TODAS las extensiones del navegador
echo 3. Prueba en modo incÃ³gnito SIN extensiones
echo 4. Usa un navegador diferente (Firefox, Edge)
echo 5. Verifica configuraciÃ³n de proxy del sistema
echo.
echo ğŸŽ¯ PASOS ESPECÃFICOS:
echo 1. Abre Chrome/Edge
echo 2. chrome://extensions/ o edge://extensions/
echo 3. Desactiva TODO excepto lo esencial
echo 4. Reinicia el navegador
echo 5. Prueba la aplicaciÃ³n nuevamente
echo.
echo ğŸ“± PARA DISPOSITIVOS MÃVILES:
echo - Prueba desde tu telÃ©fono usando datos mÃ³viles
echo - Usa navegadores diferentes (Firefox, Brave)
echo.
pause