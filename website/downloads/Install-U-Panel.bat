@echo off
setlocal
title U-Panel Windows install helper
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-U-Panel.ps1" %*
set ERR=%ERRORLEVEL%
if not "%ERR%"=="0" (
  echo.
  echo Install helper failed with exit code %ERR%.
  pause
)
exit /b %ERR%
