@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "feat: drag and drop reorder boards sidebar, ordre persiste en localStorage"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
