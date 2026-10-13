@echo off
chcp 65001 >nul
echo ======================================================================
echo   Installation du certificat de signature pour SteamOverlayStream
echo ======================================================================
echo.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0install-certificate.ps1"
echo.
pause
