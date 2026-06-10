@echo off
echo ============================
echo  Deploy Kanban Gaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "feat: avatar Steam dans la sidebar + profil Steam par user"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
