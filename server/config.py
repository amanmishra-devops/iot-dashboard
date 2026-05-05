import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    JWT_SECRET_KEY         = os.getenv('JWT_SECRET', 'change-this-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    GROQ_API_KEY  = os.getenv('GROQ_API_KEY', '')
    WEATHER_API_KEY = os.getenv('WEATHER_API_KEY', '').strip("'\"")
    WEATHER_CITY    = os.getenv('WEATHER_CITY', 'New Delhi').strip("'\"")

    ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin')

    DB_PATH = os.path.join(os.path.dirname(__file__), 'nexhome.db')
