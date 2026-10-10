# CYD2USB ESP32 player display (USB, no Wi-Fi)

This add-on turns your ESP32-2432S028R CYD2USB / ESP32-D0WD-V3 into a small 320 x 240 landscape player-facing display for DND Cellphone Helper. The laptop remains the DM control station; the ESP32 receives ONLY the current combatant, round, last dice result/formula, buffs and debuffs via USB serial. No touchscreen setup, SD card, server changes, browser or internet is needed during play.

**Flashing replaces your current ESP32 firmware** (including the Wireless Analyzer). Back up anything you want to retain before flashing. It does not affect the Windows application or saved combat session.

## At the seminar: fastest steps

1. Download this repository as ZIP from GitHub (Code > Download ZIP) and extract it. Connect the ESP32 to the laptop with a USB data cable. Close any Arduino Serial Monitor or other program using its COM port.
2. If your ESP32 still appears as COM3, double-click esp32_player/FLASH_ONCE.bat. Wait for FLASH COMPLETE. This uses PlatformIO already installed on the laptop. If PlatformIO is unavailable: py -m pip install platformio, then retry the batch file; initial dependency/toolchain downloads require internet.
3. In the repository root, double-click start.bat. Your familiar DM Control Station opens at http://127.0.0.1:8766.
4. In esp32_player, double-click START_BRIDGE.bat. Leave its command window running. Within a few seconds the ESP32 should show USB LIVE and your current initiative/dice/status information.
5. Use the laptop as normal. Each roll, NEXT turn, and added/removed status updates the ESP32 without touching it.

On later game days you normally only need steps 3–4; don't flash it again. You may use a different COM port by editing COM3 in FLASH_ONCE.bat and START_BRIDGE.bat to match Windows Device Manager.

## Notes / troubleshooting

- This ESP32 is NOT a Windows second monitor. It is a dedicated miniature read-only combat display.
- Keep the USB cable attached; it provides both power and data. No hotspot, Wi-Fi, IP address, iPhone, spacedesk, cloud, or extra Python libraries for the bridge.
- USB WAIT means the ESP32 is powered but not receiving updates. Confirm the laptop start.bat server is running and START_BRIDGE.bat reports the expected COM port. Disconnect Arduino Serial Monitor if it holds that COM port.
- If the board displays a white/black screen or wrong colors, confirm that it is the CYD2USB ST7789 version with GPIO21 backlight and the pin mapping below; other CYD boards may use ILI9341 or different wiring.
- The small screen shows the beginning of long buff/debuff lists (up to two lines per side). The laptop retains all information. DM-private data, card artwork, HP/AC and monster statistics are not transmitted.
- All game state lives in the laptop app. Power-cycling the board doesn't erase the session; reopen the bridge to resume.

## Hardware profile

- Board ESP32-D0WD-V3 / 4MB flash
- TFT ST7789, 240 x 320 panel, rotation 3 (320 x 240 landscape), BGR color
- TFT SPI MISO 12, MOSI 13, SCLK 14, CS 15, DC 2, RST -1, backlight GPIO21
- Touch not used (existing touchscreen CS GPIO33 remains unused)
- USB serial 115200 baud, COM3 by default
- platformio.ini uses Arduino framework and TFT_eSPI.

## Wire format

DND1|round|name|rollTotal|rollFormula|buffs|debuffs

The PowerShell bridge reads the existing localhost /api/state approximately three times per second and sends a packet on changes (plus a two-second heartbeat). It does not change or expose the Python server to a network. No user input passes from the ESP32 to the DM app.
