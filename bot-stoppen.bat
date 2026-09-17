@echo off
if exist bot.pid (
    set /p BOT_PID=<bot.pid
    taskkill /f /pid %BOT_PID% >nul 2>&1
    del bot.pid >nul 2>&1
    echo CleverQ Termin-Bot (PID %BOT_PID%) wurde beendet.
) else (
    taskkill /f /im node.exe >nul 2>&1
    if %errorlevel% equ 0 (
        echo Node.js Bot-Prozesse wurden beendet.
    ) else (
        echo Es lief kein Bot-Prozess.
    )
)
echo.
pause
