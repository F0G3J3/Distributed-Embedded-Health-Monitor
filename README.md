# 🚀 Distributed Embedded Health Monitor (DEHM) 🚀

---

## 🌟 Overview

The **Distributed Embedded Health Monitor (DEHM)** is a powerful, full-stack solution designed to provide real-time and historical insights into the health and performance of your ESP32 embedded devices. Built for developers and IoT enthusiasts, DEHM offers a comprehensive dashboard to monitor critical metrics like **CPU usage**, **memory (heap & stack)**, and **task information**, alongside features for **remote firmware updates**.

This project demonstrates a robust architecture separating embedded firmware, backend data processing, and a user-friendly web interface, making it scalable and maintainable for monitoring multiple devices.

---

## ✨ Key Features

* **📈 Real-time & Historical Data:** Visualize live metrics and historical trends for various parameters.
* **🧠 Comprehensive Monitoring:** Track CPU usage, Free/Used Heap, Minimum Free Heap, Task Count, and Stack High Water Mark for your ESP32.
* **🌐 Web-based Dashboard:** Access device health information through a modern and responsive web interface from any browser.
* **🔄 Over-The-Air (OTA) Updates:** Update ESP32 firmware remotely via the backend server, eliminating the need for physical connection.
* **💾 Persistent Data Storage:** All metrics are stored in a **SQLite database** on the backend for long-term analysis and reporting.
* **⚙️ Scalable Architecture:** Designed to easily integrate and monitor multiple ESP32 devices.
* **🛠️ Tech Stack:** Crafted with **C++** for embedded, **Python (Flask)** for the backend, and **HTML/CSS/JavaScript (Chart.js)** for the frontend.

---

## 📂 Project Structure

The project is divided into logical components for clarity and modularity:

Distributed-Embedded-Health-Monitor/
├── esp32_firmware/           # ESP32 C++ firmware code
│   ├── src/
│   │   └── main.cpp          # Main firmware application
│   └── platformio.ini        # PlatformIO project configuration
├── python_backend/           # Python Flask backend server
│   ├── app.py                # Flask application, API endpoints, and OTA server
│   ├── database.py           # SQLAlchemy database models and setup
│   ├── requirements.txt      # Python dependencies
│   └── data/                 # Directory for SQLite database file
│       └── health_monitor.db
├── web_frontend/             # Web-based user interface
│   ├── index.html            # Main dashboard HTML
│   ├── css/
│   │   └── style.css         # CSS stylesheets for UI
│   └── js/
│       └── script.js         # JavaScript for data fetching, charts, and interactivity
├── README.md                 # This file
└── INSTALL.md                # Detailed installation and setup guide

---

## 🚀 Getting Started

To get started with DEHM, please refer to the comprehensive **[INSTALL.md](INSTALL.md)** guide. This document provides step-by-step instructions for setting up the Python backend, configuring and flashing the ESP32 firmware, and accessing the web frontend.

---

## 💡 Usage

* **Live Metrics:** The top section of the dashboard displays the most recent data received for the selected device.
* **Historical Data:** CPU and Heap usage are visualized over time in interactive charts. A raw data log table provides granular details.
* **Device Selector:** If you have multiple ESP32s sending data with unique `device_id`s, you can select them from the dropdown menu to view their respective metrics.
* **Load More:** Click the "Load More" button in the historical data section to retrieve older data entries.

---

## 🔄 OTA (Over-The-Air) Updates

DEHM supports seamless OTA firmware updates for your ESP32 devices, managed by the backend server. The detailed steps for performing OTA updates are also covered in the **[INSTALL.md](INSTALL.md)** guide.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

* If you have suggestions, find a bug, or want to add a feature, please feel free to open an issue or submit a pull request.
* For major changes, please open an issue first to discuss what you would like to change.

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.

---

Made with ❤️ by **Dr.exnon**