@echo off
setlocal
cd /d "%~dp0"
echo === DND ESP32 PLAYER DISPLAY - FIRST TIME ONLY ===
echo This REPLACES whatever is currently flashed on your ESP32.
echo Board: CYD2USB ST7789. Plug its USB data port into the laptop.
echo Close any serial monitors or other programs using COM3.
echo.
where py >nul 2>nul
if errorlevel 1 (
 echo Python launcher is missing. Install Python + PlatformIO first.
 pause
 exit /b 1
)
py -m platformio run -e cyd2usb_st7789 -t upload --upload-port COM3
if errorlevel 1 (
 echo.
 echo FLASH FAILED. Firmware is NOT confirmed installed.
 echo Make sure the board is on COM3 and PlatformIO is installed.
 pause
 exit /b 1
)
echo.
echo FLASH COMPLETE. Close this window, run the laptop's start.bat,
echo then double-click START_BRIDGE.bat to mirror live combat data.
pause
