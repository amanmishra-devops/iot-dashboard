from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from groq import Groq
from config import Config
from routes.relay import get_state, set_state

ai_bp   = Blueprint('ai', __name__)
_client = Groq(api_key=Config.GROQ_API_KEY)

ON_KEYWORDS = [
    # English
    'on', 'turn on', 'switch on', 'light on', 'start',
    # Hinglish
    'chalao', 'chala do', 'chala', 'chal', 'kholo', 'jala', 'jalao', 'jalo',
    'on karo', 'on kar', 'on kardo',
    # Devanagari (hi-IN voice transcript)
    'चालू', 'ऑन', 'जलाओ', 'चलाओ', 'चला', 'खोलो', 'जला',
]

OFF_KEYWORDS = [
    # English
    'off', 'turn off', 'switch off', 'light off', 'stop',
    # Hinglish
    'band', 'band karo', 'band kar', 'band kardo', 'bujha', 'bujhao',
    'off karo', 'off kar', 'off kardo', 'bund',
    # Devanagari (hi-IN voice transcript)
    'बंद', 'ऑफ', 'बुझाओ', 'बुझा', 'बन्द',
]

@ai_bp.route('/ai-command', methods=['POST'])
@jwt_required()
def ai_command():
    data    = request.get_json() or {}
    command = data.get('command', '').strip()
    if not command:
        return jsonify({"response": "Please send a command."}), 400

    current = get_state()
    system  = f"""You are NexHome AI — a friendly smart home assistant controlling a LIGHT (bulb/lamp).
Current light state: {current.upper()}

Language: Respond in the same language the user used. You understand Hindi, English, and Hinglish naturally.

Personality: Warm, witty, and helpful. You understand context — if someone says "sir daant rahe hain light on karo", you understand the situation and respond with empathy while confirming the action.

Behavior:
- Understand INDIRECT commands. Example: "boss is angry, turn on light" = turn on. "neend aa rahi hai" = turn off.
- For light ON/OFF → confirm action in a natural, friendly way (1 sentence)
- For casual conversation → respond naturally, keep it short
- For status questions → tell current state
- If user shares something (mood, situation, joke) → acknowledge briefly then act if needed
- ONLY control LIGHT — never mention AC, fan, or other devices
- Max 2 sentences in reply"""

    try:
        resp     = _client.chat.completions.create(
            model    = "llama-3.1-8b-instant",
            messages = [
                {"role": "system", "content": system},
                {"role": "user",   "content": command},
            ],
            max_tokens = 120,
        )
        ai_reply = resp.choices[0].message.content.strip()
    except Exception:
        ai_reply = "Sorry, AI service unavailable right now."

    # Detect intent from command
    lower      = command.lower()
    new_state  = None

    if any(k in lower for k in ON_KEYWORDS):
        set_state('on', 'ai')
        new_state = 'on'
    elif any(k in lower for k in OFF_KEYWORDS):
        set_state('off', 'ai')
        new_state = 'off'

    return jsonify({
        "response":     ai_reply,
        "relay_state":  new_state or get_state(),  # always return current state
    }), 200
