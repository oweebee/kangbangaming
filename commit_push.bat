@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "feat: duo icones Steam+Discord sur login et sidebar, Steam ID obligatoire a l'inscription"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
