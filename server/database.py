import sqlite3
from config import Config

def get_db():
    conn = sqlite3.connect(Config.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute('''
        CREATE TABLE IF NOT EXISTS relay_state (
            id         INTEGER PRIMARY KEY,
            state      TEXT    NOT NULL DEFAULT 'off',
            updated_at TEXT    NOT NULL
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS activity_log (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            action    TEXT NOT NULL,
            method    TEXT NOT NULL
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS automation_rules (
            id          TEXT    PRIMARY KEY,
            name        TEXT    NOT NULL,
            description TEXT    NOT NULL,
            enabled     INTEGER NOT NULL DEFAULT 0
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS automation_settings (
            id      INTEGER PRIMARY KEY,
            city    TEXT    NOT NULL DEFAULT 'New Delhi',
            enabled INTEGER NOT NULL DEFAULT 0
        )
    ''')

    # Seed relay state row if missing
    c.execute(
        "INSERT OR IGNORE INTO relay_state (id, state, updated_at) VALUES (1, 'off', datetime('now'))"
    )

    # Seed automation rules
    for rule in [
        ('rain',  'Rain / Storm',  'Turn light ON when it rains or storms outside',       0),
        ('hot',   'Hot Day',       'Turn light ON when temperature exceeds 35°C',          0),
        ('night', 'Night Time',    'Turn light ON automatically after sunset',             0),
    ]:
        c.execute(
            "INSERT OR IGNORE INTO automation_rules (id, name, description, enabled) VALUES (?, ?, ?, ?)",
            rule
        )

    c.execute(
        "INSERT OR IGNORE INTO automation_settings (id, city, enabled) VALUES (1, 'New Delhi', 0)"
    )

    conn.commit()
    conn.close()
