#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "Adafruit_SGP30.h"
#include <stdlib.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Seeed_HM330X.h>

#define DHTPIN 16
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

int chk;
uint8_t buf[30];

const char* ssid = "EEES34-IOT";
const char* password = "@hsluIOT2019";
const char* mqtt_server = "192.168.22.77";
const char* mqtt_topic = "air/qual";
const int mqtt_port = 1883;

WiFiClient wifiClient;
PubSubClient client(wifiClient);
Adafruit_SGP30 sgp;
HM330X hm;

/* return absolute humidity [mg/m^3] with approximation formula
* @param temperature [°C]
* @param humidity [%RH]
*/
uint32_t getAbsoluteHumidity(float temperature, float humidity) {
    // approximation formula from Sensirion SGP30 Driver Integration chapter 3.15
    const float absoluteHumidity = 216.7f * ((humidity / 100.0f) * 6.112f * exp((17.62f * temperature) / (243.12f + temperature)) / (273.15f + temperature)); // [g/m^3]
    const uint32_t absoluteHumidityScaled = static_cast<uint32_t>(1000.0f * absoluteHumidity); // [mg/m^3]
    return absoluteHumidityScaled;
}

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
      //Once connected, publish an announcement...
      //client.publish("/icircuit/presence/ESP32/", "hello world");
      // ... and resubscribe
      //client.subscribe(mqtt_topic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void publishSerialData(char *serialData){
  if (!client.connected()) {
    reconnect();
  }
  client.publish(mqtt_topic, serialData);
}

int* parseResult(uint8_t* data) {
    int value[7];

    for (int i = 1; i < 8; i++) {
        value[i-1] = (uint16_t) data[i * 2] << 8 | data[i * 2 + 1];
    }
    return value;
}

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(500);
  //while (!Serial) { delay(10); } // Wait for serial console to open!

  if (! sgp.begin()){
    Serial.println("Sensor not found :(");
    while (1);
  }

  if(hm.init()) {
    Serial.println("HM3301 init failed, trying again");
  }
  
  // Set time out for 
  setupWifi();
  client.setServer(mqtt_server, mqtt_port);
  reconnect();

  dht.begin();
}

void loop() {
  // If you have a temperature / humidity sensor, you can set the absolute humidity to enable the humditiy compensation for the air quality signals
  float temperature = dht.readTemperature(); // [°C]
  float humidity = dht.readHumidity(); // [%RH]
  sgp.setHumidity(getAbsoluteHumidity(temperature, humidity));

  client.loop();
  
  DynamicJsonDocument data(1024);

  data["temperature"] = temperature;
  data["humidity"] = humidity;

  if (! sgp.IAQmeasure()) {
    Serial.println("Measurement failed");
    return;
  }
  data["TVOC"] = sgp.TVOC;
  data["eCO2"] = sgp.eCO2;
  
  //Serial.print("TVOC "); Serial.print(sgp.TVOC); Serial.print(" ppb\t");
  //Serial.print("eCO2 "); Serial.print(sgp.eCO2); Serial.println(" ppm");

  if (! sgp.IAQmeasureRaw()) {
    Serial.println("Raw Measurement failed");
    return;
  }
  data["rawH2"] = sgp.rawH2;
  data["rawEthanol"] = sgp.rawEthanol;
  //Serial.print("Raw H2 "); Serial.print(sgp.rawH2); Serial.print(" \t");
  //Serial.print("Raw Ethanol "); Serial.print(sgp.rawEthanol); Serial.println("");

  if (hm.read_sensor_value(buf, 29)) {
        Serial.println("HM330X read result failed!!");
  }

  int* pmRaw = parseResult(buf); 

  data["PM"]["SPM1.0"] = pmRaw[1];
  data["PM"]["SPM2.5"] = pmRaw[2];
  data["PM"]["SPM10"] = pmRaw[3];
  data["PM"]["AE1.0"] = pmRaw[4];
  data["PM"]["AE2.5"] = pmRaw[5];
  data["PM"]["AE10"] = pmRaw[6];

  //Publishing data to MQTT broker.
  char mun[501];
  memset(mun,0, 501);
  serializeJson(data, mun);
  publishSerialData(mun);

  delay(1000);
}
