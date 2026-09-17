@echo off
setlocal enabledelayedexpansion

echo Suche und beende alle laufenden CleverQ Bot-Prozesse...
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name = 'node.exe'\" | Where-Object { $_.CommandLine -like '*bot.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host \"Bot-Prozess (PID $($_.ProcessId)) wurde beendet.\" }"

if exist bot.pid del /f /q bot.pid >nul 2>&1

echo.
echo Alle Bot-Instanzen wurden vollstaendig gestoppt.
echo.
pause
