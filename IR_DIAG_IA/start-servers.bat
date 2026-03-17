@echo off
echo ========================================
echo Demarrage des serveurs
echo ========================================
echo.

echo Arret des processus Node.js existants...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Demarrage du serveur backend (port 3000)...
start "Backend Server" /MIN cmd /k "cd /d "%~dp0server" && node index.js"

timeout /t 3 /nobreak >nul

echo.
echo Demarrage du serveur frontend (port 5173)...
start "Frontend Server" /MIN cmd /k "cd /d "%~dp0client" && npx vite --host 0.0.0.0 --port 5173"

timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Verification des serveurs
echo ========================================
netstat -ano | findstr ":3000" | findstr "LISTENING"
netstat -ano | findstr ":5173" | findstr "LISTENING"

echo.
echo ========================================
echo Serveurs demarres ! Ouverture du navigateur...
echo ========================================
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
:: Tentative d'ouverture avec Chrome, sinon le navigateur par defaut
start chrome http://localhost:5173/ 2>nul || start http://localhost:5173/
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul
