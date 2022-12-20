#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <PubSubClient.h>
#include <Seeed_HM330X.h>
#include <WiFi.h>
#include <Wire.h>
#include <stdlib.h>

#include "Adafruit_SGP30.h"

#define DHTPIN 16
#define DHTTYPE DHT22

uint8_t pmBuffer[30];

const char* ssid = "EEES34-IOT";
const char* password = "@hsluIOT2019";
const char* mqtt_server = "192.168.22.77";
const char* mqtt_topic = "air/qual";
const int mqtt_port = 1883;

WiFiClient wifiClient;
PubSubClient client(wifiClient);
DHT dht(DHTPIN, DHTTYPE);
Adafruit_SGP30 sgp;
HM330X hm;

/* return absolute humidity [mg/m^3] with approximation formula
 * @param temperature [°C]
 * @param humidity [%RH]
 */
uint32_t getAbsoluteHumidity(float temperature, float humidity) {
  // approximation formula from Sensirion SGP30 Driver Integration chapter 3.15
  const float absoluteHumidity =
      216.7f * ((humidity / 100.0f) * 6.112f *
                exp((17.62f * temperature) / (243.12f + temperature)) /
                (273.15f + temperature));  // [g/m^3]
  const uint32_t absoluteHumidityScaled =
      static_cast<uint32_t>(1000.0f * absoluteHumidity);  // [mg/m^3]
  return absoluteHumidityScaled;
}

/**
 * Attempts to connect to the wifi based on the credentials.
 */
void setupWifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  randomSeed(micros());
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

/**
 * Attemps to connect to the MQTT server if it isn't already.
 */
void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Create a random client ID
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      // Once connected, publish an announcement...
      // client.publish("/icircuit/presence/ESP32/", "hello world");
      //  ... and resubscribe
      // client.subscribe(mqtt_topic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

/**
 * Checks for MQTT connection and publishes the given char data via the client.
 */
void publishSerialData(char* serialData) {
  if (!client.connected()) {
    reconnect();
  }
  client.publish(mqtt_topic, serialData);
}

/**
 * Parses PM data from raw data from the HM3301 sensor.
 */
int* parseResult(uint8_t* data, int* toParse) {
  for (int i = 1; i < 8; i++) {
    toParse[i - 1] = (uint16_t)data[i * 2] << 8 | data[i * 2 + 1];
  }
  return toParse;
}

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(500);
  // while (!Serial) { delay(10); } // Wait for serial console to open!

  if (!sgp.begin()) {
    Serial.println("Sensor not found :(");
    while (1)
      ;
  }

  if (hm.init()) {
    Serial.println("HM3301 init failed, trying again");
  }

  // Set time out for
  setupWifi();
  client.setServer(mqtt_server, mqtt_port);
  reconnect();

  dht.begin();
}

void loop() {
  // If you have a temperature / humidity sensor, you can set the absolute
  // humidity to enable the humditiy compensation for the air quality signals
  float temperature = dht.readTemperature();  // [°C]
  float humidity = dht.readHumidity();        // [%RH]
  sgp.setHumidity(getAbsoluteHumidity(temperature, humidity));

  client.loop();

  DynamicJsonDocument jsonData(1024);

  jsonData["temperature"] = temperature;
  jsonData["humidity"] = humidity;
  // TVOC and eCO2 read and add
  if (!sgp.IAQmeasure()) {
    Serial.println("Measurement failed");
    return;
  }
  jsonData["TVOC"] = sgp.TVOC;
  jsonData["eCO2"] = sgp.eCO2;

  // Serial.print("TVOC "); Serial.print(sgp.TVOC); Serial.print(" ppb\t");
  // Serial.print("eCO2 "); Serial.print(sgp.eCO2); Serial.println(" ppm");

  // Raw H2 and ethanol concentration read and add to JSON.
  if (!sgp.IAQmeasureRaw()) {
    Serial.println("Raw Measurement failed");
    return;
  }
  jsonData["rawH2"] = sgp.rawH2;
  jsonData["rawEthanol"] = sgp.rawEthanol;
  // Serial.print("Raw H2 "); Serial.print(sgp.rawH2); Serial.print(" \t");
  // Serial.print("Raw Ethanol "); Serial.print(sgp.rawEthanol);
  // Serial.println("");

  // HM3301 data read, parse and add to JSON
  if (hm.read_sensor_value(pmBuffer, 29)) {
    Serial.println("HM330X read result failed!!");
  }

  int pmRaw[7];
  parseResult(pmBuffer, pmRaw);

  jsonData["PM"]["SPM1.0"] = pmRaw[1];
  jsonData["PM"]["SPM2.5"] = pmRaw[2];
  jsonData["PM"]["SPM10"] = pmRaw[3];
  jsonData["PM"]["AE1.0"] = pmRaw[4];
  jsonData["PM"]["AE2.5"] = pmRaw[5];
  jsonData["PM"]["AE10"] = pmRaw[6];

  // Publishing data to MQTT broker.
  char mqttData[501];
  memset(mqttData, 0, 501);
  serializeJson(jsonData, mqttData);
  publishSerialData(mqttData);

  delay(30000);
}
