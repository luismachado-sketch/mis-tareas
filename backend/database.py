"""Capa de datos del backend Python.

Usa SQLite con el MISMO esquema que supabase/esquema.sql, de modo que
el prototipo pueda funcionar con Python por una parte y con Supabase
por la otra, sin cambiar la forma de los datos.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "mis_tareas.db"

ESQUEMA = """
CREATE TABLE IF NOT EXISTS usuarios (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre        TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    rol           TEXT    NOT NULL DEFAULT 'usuario'
                       CHECK (rol IN ('administrador','supervisor','usuario')),
    creada_en     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tareas (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo         TEXT    NOT NULL CHECK (length(trim(titulo)) >= 3),
    descripcion    TEXT    NOT NULL DEFAULT '',
    estado         TEXT    NOT NULL DEFAULT 'pendiente'
                           CHECK (estado IN ('pendiente','progreso','hecha')),
    responsable    TEXT    NOT NULL DEFAULT '',
    responsable_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    creada_en      TEXT    NOT NULL DEFAULT (datetime('now')),
    actualizada_en TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tareas_estado    ON tareas(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_responsable ON tareas(responsable_id);
"""


def conectar() -> sqlite3.Connection:
    """Abre una conexión con filas accesibles por nombre de columna."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def crear_tablas() -> None:
    """Crea las tablas si no existen (idempotente)."""
    with conectar() as conn:
        conn.executescript(ESQUEMA)


def a_dict(fila: sqlite3.Row) -> dict:
    """Convierte una fila en diccionario."""
    return dict(fila) if fila is not None else None
