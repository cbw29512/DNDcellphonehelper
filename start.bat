@echo off
title DND Control Station V2.1 CARD MODE - port 8766
echo DND Control Station V2.1 - new card interface - http://127.0.0.1:8766
echo Do not use your old V1 tab at port 8765.
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 server.py
) else (
  python server.py
)
pause
