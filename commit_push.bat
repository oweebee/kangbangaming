@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "fix: colonnes par defaut selon type board (steam/manuel), titre +25%, typo sidebar unifiee"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
