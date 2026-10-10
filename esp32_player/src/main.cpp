// DND Cellphone Helper - USB player-only display for CYD2USB ST7789.
// Incoming line: DND1|round|actor|rollTotal|rollFormula|buffs|debuffs
// All state comes from the laptop's localhost app via COM3; no Wi-Fi required.
#include <Arduino.h>
#include <TFT_eSPI.h>

static TFT_eSPI tft;
static String serialLine;
static String lastFrame;
static String roundText = "1";
static String actorName = "READY";
static String rollTotal = "--";
static String rollFormula = "Waiting for a roll";
static String buffs = "-";
static String debuffs = "-";
static unsigned long lastMessageMs = 0;
static bool connected = false;
static constexpr uint16_t BG = 0x0842;
static constexpr uint16_t PANEL = 0x1084;
static constexpr uint16_t PALE = 0xD6BA;
static constexpr uint16_t GREEN = 0x5ECF;
static constexpr uint16_t RED = 0xFB0C;
static constexpr uint16_t YELLOW = 0xFF4B;

static String fitToWidth(String input, int pixels, int font) {
  input.trim();
  if (input.isEmpty()) return "-";
  while (input.length() > 1 && tft.textWidth(input, font) > pixels) {
    input.remove(input.length() - 1);
  }
  return input;
}

static void drawHeader(bool live) {
  const int w = tft.width();
  tft.fillRect(0, 0, w, 24, PANEL);
  tft.setTextColor(TFT_WHITE, PANEL);
  tft.drawString("D&D PLAYER DISPLAY", 8, 5, 2);
  tft.setTextColor(live ? GREEN : RED, PANEL);
  tft.drawRightString(live ? "USB LIVE" : "USB WAIT", w - 7, 5, 2);
}

static void drawStatusBox(int x, int y, int w, int h, const String& title,
                          const String& value, uint16_t titleColor) {
  tft.fillRoundRect(x, y, w, h, 5, PANEL);
  tft.setTextColor(titleColor, PANEL);
  tft.drawString(title, x + 5, y + 3, 2);
  String data = value;
  data.trim();
  if (data.isEmpty()) data = "-";
  // Two compact lines; the newest full effects stay in the laptop app.
  const int maxWidth = w - 10;
  String first = fitToWidth(data, maxWidth, 2);
  tft.setTextColor(TFT_WHITE, PANEL);
  tft.drawString(first, x + 5, y + 20, 2);
  if (data.length() > first.length()) {
    String remaining = data.substring(first.length());
    remaining.trim();
    tft.drawString(fitToWidth(remaining, maxWidth, 2), x + 5, y + 36, 2);
  }
}

static void drawFrame() {
  const int w = tft.width();
  const int h = tft.height();
  tft.fillScreen(BG);
  drawHeader(connected);

  tft.setTextColor(PALE, BG);
  tft.drawString("CURRENT TURN  /  ROUND " + roundText, 9, 29, 2);
  tft.setTextColor(TFT_WHITE, BG);
  String shownActor = fitToWidth(actorName, w - 18, 4);
  tft.drawCentreString(shownActor, w / 2, 47, 4);

  tft.drawFastHLine(8, 79, w - 16, PANEL);
  tft.setTextColor(PALE, BG);
  tft.drawCentreString("LATEST DICE ROLL", w / 2, 85, 2);
  tft.setTextColor(YELLOW, BG);
  const int numberFont = tft.textWidth(rollTotal, 6) <= w - 20 ? 6 : 4;
  tft.drawCentreString(fitToWidth(rollTotal, w - 18, numberFont), w / 2, 104, numberFont);
  tft.setTextColor(TFT_WHITE, BG);
  tft.drawCentreString(fitToWidth(rollFormula, w - 18, 2), w / 2, 157, 2);

  const int gap = 6;
  const int colW = (w - 18 - gap) / 2;
  const int statusY = h - 61;
  drawStatusBox(6, statusY, colW, 55, "BUFFS", buffs, GREEN);
  drawStatusBox(12 + colW, statusY, colW, 55, "DEBUFFS", debuffs, RED);
}

static void parseFrame(const String& line) {
  if (!line.startsWith("DND1|")) return;
  lastMessageMs = millis();
  bool wasConnected = connected;
  connected = true;
  if (line == lastFrame && wasConnected) return;
  String fields[7];
  int pos = 0;
  for (int i = 0; i < 6; ++i) {
    int next = line.indexOf('|', pos);
    if (next < 0) return;
    fields[i] = line.substring(pos, next);
    pos = next + 1;
  }
  fields[6] = line.substring(pos);
  if (fields[0] != "DND1") return;
  roundText = fields[1];
  actorName = fields[2];
  rollTotal = fields[3];
  rollFormula = fields[4];
  buffs = fields[5];
  debuffs = fields[6];
  lastFrame = line;
  drawFrame();
}

void setup() {
  Serial.begin(115200);
  serialLine.reserve(460);
  pinMode(21, OUTPUT);
  digitalWrite(21, HIGH);
  tft.init();
  tft.setRotation(3);
  digitalWrite(21, HIGH);
  drawFrame();
}

void loop() {
  while (Serial.available()) {
    const char c = static_cast<char>(Serial.read());
    if (c == '\n') {
      serialLine.trim();
      parseFrame(serialLine);
      serialLine = "";
    } else if (c == '\r') {
      continue;
    } else if (serialLine.length() < 450) {
      serialLine += c;
    } else {
      serialLine = "";
    }
  }
  if (connected && millis() - lastMessageMs > 5500UL) {
    connected = false;
    drawHeader(false);
  }
  delay(5);
}
