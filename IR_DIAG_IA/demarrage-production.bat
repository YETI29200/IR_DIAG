@echo off
echo ========================================
echo Lancement de l'application en mode Production
echo ========================================
echo.

echo 1. Verification des dependances...
call npm install --production=false

echo.
echo 2. Construction de l'interface (Client)...
call npm run build

echo.
echo 3. Initialisation de la base de donnees...
call npm run db:migrate

echo.
echo 4. Demarrage du serveur...
echo (Le serveur est disponible sur http://localhost:3000 par defaut)
echo.

set NODE_ENV=production
node server/index.js
