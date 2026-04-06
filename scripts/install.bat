@echo off
echo === Installing O as a startup service ===
echo.

:: Get the directory of this script
set SCRIPT_DIR=%~dp0
set VBS_PATH=%SCRIPT_DIR%o-server.vbs

:: Register in Task Scheduler to run at logon
schtasks /create /tn "O-Server" /tr "wscript.exe \"%VBS_PATH%\"" /sc onlogon /rl highest /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo OK — O will start automatically when you log in.
    echo.
    echo   To start now:    schtasks /run /tn "O-Server"
    echo   To stop:         taskkill /f /im node.exe (careful — kills all Node)
    echo   To uninstall:    run scripts\uninstall.bat
    echo.
) else (
    echo.
    echo FAILED — try running this script as Administrator.
    echo.
)

pause
