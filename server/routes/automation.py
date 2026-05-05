import time
import threading
import requests
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from database import get_db
from config import Config
from routes.relay import get_state, set_state

automation_bp = Blueprint('automation', __name__)

_last_check = {'time': None, 'temp': None, 'condition': None, 'triggered': None}
_lock = threading.Lock()


def _fetch_weather(city):
    try:
        res = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?q={city}&appid={Config.WEATHER_API_KEY}&units=metric",
            timeout=5
        )
        data = res.json()
        if data.get('cod') != 200:
            return None
        return {
            'temp': data['main']['temp'],
            'main': data['weather'][0]['main'],
            'icon': data['weather'][0]['icon'],
        }
    except Exception:
        return None


def _apply_rules():
    conn = get_db()
    settings = conn.execute("SELECT * FROM automation_settings WHERE id = 1").fetchone()
    rules    = conn.execute("SELECT * FROM automation_rules WHERE enabled = 1").fetchall()
    last_log = conn.execute(
        "SELECT action, method FROM activity_log ORDER BY id DESC LIMIT 1"
    ).fetchone()
    conn.close()

    # Master switch OFF → do nothing, no API call
    if not settings or not settings['enabled']:
        return

    # No rules enabled → nothing to check
    if not rules:
        return

    # If user/AI manually turned it OFF last → respect their choice
    if last_log and last_log['action'] == 'off' and last_log['method'] in ('web', 'ai', 'esp32'):
        with _lock:
            _last_check['triggered'] = None
        return

    city = settings['city'] if settings else Config.WEATHER_CITY
    w = _fetch_weather(city)

    with _lock:
        if w:
            _last_check['time']      = time.strftime('%H:%M')
            _last_check['temp']      = round(w['temp'], 1)
            _last_check['condition'] = w['main']

    if not w:
        return

    matched = False
    for rule in rules:
        rid = rule['id']
        if rid == 'rain'  and w['main'] in ('Rain', 'Drizzle', 'Thunderstorm'):
            matched = True
        elif rid == 'hot'  and w['temp'] > 35:
            matched = True
        elif rid == 'night' and w['icon'] and w['icon'].endswith('n'):
            matched = True

    if matched and get_state() == 'off':
        set_state('on', 'auto')
        with _lock:
            _last_check['triggered'] = 'on'
    else:
        with _lock:
            _last_check['triggered'] = None


def _loop():
    time.sleep(15)          # let app fully start
    while True:
        try:
            _apply_rules()
        except Exception:
            pass
        time.sleep(300)     # check every 5 minutes


def start_automation():
    t = threading.Thread(target=_loop, daemon=True)
    t.start()


# ── API ─────────────────────────────────────────────────────

@automation_bp.route('/automation', methods=['GET'])
@jwt_required()
def get_automation():
    conn = get_db()
    rules    = [dict(r) for r in conn.execute("SELECT * FROM automation_rules").fetchall()]
    settings = conn.execute("SELECT * FROM automation_settings WHERE id = 1").fetchone()
    conn.close()
    with _lock:
        check = dict(_last_check)
    return jsonify({
        'rules':      rules,
        'enabled':    bool(settings['enabled']) if settings else False,
        'city':       settings['city'] if settings else Config.WEATHER_CITY,
        'last_check': check,
    }), 200


@automation_bp.route('/automation/toggle', methods=['POST'])
@jwt_required()
def toggle_automation():
    conn = get_db()
    row = conn.execute("SELECT enabled FROM automation_settings WHERE id = 1").fetchone()
    new_val = 0 if (row and row['enabled']) else 1
    conn.execute("UPDATE automation_settings SET enabled = ? WHERE id = 1", (new_val,))
    conn.commit()
    conn.close()
    return jsonify({'enabled': bool(new_val)}), 200


@automation_bp.route('/automation/<rule_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_rule(rule_id):
    conn = get_db()
    row = conn.execute("SELECT enabled FROM automation_rules WHERE id = ?", (rule_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Rule not found'}), 404
    new_val = 0 if row['enabled'] else 1
    conn.execute("UPDATE automation_rules SET enabled = ? WHERE id = ?", (new_val, rule_id))
    conn.commit()
    conn.close()
    return jsonify({'id': rule_id, 'enabled': bool(new_val)}), 200


@automation_bp.route('/automation/city', methods=['POST'])
@jwt_required()
def set_city():
    data = request.get_json() or {}
    city = data.get('city', '').strip()
    if not city:
        return jsonify({'error': 'City required'}), 400
    conn = get_db()
    conn.execute("UPDATE automation_settings SET city = ? WHERE id = 1", (city,))
    conn.commit()
    conn.close()
    return jsonify({'city': city}), 200
