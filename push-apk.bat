@echo off
echo === Push android-app vers kangbangaming-apk ===

set REPO_URL=https://github.com/oweebee/kangbangaming-apk.git
set TEMP_DIR=%TEMP%\kangbangaming-apk

REM Nettoyer si déjà là
if exist "%TEMP_DIR%" rmdir /S /Q "%TEMP_DIR%"

echo Clonage du repo...
git clone %REPO_URL% "%TEMP_DIR%"
if errorlevel 1 ( echo ERREUR : clone échoué & pause & exit /b )

echo Copie des fichiers...
xcopy /E /Y /I "android-app\*" "%TEMP_DIR%\"

echo Commit et push...
cd /D "%TEMP_DIR%"
git add .
git commit -m "Update Android app"
git push

cd /D "%~dp0"
rmdir /S /Q "%TEMP_DIR%"

echo.
echo === Fait ! Vérifie l'onglet Actions sur GitHub ===
echo https://github.com/oweebee/kangbangaming-apk/actions
pause
