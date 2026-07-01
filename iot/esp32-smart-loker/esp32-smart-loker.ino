#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <Adafruit_NeoPixel.h>

// Ganti sesuai jaringan dan alamat web kamu.
const char* WIFI_SSID = "Rafika Salon";
const char* WIFI_PASSWORD = "Neyzanf123";

// Jika ESP32 dan laptop satu jaringan, ganti IP dengan IP laptop.
// Contoh: http://192.168.1.10:3000
const char* WEB_BASE_URL = "http://192.168.1.34:3000";
const char* IOT_DEVICE_KEY = "ganti-dengan-token-rahasia";

#define PIN_NEOPIXEL 13
#define JUMLAH_PIXEL 4

#define PIN_SERVO_1 26
#define PIN_SERVO_2 27
#define PIN_SERVO_3 23
#define PIN_SERVO_4 25

#define PIN_RFID_SS 5
#define PIN_RFID_RST 22
#define PIN_RFID_SCK 18
#define PIN_RFID_MISO 19
#define PIN_RFID_MOSI 21

Adafruit_NeoPixel pixels(JUMLAH_PIXEL, PIN_NEOPIXEL, NEO_GRB + NEO_KHZ800);
MFRC522 rfid(PIN_RFID_SS, PIN_RFID_RST);

Servo servo1;
Servo servo2;
Servo servo3;
Servo servo4;
Servo* servos[] = {&servo1, &servo2, &servo3, &servo4};

unsigned long lastPoll = 0;
unsigned long lastRfidScan = 0;
String lastRfidUid = "";
const unsigned long POLL_INTERVAL_MS = 1500;
const unsigned long RFID_COOLDOWN_MS = 3000;

void setup() {
  Serial.begin(115200);

  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);

  servo1.setPeriodHertz(50);
  servo2.setPeriodHertz(50);
  servo3.setPeriodHertz(50);
  servo4.setPeriodHertz(50);

  servo1.attach(PIN_SERVO_1, 500, 2400);
  servo2.attach(PIN_SERVO_2, 500, 2400);
  servo3.attach(PIN_SERVO_3, 500, 2400);
  servo4.attach(PIN_SERVO_4, 500, 2400);

  for (int i = 0; i < 4; i++) {
    servos[i]->write(0);
  }

  pixels.begin();
  setSemuaMerah();

  SPI.begin(PIN_RFID_SCK, PIN_RFID_MISO, PIN_RFID_MOSI, PIN_RFID_SS);
  rfid.PCD_Init();
  Serial.println("RFID MFRC522 siap.");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Menghubungkan WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("--- Sistem Loker ESP32 Terhubung! ---");
  Serial.print("IP ESP32: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(1000);
    return;
  }

  if (millis() - lastPoll >= POLL_INTERVAL_MS) {
    lastPoll = millis();
    cekCommandDariWeb();
  }

  cekKartuRfid();
}

void cekCommandDariWeb() {
  HTTPClient http;
  String url = String(WEB_BASE_URL) + "/api/iot/commands?deviceKey=" + IOT_DEVICE_KEY;

  http.begin(url);
  int httpCode = http.GET();

  if (httpCode != 200) {
    Serial.printf("Gagal polling command. HTTP %d\n", httpCode);
    http.end();
    return;
  }

  String response = http.getString();
  http.end();

  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, response);

  if (error) {
    Serial.println("JSON command tidak valid.");
    return;
  }

  if (doc["command"].isNull()) {
    return;
  }

  String commandId = doc["command"]["id"].as<String>();
  String action = doc["command"]["action"].as<String>();
  int lockerNumber = doc["command"]["lockerNumber"].as<int>();
  int index = lockerNumber - 1;

  bool success = false;

  if (index >= 0 && index < 4) {
    if (action == "open") {
      bukaLoker(index);
      success = true;
    } else if (action == "close") {
      tutupLoker(index);
      success = true;
    }
  }

  selesaikanCommand(commandId, success);
}

void cekKartuRfid() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  String uid = bacaRfidUid();
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  unsigned long now = millis();
  if (uid == lastRfidUid && now - lastRfidScan < RFID_COOLDOWN_MS) {
    return;
  }

  lastRfidUid = uid;
  lastRfidScan = now;

  Serial.print("RFID terbaca: ");
  Serial.println(uid);
  kirimScanRfid(uid);
}

String bacaRfidUid() {
  String uid = "";

  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      uid += "0";
    }
    uid += String(rfid.uid.uidByte[i], HEX);
  }

  uid.toUpperCase();
  return uid;
}

void kirimScanRfid(String uid) {
  HTTPClient http;
  String url = String(WEB_BASE_URL) + "/api/iot/rfid-scan?deviceKey=" + IOT_DEVICE_KEY;

  StaticJsonDocument<128> doc;
  doc["rfidUid"] = uid;

  String body;
  serializeJson(doc, body);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(body);
  String response = http.getString();

  Serial.printf("Scan RFID HTTP %d\n", httpCode);
  if (response.length() > 0) {
    Serial.println(response);
  }

  http.end();
}

void bukaLoker(int index) {
  setSemuaMerah();
  pixels.setPixelColor(index, pixels.Color(0, 255, 0));
  pixels.show();

  servos[index]->write(180);
  Serial.printf("Loker %d terbuka.\n", index + 1);
}

void tutupLoker(int index) {
  servos[index]->write(0);
  pixels.setPixelColor(index, pixels.Color(255, 0, 0));
  pixels.show();

  Serial.printf("Loker %d tertutup.\n", index + 1);
}

void selesaikanCommand(String commandId, bool success) {
  HTTPClient http;
  String url = String(WEB_BASE_URL) + "/api/iot/commands?deviceKey=" + IOT_DEVICE_KEY;

  StaticJsonDocument<256> doc;
  doc["commandId"] = commandId;
  doc["success"] = success;
  if (!success) {
    doc["errorMessage"] = "Nomor loker atau action tidak valid.";
  }

  String body;
  serializeJson(doc, body);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(body);
  Serial.printf("Update command %s HTTP %d\n", commandId.c_str(), httpCode);

  http.end();
}

void setSemuaMerah() {
  for (int i = 0; i < JUMLAH_PIXEL; i++) {
    pixels.setPixelColor(i, pixels.Color(255, 0, 0));
  }
  pixels.show();
}
