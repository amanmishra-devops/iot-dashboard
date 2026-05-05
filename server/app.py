import logging
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Silence ESP32 polling noise in logs
logging.getLogger('werkzeug').setLevel(logging.WARNING)
from config import Config
from database import init_db
from routes.auth import auth_bp
from routes.relay import relay_bp
from routes.weather import weather_bp
from routes.ai import ai_bp
from routes.analytics import analytics_bp
from routes.logs import logs_bp
from routes.automation import automation_bp, start_automation

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    JWTManager(app)
    init_db()

    app.register_blueprint(auth_bp)
    app.register_blueprint(relay_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(automation_bp)

    start_automation()

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
