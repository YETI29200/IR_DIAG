@echo off
title IR DIAG - Lancement
color 0A

echo.
echo  ============================================
echo   IR DIAG - Diagnostic IA et Data
echo   Images ^& Reseaux
echo  ============================================
echo.

:: =============================================
:: MODIFIE CE CHEMIN SI NECESSAIRE
:: Chemin vers le dossier du projet
:: =============================================
set PROJECT_DIR=%~dp0IR_DIAG_IA

echo  Arret des serveurs existants...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo  Demarrage du serveur backend (port 3000)...
start "IR DIAG - Backend" /MIN cmd /k "cd /d "%PROJECT_DIR%" && node server/index.js"

timeout /t 3 /nobreak >nul

echo  Demarrage du serveur frontend (port 8080)...
start "IR DIAG - Frontend" /MIN cmd /k "cd /d "%PROJECT_DIR%\client" && npx vite --host 0.0.0.0 --port 8080"

timeout /t 5 /nobreak >nul

echo.
echo  ============================================
echo   Ouverture du navigateur...
echo  ============================================
echo.
echo   Backend  : http://localhost:3000
echo   Frontend : http://localhost:8080
echo.

start chrome http://localhost:8080/ 2>nul || start http://localhost:8080/

echo  Application lancee !
echo  Vous pouvez fermer cette fenetre.
echo.
pause
