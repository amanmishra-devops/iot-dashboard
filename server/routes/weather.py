from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import requests
from config import Config

weather_bp = Blueprint('weather', __name__)

_auto_mode = False  # in-memory toggle (resets on restart)

@weather_bp.route('/weather', methods=['GET'])
@jwt_required()
def get_weather():
    city = request.args.get('city', Config.WEATHER_CITY)
    url  = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?q={city}&appid={Config.WEATHER_API_KEY}&units=metric"
    )
    try:
        res  = requests.get(url, timeout=5)
        data = res.json()
        if data.get('cod') != 200:
            return jsonify({"error": "City not found"}), 404

        return jsonify({
            "temperature":  data['main']['temp'],
            "feels_like":   data['main']['feels_like'],
            "humidity":     data['main']['humidity'],
            "wind_speed":   data['wind']['speed'],
            "description":  data['weather'][0]['description'],
            "main":         data['weather'][0]['main'],
            "icon":         data['weather'][0]['icon'],
            "location":     data['name'],
            "country":      data['sys']['country'],
        }), 200

    except Exception:
        return jsonify({"error": "Weather service unavailable"}), 503

@weather_bp.route('/weather-auto/<mode>', methods=['POST'])
@jwt_required()
def weather_auto(mode):
    global _auto_mode
    _auto_mode = mode.lower() == 'true'
    return jsonify({"auto_mode": _auto_mode}), 200
