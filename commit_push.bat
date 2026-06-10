@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "fix: create board try-catch, header icone+couleurs public/prive, refresh visible, colonnes defaut"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
