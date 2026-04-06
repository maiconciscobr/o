@echo off
echo === Removing O from startup ===
echo.

schtasks /delete /tn "O-Server" /f

if %ERRORLEVEL% EQU 0 (
    echo OK — O will no longer start automatically.
) else (
    echo Task not found or already removed.
)

pause
