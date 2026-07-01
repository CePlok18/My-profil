#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <Adafruit_NeoPixel.h>

// WiFi
const char* WIFI_SSID = "GREEN KOST";
const char* WIFI_PASSWORD = "0sampai1";

// Web API untuk pendaftaran dan validasi kartu RFID.
// Ganti IP dengan alamat laptop/server web pada jaringan yang sama.
const char* WEB_BASE_URL = "http://192.168.1.34:3000";
const char* IOT_DEVICE_KEY = "ganti-dengan-token-rahasia";

// MQTT
// Untuk broker TLS seperti HiveMQ Cloud/EMQX Cloud gunakan port 8883.
// Untuk Mosquitto lokal tanpa TLS, gunakan WiFiClient biasa dan port 1883.
const char* MQTT_HOST = "broker-host";
const int MQTT_PORT = 8883;
const char* MQTT_USERNAME = "username";
const char* MQTT_PASSWORD = "password";
const char* MQTT_TOPIC_PREFIX = "smart-loker";

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

WiFiClientSecure wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastRfidScan = 0;
String lastRfidUid = "";
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

  konekWiFi();

  // Untuk uji cepat TLS tanpa sertifikat CA.
  // Untuk produksi, gunakan wifiClient.setCACert(root_ca).
  wifiClient.setInsecure();

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    konekWiFi();
  }

  if (!mqttClient.connected()) {
    konekMQTT();
  }

  mqttClient.loop();
  cekKartuRfid();
}

void konekWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Menghubungkan WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("WiFi terhubung. IP: ");
  Serial.println(WiFi.localIP());
}

void konekMQTT() {
  while (!mqttClient.connected()) {
    String clientId = "esp32-smart-loker-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    Serial.print("Menghubungkan MQTT...");

    if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println("terhubung.");
      subscribeCommandTopics();
    } else {
      Serial.print("gagal, rc=");
      Serial.println(mqttClient.state());
      delay(3000);
    }
  }
}

void subscribeCommandTopics() {
  for (int i = 1; i <= 4; i++) {
    String topic = String(MQTT_TOPIC_PREFIX) + "/command/loker-" + String(i);
    mqttClient.subscribe(topic.c_str(), 1);
    Serial.print("Subscribe: ");
    Serial.println(topic);
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String message;

  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Pesan MQTT dari ");
  Serial.print(topic);
  Serial.print(": ");
  Serial.println(message);

  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.println("JSON MQTT tidak valid.");
    return;
  }

  String commandId = doc["commandId"] | "";
  String command = doc["command"] | "";
  int lockerNumber = doc["lockerNumber"] | 0;
  int index = lockerNumber - 1;
  bool success = false;

  if (index >= 0 && index < 4) {
    if (command == "open") {
      bukaLoker(index);
      success = true;
    } else if (command == "close") {
      tutupLoker(index);
      success = true;
    }
  }

  publishStatus(commandId, lockerNumber, command, success);
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

void kirimScanRfid(const String& uid) {
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

  if (httpCode < 200 || httpCode >= 300) {
    return;
  }

  StaticJsonDocument<512> responseDoc;
  DeserializationError error = deserializeJson(responseDoc, response);

  if (error || responseDoc["command"].isNull()) {
    // Respons enrollment kartu memang tidak memiliki command loker.
    return;
  }

  String commandId = responseDoc["commandId"] | "";
  String command = responseDoc["command"] | "";
  int lockerNumber = responseDoc["lockerNumber"] | 0;
  int index = lockerNumber - 1;
  bool success = false;

  if (index >= 0 && index < 4) {
    if (command == "open") {
      bukaLoker(index);
      success = true;
    } else if (command == "close") {
      tutupLoker(index);
      success = true;
    }
  }

  selesaikanCommandHttp(commandId, success);
}

void selesaikanCommandHttp(const String& commandId, bool success) {
  if (commandId.isEmpty()) {
    return;
  }

  HTTPClient http;
  String url = String(WEB_BASE_URL) + "/api/iot/commands?deviceKey=" + IOT_DEVICE_KEY;

  StaticJsonDocument<256> doc;
  doc["commandId"] = commandId;
  doc["success"] = success;
  if (!success) {
    doc["errorMessage"] = "Nomor loker atau command RFID tidak valid.";
  }

  String body;
  serializeJson(doc, body);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(body);
  Serial.printf("Update command RFID %s HTTP %d\n", commandId.c_str(), httpCode);

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

void publishStatus(String commandId, int lockerNumber, String command, bool success) {
  String topic = String(MQTT_TOPIC_PREFIX) + "/status/loker-" + String(lockerNumber);

  StaticJsonDocument<256> doc;
  doc["commandId"] = commandId;
  doc["lockerNumber"] = lockerNumber;
  doc["command"] = command;
  doc["success"] = success;
  doc["status"] = success ? "processed" : "failed";

  String body;
  serializeJson(doc, body);

  mqttClient.publish(topic.c_str(), body.c_str(), true);

  Serial.print("Publish status: ");
  Serial.println(body);
}

void setSemuaMerah() {
  for (int i = 0; i < JUMLAH_PIXEL; i++) {
    pixels.setPixelColor(i, pixels.Color(255, 0, 0));
  }
  pixels.show();
}
