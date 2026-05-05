from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from database import get_db
from datetime import datetime

relay_bp = Blueprint('relay', __name__)

# ── Helpers ─────────────────────────────────────────────

def get_state():
    conn = get_db()
    row = conn.execute("SELECT state FROM relay_state WHERE id = 1").fetchone()
    conn.close()
    return row['state'] if row else 'off'

def set_state(state: str, method: str = 'web'):
    now = datetime.now().isoformat()
    conn = get_db()
    conn.execute(
        "UPDATE relay_state SET state = ?, updated_at = ? WHERE id = 1",
        (state, now)
    )
    conn.execute(
        "INSERT INTO activity_log (timestamp, action, method) VALUES (?, ?, ?)",
        (now, state, method)
    )
    conn.commit()
    conn.close()

# ── React / Dashboard (JWT required) ────────────────────

@relay_bp.route('/relay', methods=['GET'])
@jwt_required()
def get_relay():
    return jsonify({"state": get_state()}), 200

@relay_bp.route('/on', methods=['POST'])
@jwt_required()
def turn_on():
    set_state('on', 'web')
    return jsonify({"state": "on"}), 200

@relay_bp.route('/off', methods=['POST'])
@jwt_required()
def turn_off():
    set_state('off', 'web')
    return jsonify({"state": "off"}), 200

# ── ESP32 endpoints (no auth, simple GET) ───────────────
# Update ESP32 code to poll: GET /esp/relay
# ESP32 on command:           GET /esp/on
# ESP32 off command:          GET /esp/off

@relay_bp.route('/esp/relay', methods=['GET'])
def esp_get_relay():
    return jsonify({"state": get_state()}), 200

@relay_bp.route('/esp/on', methods=['GET'])
def esp_turn_on():
    set_state('on', 'esp32')
    return jsonify({"state": "on"}), 200

@relay_bp.route('/esp/off', methods=['GET'])
def esp_turn_off():
    set_state('off', 'esp32')
    return jsonify({"state": "off"}), 200
