@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "fix: server.js tronque - app.listen manquant (backend ne demarrait pas)"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
