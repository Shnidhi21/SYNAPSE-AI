import sqlite3
import json
import uuid
from pathlib import Path
from datetime import datetime, timezone

DATABASE_PATH = Path(__file__).resolve().parent / "synapse.db"

def initialize_database():
    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                uploaded_at TEXT NOT NULL,
                total_pages INTEGER NOT NULL,
                total_characters INTEGER NOT NULL,
                document_data TEXT NOT NULL
            )
            """
        )

def save_document(filename: str, document: dict):
    document_id = str(uuid.uuid4())
    uploaded_at = datetime.now(timezone.utc).isoformat()

    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.execute(
            """
            INSERT INTO documents (
                id,
                filename,
                uploaded_at,
                total_pages,
                total_characters,
                document_data
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                document_id,
                filename,
                uploaded_at,
                document["total_pages"],
                document["total_characters"],
                json.dumps(document)
            )
        )

    return {
        "document_id": document_id,
        "filename": filename,
        "uploaded_at": uploaded_at
    }

def get_document(document_id: str):
    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.row_factory = sqlite3.Row

        row = connection.execute(
            "SELECT * FROM documents WHERE id = ?",
            (document_id,)
        ).fetchone()

    if row is None:
        return None

    result = dict(row)
    result["document_data"] = json.loads(result["document_data"])

    return result

def list_documents():
    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.row_factory = sqlite3.Row

        rows = connection.execute(
            """
            SELECT id, filename, uploaded_at, total_pages, total_characters
            FROM documents
            ORDER BY uploaded_at DESC
            """
        ).fetchall()

    return [dict(row) for row in rows]