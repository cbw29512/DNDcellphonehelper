# DND Cellphone Helper — local control station

Portable, offline-capable D&D dice and initiative display. Built for a Windows laptop and an iPhone 16 Pro used as a **wired spacedesk second monitor**. No external Python packages, logins, Netlify, or internet connection during play.

## V2 — card-first DM interface

- Quick-roll buttons for d4, d6, d8, d10, d12, d20 and d100. Enter a quantity and modifier once, then click a die; separate instant ADV d20 and DIS d20 buttons. Uses the unchanged cryptographic `getRandomValues()`/rejection-sampling dice engine.
- Add hero or monster initiative cards. Drag their handles to reorder, or click arrow controls. Click any card to make it the current turn and use NEXT/PREV to advance through the manual order.
- Drag a preset buff or debuff onto **any** card. Alternatively, click a preset to toggle it on the selected card; custom effects can also be applied. Remove an active status by clicking its pill on the card.
- Player display still shows only the latest completed roll, current combatant, and that combatant's buffs (left) and debuffs (right). Full-screen display stays unchanged until the next update.
- Existing saved V1 sessions load with their original combatants and status effects; cards default to Hero if the old data did not contain a card type.

## Run on Windows

1. Install Python 3 (already available if `py --version` works).
2. Download/clone this repository and double-click **`start.bat`**. Windows might ask for permission to open Python.
3. The DM controller opens at **http://127.0.0.1:8765/**.
4. Connect the iPhone to spacedesk over USB, and set Windows displays to **Extend** (`Win+P`).
5. Click **Open Player Display**. Move that window onto the iPhone extended display **once**, and press **F11** to fill its screen. Leave the compact controller on the laptop.
6. Roll dice, add combatants, move names with the arrows, use NEXT/PREV, and add/remove buffs or debuffs on the laptop. The player window updates automatically.

**Note:** The connected iPhone is a Windows second display through spacedesk, *not* a Safari browser connecting by USB. Without spacedesk, both windows can still be tested on the laptop. The player view never shows DM editing controls.

## Dice fairness

The dice engine uses the same cryptographic Web Crypto `getRandomValues` plus rejection-sampling algorithm as the **CUSTOM** dice in Nothing But a Dice Roller (`cbw29512/nothingbutadiceroller`), eliminating modulo bias. Regular and custom numeric dice are secure, **not** 3D simulated physical dice. Supports up to 30 dice per roll (`NdS±modifier`), d2 through d1,000,000; advantage/disadvantage for 1d20. The saved roll is exactly what the player display shows.

## Architecture and data

- **Server:** Python standard library `http.server` bound to `127.0.0.1:8765` only (never exposed to the seminar Wi-Fi).
- **DM view:** `/` runs Web Crypto rolls and edits a single canonical session state.
- **Player:** `/player` polls `/api/state` every 300 ms; independently flashes new roll/turn/effects and holds each until changed.
- **Persistence:** `%LOCALAPPDATA%\DNDcellphonehelper\session.json` written atomically.
- **State schema:** `{version:1, round:int, activeId:string|null, combatants:[{id,name,kind:"player"|"monster",buffs:[string],debuffs:[string]}], lastRoll:{formula,detail,total}|null}`. Initiative order is array order, not initiative numbers.
- No remote connection; network requests are loopback-only. The site uses `http://127.0.0.1` because Web Crypto works on trustworthy localhost origins.

## Tests

From this folder: `py -3 -m unittest discover -s tests -v`. Requires no dependencies. Browser/USB end-to-end verification is still required on the actual laptop and iPhone.

## Security/limitations

Only launch this software from a trusted repository copy. The HTTP service is local to the laptop. Other software on your Windows account could contact localhost; the app is intended for trusted single-user desktops. It isn't a multiplayer cloud server. If you edit the same session concurrently in two DM tabs, the last saved edit wins; use one DM controller window. All content is user-entered and displayed as text, never HTML. The player's iPhone display stays awake according to the iOS/spacedesk power and screen settings.
