@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "fix: RegisterPage.jsx tronque - fichier complet restaure (Discord+GitHub + fermeture JSX)"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
