@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "feat: favBoards drag&drop, header community icon, PublicBoards direct open"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
