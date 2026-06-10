@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "fix: accueil boards publics fetch api, headerImg banniere, sidebar ferme publicBoards, boutons gauche"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
