from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database import get_db

logs_bp = Blueprint('logs', __name__)

@logs_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_logs():
    limit = min(int(request.args.get('limit', 50)), 200)
    conn  = get_db()
    rows  = conn.execute(
        "SELECT timestamp, action, method FROM activity_log ORDER BY timestamp DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()

    logs = [{"timestamp": r['timestamp'], "action": r['action'], "method": r['method']} for r in rows]
    return jsonify({"logs": logs, "total": len(logs)}), 200
