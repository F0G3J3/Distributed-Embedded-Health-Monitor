from flask import Flask, request, jsonify, send_from_directory
from database import db, HealthData, init_db
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__, static_folder='../web_frontend', static_url_path='/')

# --- Database Configuration ---
# Ensure the 'data' directory exists
data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
os.makedirs(data_dir, exist_ok=True)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(data_dir, "health_monitor.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

init_db(app)

# --- OTA Firmware Path ---
# Place your compiled .bin firmware file here for OTA updates
# Example: esp32_firmware/build/esp32dev/firmware.bin
OTA_FIRMWARE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'esp32_firmware', 'build', 'esp32dev', 'firmware.bin')
# IMPORTANT: You need to compile your ESP32 firmware and place the .bin file at this path.
# For PlatformIO, after building, the .bin file is typically found in .pio/build/<board_env>/firmware.bin
# You might need to manually copy it to the specified OTA_FIRMWARE_PATH or adjust the path.


@app.route('/')
def serve_index():
    """Serves the main HTML page."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/data', methods=['POST'])
def receive_health_data():
    """Receives health data from ESP32 devices."""
    if not request.is_json:
        logging.warning("Received non-JSON request.")
        return jsonify({"message": "Request must be JSON"}), 400

    data = request.get_json()
    logging.info(f"Received data: {data}")

    required_fields = ["device_id", "cpu_usage", "heap_free", "min_heap_free", "task_count", "stack_hwm"]
    if not all(field in data for field in required_fields):
        logging.warning(f"Missing fields in data: {data}")
        return jsonify({"message": "Missing required fields"}), 400

    try:
        new_data = HealthData(
            device_id=data['device_id'],
            cpu_usage=data['cpu_usage'],
            heap_free=data['heap_free'],
            min_heap_free=data['min_heap_free'],
            task_count=data['task_count'],
            stack_hwm=data['stack_hwm']
        )
        db.session.add(new_data)
        db.session.commit()
        logging.info(f"Data saved for device: {data['device_id']}")
        return jsonify({"message": "Data received and saved successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error saving data: {e}")
        return jsonify({"message": "Error saving data", "error": str(e)}), 500

@app.route('/api/data/<device_id>', methods=['GET'])
def get_device_data(device_id):
    """Retrieves all health data for a specific device."""
    data = HealthData.query.filter_by(device_id=device_id).order_by(HealthData.timestamp.asc()).all()
    if not data:
        return jsonify({"message": "No data found for this device"}), 404
    return jsonify([d.to_dict() for d in data]), 200

@app.route('/api/latest_data', methods=['GET'])
def get_latest_data_all_devices():
    """Retrieves the latest health data for all unique devices."""
    # Subquery to get the max timestamp for each device_id
    subquery = db.session.query(
        HealthData.device_id,
        db.func.max(HealthData.timestamp).label('max_timestamp')
    ).group_by(HealthData.device_id).subquery()

    # Join with the main table to get the full rows for the latest timestamps
    latest_data = db.session.query(HealthData).join(
        subquery,
        db.and_(
            HealthData.device_id == subquery.c.device_id,
            HealthData.timestamp == subquery.c.max_timestamp
        )
    ).all()

    if not latest_data:
        return jsonify({"message": "No data found"}), 404
    return jsonify([d.to_dict() for d in latest_data]), 200

@app.route('/api/devices', methods=['GET'])
def get_unique_devices():
    """Retrieves a list of all unique device IDs."""
    devices = db.session.query(HealthData.device_id).distinct().all()
    return jsonify([device[0] for device in devices]), 200

@app.route('/ota', methods=['GET'])
def serve_ota_firmware():
    """Serves the firmware binary for OTA updates."""
    if os.path.exists(OTA_FIRMWARE_PATH):
        logging.info(f"Serving OTA firmware from: {OTA_FIRMWARE_PATH}")
        return send_from_directory(os.path.dirname(OTA_FIRMWARE_PATH), os.path.basename(OTA_FIRMWARE_PATH),
                                   mimetype='application/octet-stream')
    else:
        logging.warning(f"OTA firmware not found at: {OTA_FIRMWARE_PATH}")
        return jsonify({"message": "Firmware not found for OTA update."}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
