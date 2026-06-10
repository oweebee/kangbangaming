@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "fix: activeBoard declare avant isTaskBoard (ReferenceError page noire)"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
