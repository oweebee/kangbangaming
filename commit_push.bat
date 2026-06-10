@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "feat: game stats widget slide-in/out animation, banner ratio, close top-left"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
