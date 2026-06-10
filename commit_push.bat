@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "fix: favoris sidebar ouvrent le board directement au lieu de la page publics"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
