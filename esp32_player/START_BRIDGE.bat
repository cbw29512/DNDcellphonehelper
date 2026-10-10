@echo off
cd /d "%~dp0"
echo USB PLAYER DISPLAY - connect ESP32 to laptop on COM3.
echo First run ..\start.bat to open the DM control station.
echo Then keep this bridge open during the game.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0bridge.ps1" -Port COM3
pause
