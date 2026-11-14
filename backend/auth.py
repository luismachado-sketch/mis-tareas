"""Autenticación del backend Python.

- Contraseñas: PBKDF2-HMAC-SHA256 con sal de 16 bytes (stdlib).
- Sesiones: token firmado con HMAC-SHA256 (stdlib).

NO se usa ninguna librería externa para esto: todo es de la
biblioteca estándar de Python, así el prototipo es portable.
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from pathlib import Path

# Secreto de firma: se guarda en un archivo local que NO se sube a Git.
_ARCHIVO_SECRETO = Path(__file__).parent / ".secreto"
_DURACION_TOKEN = 60 * 60 * 12  # 12 horas


def _obtener_secreto() -> bytes:
    if _ARCHIVO_SECRETO.exists():
        return _ARCHIVO_SECRETO.read_bytes().strip()
    nuevo = secrets.token_bytes(32)
    _ARCHIVO_SECRETO.write_bytes(nuevo)
    try:  # en Windows no hay permisos POSIX, se ignora
        os.chmod(_ARCHIVO_SECRETO, 0o600)
    except (OSError, NotImplementedError):
        pass
    return nuevo


SECRETO = _obtener_secreto()


# ------------------------------------------------------------ contraseñas
def hash_contrasena(contrasena: str) -> str:
    """Devuelve 'sal$hash' usando PBKDF2 (resistente a fuerza bruta)."""
    sal = secrets.token_hex(16)
    digesto = hashlib.pbkdf2_hmac(
        "sha256", contrasena.encode("utf-8"), sal.encode("utf-8"), 100_000
    )
    return f"{sal}${digesto.hex()}"


def verificar_contrasena(contrasena: str, guardado: str) -> bool:
    try:
        sal, digesto = guardado.split("$", 1)
    except (ValueError, AttributeError):
        return False
    nuevo = hashlib.pbkdf2_hmac(
        "sha256", contrasena.encode("utf-8"), sal.encode("utf-8"), 100_000
    )
    return hmac.compare_digest(nuevo.hex(), digesto)


# ----------------------------------------------------------------- tokens
def _firma(datos: bytes) -> str:
    return hmac.new(SECRETO, datos, hashlib.sha256).hexdigest()


def crear_token(usuario_id: int, rol: str) -> str:
    cuerpo = json.dumps(
        {"sub": usuario_id, "rol": rol, "exp": int(time.time()) + _DURACION_TOKEN},
        separators=(",", ":"),
    ).encode("utf-8")
    codificado = base64.urlsafe_b64encode(cuerpo).decode("ascii").rstrip("=")
    return f"{codificado}.{_firma(codificado.encode('ascii'))}"


def leer_token(token: str):
    """Devuelve el payload o None si el token es inválido o expiró."""
    if not token or "." not in token:
        return None
    codificado, firma = token.rsplit(".", 1)
    esperada = _firma(codificado.encode("ascii"))
    if not hmac.compare_digest(firma, esperada):
        return None
    try:
        padding = "=" * (-len(codificado) % 4)
        cuerpo = json.loads(base64.urlsafe_b64decode(codificado + padding))
    except (ValueError, json.JSONDecodeError):
        return None
    if cuerpo.get("exp", 0) < time.time():
        return None
    return cuerpo
