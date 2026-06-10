@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "feat: task detail view, edit modal, date badges (single/period, yellow/green/red)"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
