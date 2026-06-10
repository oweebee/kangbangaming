@echo off
echo ============================
echo  Deploy Kanban Gaming
echo ============================
cd /d "%~dp0"
echo Suppression du verrou git...
del .git\index.lock 2>nul
echo Ajout des fichiers...
git add -A
echo Commit...
git commit -m "fixes: jeux orphelins + retirer depuis recherche + mobile + icone board jeu"
echo Push vers GitHub...
git push
echo.
echo Termine ! Va redeploi dans Coolify.
pause
