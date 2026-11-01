import sqlite3
import os
import json
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "multi_links.db"

def _get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = _get_connection()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS qr_multi_link_settings (
                qr_id TEXT PRIMARY KEY,
                is_multi_link INTEGER NOT NULL DEFAULT 0,
                active_link_ids TEXT NOT NULL DEFAULT '[]',
                description TEXT DEFAULT '',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        try:
            conn.execute("ALTER TABLE qr_multi_link_settings ADD COLUMN description TEXT DEFAULT ''")
        except Exception:
            pass
    conn.close()


# Initialize on import
init_db()

def get_multi_link_config(qr_id: str) -> dict:
    conn = _get_connection()
    row = conn.execute("SELECT is_multi_link, active_link_ids FROM qr_multi_link_settings WHERE qr_id = ?", (qr_id,)).fetchone()
    conn.close()
    if row:
        try:
            active_ids = json.loads(row["active_link_ids"])
        except Exception:
            active_ids = []
        return {
            "is_multi_link": bool(row["is_multi_link"]),
            "active_link_ids": active_ids
        }
    return {
        "is_multi_link": False,
        "active_link_ids": []
    }

def set_multi_link_config(qr_id: str, is_multi_link: bool, active_link_ids: list[str]) -> dict:
    conn = _get_connection()
    active_ids_json = json.dumps(active_link_ids or [])
    with conn:
        conn.execute("""
            INSERT INTO qr_multi_link_settings (qr_id, is_multi_link, active_link_ids, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(qr_id) DO UPDATE SET
                is_multi_link = excluded.is_multi_link,
                active_link_ids = excluded.active_link_ids,
                updated_at = CURRENT_TIMESTAMP
        """, (qr_id, 1 if is_multi_link else 0, active_ids_json))
    conn.close()
    return {
        "is_multi_link": is_multi_link,
        "active_link_ids": active_link_ids or []
    }


def save_qr_description(qr_id: str, description: str):
    conn = _get_connection()
    desc = (description or "")[:2500]
    with conn:
        conn.execute("""
            INSERT INTO qr_multi_link_settings (qr_id, is_multi_link, active_link_ids, description, updated_at)
            VALUES (?, 0, '[]', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(qr_id) DO UPDATE SET
                description = excluded.description,
                updated_at = CURRENT_TIMESTAMP
        """, (qr_id, desc))
    conn.close()


def get_qr_description(qr_id: str) -> str:
    conn = _get_connection()
    row = conn.execute("SELECT description FROM qr_multi_link_settings WHERE qr_id = ?", (qr_id,)).fetchone()
    conn.close()
    if row and row["description"]:
        return row["description"]
    return ""

