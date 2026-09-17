@echo off
taskkill /f /im node.exe 2>nul
if %errorlevel% equ 0 (
    echo CleverQ Termin-Bot wurde erfolgreich beendet.
) else (
    echo Es lief kein Bot-Prozess.
)
pause

