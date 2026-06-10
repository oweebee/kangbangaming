@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "fix: board vide colonnes, refresh, profil/steam, settings; ui: noms boards +20%, icones +25%"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
