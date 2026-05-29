import sqlite3
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.expanduser("~"), ".swg_scores.db")


def _get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str = DB_PATH):
    """Create tables if they don't exist."""
    with _get_connection(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_name TEXT NOT NULL,
                result TEXT NOT NULL,
                player_choice TEXT NOT NULL,
                computer_choice TEXT NOT NULL,
                played_at TEXT NOT NULL
            )
        """)
        conn.commit()


def save_result(player_name: str, result: str, player_choice: str,
                computer_choice: str, db_path: str = DB_PATH):
    """Persist a single round result."""
    with _get_connection(db_path) as conn:
        conn.execute(
            """INSERT INTO scores
               (player_name, result, player_choice, computer_choice, played_at)
               VALUES (?, ?, ?, ?, ?)""",
            (player_name, result, player_choice, computer_choice,
             datetime.now(timezone.utc).isoformat())
        )
        conn.commit()


def get_stats(player_name: str, db_path: str = DB_PATH) -> dict:
    """Return win/loss/draw counts for a player."""
    with _get_connection(db_path) as conn:
        rows = conn.execute(
            "SELECT result, COUNT(*) as cnt FROM scores "
            "WHERE player_name = ? GROUP BY result",
            (player_name,)
        ).fetchall()

    stats = {"win": 0, "lose": 0, "draw": 0, "total": 0}
    for row in rows:
        stats[row["result"]] = row["cnt"]
        stats["total"] += row["cnt"]
    return stats


def get_history(player_name: str, limit: int = 10,
                db_path: str = DB_PATH) -> list:
    """Return last N rounds for a player."""
    with _get_connection(db_path) as conn:
        rows = conn.execute(
            "SELECT * FROM scores WHERE player_name = ? "
            "ORDER BY played_at DESC LIMIT ?",
            (player_name, limit)
        ).fetchall()
    return [dict(r) for r in rows]


def reset_stats(player_name: str, db_path: str = DB_PATH):
    """Delete all records for a player."""
    with _get_connection(db_path) as conn:
        conn.execute("DELETE FROM scores WHERE player_name = ?", (player_name,))
        conn.commit()
