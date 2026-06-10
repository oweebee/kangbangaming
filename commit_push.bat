@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "feat: page accueil au login - boards publics / prives en grille, logo cliquable"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
