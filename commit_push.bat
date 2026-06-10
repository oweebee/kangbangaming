@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "ui: icones boards 34px bordure blanche 2px, noms boards bold"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
