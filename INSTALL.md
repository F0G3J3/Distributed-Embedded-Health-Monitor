# ⚙️ DEHM Installation & Setup Guide

This document provides a comprehensive, step-by-step guide to set up and run the Distributed Embedded Health Monitor (DEHM).

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

* **Python 3.x:** [Download Python](https://www.python.org/downloads/)
* **PlatformIO IDE (Recommended):** [Install PlatformIO](https://platformio.org/install/ide) (or Arduino IDE with ESP32 board support)
* **Git:** [Download Git](https://git-scm.com/downloads)

---

## 1. Clone the Repository

Start by cloning this project to your local machine:

```bash
git clone [https://github.com/F0G3J3/Distributed-Embedded-Health-Monitor.git](https://github.com/F0G3J3/Distributed-Embedded-Health-Monitor.git)
cd Distributed-Embedded-Health-Monitor

(Remember to replace DrF0G3J3 with your actual GitHub username if you've forked the repository)
2. Set Up the Python Backend
The Python backend (Flask) is responsible for receiving health data from ESP32 devices, storing it in a SQLite database, serving the web frontend, and managing OTA firmware updates.
A. Install Dependencies
 * Navigate to the backend directory:
   cd python_backend

 * Create a Python virtual environment (recommended for dependency isolation):
   python -m venv venv
# On Windows (Command Prompt/PowerShell):
.\venv\Scripts\activate
# On macOS/Linux (Bash/Zsh):
source venv/bin/activate

 * Install the required Python packages:
   pip install -r requirements.txt

B. Prepare OTA Firmware File
For the Over-The-Air (OTA) update feature to work, you need to compile your ESP32 firmware (see next section) and make the resulting binary file (firmware.bin) accessible to the Flask backend.
 * Compile your ESP32 firmware first (follow Section 3 below to compile).
 * After successful compilation, locate the firmware.bin file.
   * PlatformIO: Typically found in .pio/build/<your_board_env>/firmware.bin (e.g., .pio/build/esp32dev/firmware.bin) within your esp32_firmware project directory.
   * Arduino IDE: Usually found in a temporary build folder, it's easier to export the compiled binary: Sketch > Export compiled Binary. It will be saved next to your .ino file.
 * Copy the firmware.bin file into the designated OTA path:
   * Create the target directory: Go back to your main project root (Distributed-Embedded-Health-Monitor). Create the path esp32_firmware/build/esp32dev/ if it doesn't already exist.
   * Copy firmware.bin: Copy your compiled firmware.bin file into the Distributed-Embedded-Health-Monitor/esp32_firmware/build/esp32dev/ directory.
 * Verify OTA_FIRMWARE_PATH in app.py:
   * Open python_backend/app.py.
   * Ensure the OTA_FIRMWARE_PATH variable (around line 20) correctly points to your firmware.bin file relative to the app.py script. The default path provided in app.py os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'esp32_firmware', 'build', 'esp32dev', 'firmware.bin') assumes you copy the firmware.bin to esp32_firmware/build/esp32dev/.
C. Run the Flask Backend Server
 * Ensure your virtual environment is active (from step 2A).
 * From the python_backend directory, run the Flask application:
   python app.py

 * You should see output similar to * Running on http://0.0.0.0:5000/.
   * Note the IP address (e.g., 192.168.1.100) and port (e.g., 5000) displayed. This is your backend server's address. You'll need it for configuring the ESP32 firmware and accessing the web frontend.
   * The health_monitor.db SQLite database file will be automatically created in the python_backend/data/ directory upon the first run.
3. Set Up the ESP32 Firmware
This code runs on your ESP32 board, collects system metrics, and sends them to your running Python backend.
A. Open the Firmware Project
 * Open the esp32_firmware project in your IDE:
   * With PlatformIO (VS Code): Go to File > Open Folder... and select the Distributed-Embedded-Health-Monitor/esp32_firmware directory.
   * With Arduino IDE: Go to File > Open... and select the Distributed-Embedded-Health-Monitor/esp32_firmware/src/main.cpp file.
     * Important for Arduino IDE: You must rename main.cpp to esp32_firmware.ino and move it directly into the Distributed-Embedded-Health-Monitor/esp32_firmware/ folder for Arduino IDE to recognize it as a sketch.
B. Configure WiFi & Backend Connection
 * Open esp32_firmware/src/main.cpp (or esp32_firmware.ino if using Arduino IDE).
 * Update WiFi Credentials:
   const char* ssid = "YOUR_WIFI_SSID";         // Replace with your WiFi network SSID
const char* password = "YOUR_WIFI_PASSWORD"; // Replace with your WiFi network password

 * Update Backend Server Host:
   const char* backendHost = "YOUR_BACKEND_SERVER_IP_OR_HOSTNAME"; // e.g., "192.168.1.100"
const int backendPort = 5000;                                 // Default Flask port

   * Crucially, YOUR_BACKEND_SERVER_IP_OR_HOSTNAME must be the actual IP address or hostname of the machine running your Python backend server.
 * Set a Unique Device ID:
   const char* deviceId = "ESP32_DEV_001"; // Assign a unique ID for this specific ESP32 board

   * If you plan to monitor multiple ESP32s, ensure each has a unique deviceId.
C. Install Required Libraries (for Arduino IDE)
If you are using Arduino IDE, you need to manually install these libraries via the Library Manager:
 * Go to Sketch > Include Library > Manage Libraries...
 * Search for and install:
   * ArduinoJson
   * HTTPClient (usually built-in, but ensure it's available)
   * Update (usually built-in, but ensure it's available)
   * WiFi (built-in)
D. Select Board and Port
 * Connect your ESP32 board to your computer via USB.
 * In your IDE:
   * Go to Tools > Board and select your specific ESP32 development board (e.g., ESP32 Dev Module).
   * Go to Tools > Port and select the serial port assigned to your ESP32.
E. Compile and Upload Firmware
 * Compile the firmware:
   * PlatformIO: Click the "Build" (check mark) icon in the PlatformIO toolbar.
   * Arduino IDE: Click the "Verify" (check mark) button.
 * Upload the firmware to your ESP32:
   * PlatformIO: Click the "Upload" (right arrow) icon in the PlatformIO toolbar.
   * Arduino IDE: Click the "Upload" (right arrow) button.
 * Monitor Output: Open the Serial Monitor (Baud Rate: 115200) to observe the ESP32's connection status and data sending logs. Ensure it connects to your WiFi and starts sending data to the backend.
4. Access the Web Frontend
The web dashboard is served directly by your running Python backend server.
 * Ensure your Python backend server is running (from Section 2C).
 * Open your preferred web browser.
 * Navigate to the backend's address:
   * If the backend is running on the same machine as your browser: http://localhost:5000/
   * If the backend is on a different machine on your local network: http://YOUR_BACKEND_SERVER_IP_OR_HOSTNAME:5000/
   * Important: Verify that the BACKEND_URL in web_frontend/js/script.js matches the exact address of your running Flask backend server for correct data fetching.
 * The DEHM dashboard should load. As your ESP32 devices send data to the backend, the information will appear in real-time on the dashboard, including live metrics, historical charts, and raw data logs. Use the device selector to switch between different connected ESP32s.
OTA (Over-The-Air) Update Process
Once the DEHM system is fully operational, you can perform firmware updates on your ESP32 devices remotely without needing a USB connection.
 * Develop and Compile New Firmware: Make changes to your ESP32 firmware code and compile it in PlatformIO or Arduino IDE to generate a new firmware.bin file.
 * Replace Existing Firmware Binary: Copy this newly compiled firmware.bin file to the location specified by OTA_FIRMWARE_PATH in your python_backend/app.py script. This will overwrite the old firmware file.
 * Automatic Update: Your ESP32 devices are programmed to periodically check the backend for new firmware. Upon detecting a newer version, they will automatically download and install it, then restart with the updated firmware.