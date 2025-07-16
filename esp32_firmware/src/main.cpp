#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // For JSON serialization
#include <Update.h>      // For OTA updates

// --- WiFi Configuration ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// --- Backend Server Configuration ---
// IMPORTANT: Replace with your actual backend server IP and port
const char* backendHost = "YOUR_BACKEND_SERVER_IP_OR_HOSTNAME"; // e.g., "192.168.1.100" or "mybackend.com"
const int backendPort = 5000; // Default Flask port
const char* dataEndpoint = "/api/data";
const char* otaEndpoint = "/ota";

// --- Device ID (Unique for each ESP32) ---
// You can use MAC address or a custom ID
const char* deviceId = "ESP32_DEV_001"; // Change for each device

// --- Reporting Interval ---
const long reportIntervalMs = 10000; // Report every 10 seconds
unsigned long lastReportTime = 0;

// --- Function Prototypes ---
void connectToWiFi();
void sendHealthData();
void performOtaUpdate();

void setup() {
    Serial.begin(115200);
    Serial.println("\nBooting up Distributed Embedded Health Monitor...");

    connectToWiFi();

    // Initialize lastReportTime to ensure immediate first report
    lastReportTime = millis() - reportIntervalMs;
}

void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected. Reconnecting...");
        connectToWiFi();
    }

    // Check for OTA updates periodically (e.g., every 5 minutes)
    if (millis() - lastReportTime > 300000) { // Check every 5 minutes
        performOtaUpdate();
    }

    if (millis() - lastReportTime >= reportIntervalMs) {
        sendHealthData();
        lastReportTime = millis();
    }
}

void connectToWiFi() {
    Serial.print("Connecting to WiFi: ");
    Serial.println(ssid);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
}

void sendHealthData() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        String serverPath = String("http://") + backendHost + ":" + String(backendPort) + dataEndpoint;
        http.begin(serverPath);
        http.addHeader("Content-Type", "application/json");

        // Prepare JSON payload
        StaticJsonDocument<256> doc; // Adjust size as needed
        doc["device_id"] = deviceId;
        doc["cpu_usage"] = random(20, 80); // Simulate CPU usage
        doc["heap_free"] = ESP.getFreeHeap();
        doc["min_heap_free"] = ESP.getMinFreeHeap();
        doc["task_count"] = uxTaskGetNumberOfTasks();
        // Simulate Stack High Water Mark for a dummy task (replace with actual task monitoring if needed)
        doc["stack_hwm"] = random(1000, 5000); // Dummy value, in a real scenario, you'd track specific tasks

        String requestBody;
        serializeJson(doc, requestBody);

        Serial.print("Sending data to backend: ");
        Serial.println(requestBody);

        int httpResponseCode = http.POST(requestBody);

        if (httpResponseCode > 0) {
            Serial.printf("HTTP Response code: %d\n", httpResponseCode);
            String response = http.getString();
            Serial.println(response);
        } else {
            Serial.printf("HTTP Error: %s\n", http.errorToString(httpResponseCode).c_str());
        }
        http.end();
    } else {
        Serial.println("Cannot send data, WiFi not connected.");
    }
}

void performOtaUpdate() {
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("Checking for OTA update...");
        HTTPClient http;
        String otaUrl = String("http://") + backendHost + ":" + String(backendPort) + otaEndpoint;
        http.begin(otaUrl);

        int httpCode = http.GET();
        if (httpCode == HTTP_CODE_OK) {
            int contentLength = http.getSize();
            Serial.printf("OTA update available. Content length: %d\n", contentLength);

            bool canStartUpdate = Update.begin(contentLength);
            if (canStartUpdate) {
                WiFiClient* client = http.getStreamPtr();
                size_t written = Update.writeStream(*client);

                if (written == contentLength) {
                    Serial.println("Written : " + String(written) + " successfully");
                } else {
                    Serial.println("Written only : " + String(written) + "/" + String(contentLength) + ". Retry?");
                }

                if (Update.end(true)) { // true to set the size to the current progress
                    Serial.println("OTA update finished successfully. Restarting...");
                    ESP.restart();
                } else {
                    Serial.printf("OTA update failed: %s\n", Update.errorString());
                }
            } else {
                Serial.println("Not enough space to begin OTA update.");
            }
        } else if (httpCode == HTTP_CODE_NOT_FOUND) {
            Serial.println("No OTA update available.");
        } else {
            Serial.printf("OTA update check failed. HTTP Code: %d\n", httpCode);
        }
        http.end();
    } else {
        Serial.println("Cannot check for OTA, WiFi not connected.");
    }
}
