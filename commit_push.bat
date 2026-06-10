@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "fix: null bytes dans App.jsx (crash vite build) + RegisterPage.jsx tronque"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
