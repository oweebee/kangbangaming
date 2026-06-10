@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "feat: KangBanGaming - status pending/active, page profil, admin panel rewrite, Discord/GitHub branding"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
