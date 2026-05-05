from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from database import get_db
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    since = (datetime.now() - timedelta(days=7)).isoformat()
    conn  = get_db()
    rows  = conn.execute(
        "SELECT timestamp, action FROM activity_log WHERE timestamp > ? ORDER BY timestamp",
        (since,)
    ).fetchall()
    conn.close()

    # Aggregate by date
    daily: dict = {}
    for row in rows:
        date = row['timestamp'][:10]
        daily.setdefault(date, {'on': 0, 'off': 0})
        daily[date][row['action']] += 1

    chart = [
        {"date": d, "hoursOn": round(v['on'] * 0.5, 2)}
        for d, v in sorted(daily.items())
    ]

    total_on  = sum(r['action'] == 'on' for r in rows)
    total_cmd = len(rows)

    return jsonify({
        "dailyData": chart,
        "stats": {
            "totalHours":   round(total_on * 0.5, 1),
            "avgPerDay":    round((total_on * 0.5) / 7, 1),
            "totalCommands": total_cmd,
        }
    }), 200
