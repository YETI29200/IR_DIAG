@echo off
echo Ouverture du navigateur...
:: Tentative d'ouverture avec Chrome, sinon utilise le navigateur par defaut
start chrome http://localhost:5173/ 2>nul || start http://localhost:5173/
echo.
echo Navigateur lance ! Si la page ne s'affiche pas encore, 
echo attendez quelques secondes que le serveur Vite termine son initialisation 
echo puis rafraichissez la page (F5).
timeout /t 3 >nul

