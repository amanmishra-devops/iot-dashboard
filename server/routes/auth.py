from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from config import Config

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if username == Config.ADMIN_USERNAME and password == Config.ADMIN_PASSWORD:
        token = create_access_token(identity=username)
        return jsonify({"token": token, "username": username}), 200

    return jsonify({"message": "Invalid credentials"}), 401
