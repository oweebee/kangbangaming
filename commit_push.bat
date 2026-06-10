@echo off
echo ============================
echo  Deploy KangBanGaming
echo ============================
cd /d "%~dp0"
del .git\index.lock 2>nul
git add -A
git commit -m "feat: task type system (7 types with cartoon SVG, type selector in modal, styled GameCard)"
git push
echo.
echo Termine ! Redeploi dans Coolify.
pause
