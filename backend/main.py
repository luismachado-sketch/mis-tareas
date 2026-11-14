"""API REST del prototipo «Mis Tareas» — backend en Python (FastAPI).

Expone las MISMAS operaciones que la capa de datos del frontend React,
con la misma matriz de permisos por rol, para que el sistema pueda
funcionar con Python por una parte y con Supabase por la otra.

Enderezo:  http://127.0.0.1:8000
Documentación interactiva: http://127.0.0.1:8000/docs
"""

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

import auth
import database
from permisos import ACCIONES, PERMISOS, puede, puede_editar, puede_eliminar

app = FastAPI(
    title="API · Mis Tareas",
    version="1.0.0",
    description="Backend en Python del prototipo de Ingeniería de Software EV-03-2026.",
)

# El frontend React (Vite, puerto 5173) puede llamar a esta API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

ESTADOS_VALIDOS = {"pendiente", "progreso", "hecha"}
ROLES_VALIDOS = {"administrador", "supervisor", "usuario"}


# ============================================================ modelos
class TareaEntrada(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=90)
    descripcion: str = Field("", max_length=500)
    estado: str = "pendiente"
    responsable: str = ""
    responsable_id: int | None = None

    @field_validator("estado")
    @classmethod
    def estado_valido(cls, v):
        if v not in ESTADOS_VALIDOS:
            raise ValueError("Estado no válido: usa pendiente, progreso o hecha.")
        return v


class TareaEstado(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def estado_valido(cls, v):
        if v not in ESTADOS_VALIDOS:
            raise ValueError("Estado no válido: usa pendiente, progreso o hecha.")
        return v


class RegistroEntrada(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=80)
    email: str = Field(..., max_length=120)
    password: str = Field(..., min_length=6, max_length=72)
    rol: str = "usuario"

    @field_validator("email")
    @classmethod
    def correo_valido(cls, v):
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("El correo no tiene un formato válido.")
        return v

    @field_validator("rol")
    @classmethod
    def rol_valido(cls, v):
        if v not in ROLES_VALIDOS:
            raise ValueError("Rol no válido.")
        return v


class LoginEntrada(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def minusculas(cls, v):
        return v.strip().lower()


class RolEntrada(BaseModel):
    rol: str

    @field_validator("rol")
    @classmethod
    def rol_valido(cls, v):
        if v not in ROLES_VALIDOS:
            raise ValueError("Rol no válido.")
        return v


# ============================================================ seguridad
def usuario_actual(authorization: str | None = Header(default=None)) -> dict:
    """Extrae y valida el token 'Bearer <token>' de la cabecera."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falta el token de sesión. Inicia sesión primero.",
        )
    payload = auth.leer_token(authorization.split(" ", 1)[1].strip())
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión inválida o expirada.",
        )
    with database.conectar() as conn:
        fila = conn.execute(
            "SELECT id, nombre, email, rol FROM usuarios WHERE id = ?",
            (payload["sub"],),
        ).fetchone()
    if not fila:
        raise HTTPException(status_code=401, detail="El usuario ya no existe.")
    return database.a_dict(fila)


def exigir(rol: str, accion: str) -> None:
    if not puede(rol, accion):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"El rol «{rol}» no tiene permiso para {accion}.",
        )


def _publicar(t: dict) -> dict:
    """Agrega los permisos de la tarea según quién la pide."""
    return t


def _tarea_por_id(conn, tarea_id: int) -> dict:
    fila = conn.execute("SELECT * FROM tareas WHERE id = ?", (tarea_id,)).fetchone()
    if not fila:
        raise HTTPException(status_code=404, detail="Tarea no encontrada.")
    return database.a_dict(fila)


# ============================================================ raíz
@app.get("/")
def raiz():
    return {
        "servicio": "API · Mis Tareas",
        "lenguaje": "Python",
        "documentacion": "/docs",
        "estados": sorted(ESTADOS_VALIDOS),
        "roles": sorted(ROLES_VALIDOS),
        "acciones_por_rol": PERMISOS,
        "todas_las_acciones": ACCIONES,
    }


# ============================================================ auth
@app.post("/registro", status_code=201)
def registro(datos: RegistroEntrada):
    with database.conectar() as conn:
        existe = conn.execute(
            "SELECT 1 FROM usuarios WHERE email = ?", (datos.email,)
        ).fetchone()
        if existe:
            raise HTTPException(400, "Ya existe una cuenta con ese correo.")
        cur = conn.execute(
            "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?,?,?,?)",
            (datos.nombre.strip(), datos.email, auth.hash_contrasena(datos.password), datos.rol),
        )
        usuario_id = cur.lastrowid
    return {
        "id": usuario_id,
        "nombre": datos.nombre.strip(),
        "email": datos.email,
        "rol": datos.rol,
        "token": auth.crear_token(usuario_id, datos.rol),
    }


@app.post("/login")
def login(datos: LoginEntrada):
    with database.conectar() as conn:
        fila = conn.execute(
            "SELECT * FROM usuarios WHERE email = ?", (datos.email,)
        ).fetchone()
    if not fila or not auth.verificar_contrasena(datos.password, fila["password_hash"]):
        raise HTTPException(401, "Correo o contraseña incorrectos.")
    return {
        "id": fila["id"],
        "nombre": fila["nombre"],
        "email": fila["email"],
        "rol": fila["rol"],
        "token": auth.crear_token(fila["id"], fila["rol"]),
    }


@app.get("/yo")
def yo(usuario: dict = Depends(usuario_actual)):
    return usuario


# ============================================================ tareas
@app.get("/tareas")
def listar_tareas(
    estado: str | None = None,
    buscar: str | None = None,
    usuario: dict = Depends(usuario_actual),
):
    """Lista las tareas visibles para el rol autenticado.

    - administrador / supervisor → todas
    - usuario                    → solo las suyas
    """
    exigir(usuario["rol"], "tarea.ver_todas" if puede(usuario["rol"], "tarea.ver_todas")
           else "tarea.ver_propias")

    sql = "SELECT * FROM tareas"
    condiciones, params = [], []

    if not puede(usuario["rol"], "tarea.ver_todas"):
        condiciones.append("responsable_id = ?")
        params.append(usuario["id"])

    if estado:
        if estado not in ESTADOS_VALIDOS:
            raise HTTPException(400, "Estado no válido.")
        condiciones.append("estado = ?")
        params.append(estado)

    if buscar:
        condiciones.append(
            "(titulo LIKE ? OR descripcion LIKE ? OR responsable LIKE ?)"
        )
        like = f"%{buscar}%"
        params.extend([like, like, like])

    if condiciones:
        sql += " WHERE " + " AND ".join(condiciones)
    sql += " ORDER BY creada_en DESC"

    with database.conectar() as conn:
        filas = conn.execute(sql, params).fetchall()

    resultado = []
    for f in filas:
        t = database.a_dict(f)
        t["puede_editar"] = puede_editar(usuario["rol"], t, usuario["id"])
        t["puede_eliminar"] = puede_eliminar(usuario["rol"], t, usuario["id"])
        resultado.append(t)
    return resultado


@app.post("/tareas", status_code=201)
def crear_tarea(datos: TareaEntrada, usuario: dict = Depends(usuario_actual)):
    exigir(usuario["rol"], "tarea.crear")

    # Si no se eligió responsable, queda asignada a quien crea la tarea.
    responsable = datos.responsable.strip()
    responsable_id = datos.responsable_id
    if not responsable_id and not responsable:
        responsable = usuario["nombre"]
        responsable_id = usuario["id"]

    with database.conectar() as conn:
        cur = conn.execute(
            """INSERT INTO tareas (titulo, descripcion, estado, responsable, responsable_id)
               VALUES (?,?,?,?,?)""",
            (datos.titulo.strip(), datos.descripcion.strip(), datos.estado,
             responsable, responsable_id),
        )
        tarea = _tarea_por_id(conn, cur.lastrowid)
    return tarea


@app.put("/tareas/{tarea_id}")
def editar_tarea(
    tarea_id: int, datos: TareaEntrada, usuario: dict = Depends(usuario_actual)
):
    with database.conectar() as conn:
        tarea = _tarea_por_id(conn, tarea_id)

    if not puede_editar(usuario["rol"], tarea, usuario["id"]):
        raise HTTPException(403, "No puedes editar esta tarea.")

    # Quien solo ve sus tareas siempre es el responsable:
    # si la tarea quedara sin dueño, dejaría de aparecerle.
    responsable = datos.responsable.strip() or tarea["responsable"]
    responsable_id = datos.responsable_id or tarea["responsable_id"]
    if not puede(usuario["rol"], "tarea.ver_todas"):
        responsable = usuario["nombre"]
        responsable_id = usuario["id"]

    with database.conectar() as conn:
        conn.execute(
            """UPDATE tareas
               SET titulo=?, descripcion=?, estado=?, responsable=?,
                   responsable_id=?, actualizada_en=datetime('now')
               WHERE id=?""",
            (datos.titulo.strip(), datos.descripcion.strip(), datos.estado,
             responsable, responsable_id, tarea_id),
        )
        tarea = _tarea_por_id(conn, tarea_id)
    return tarea


@app.patch("/tareas/{tarea_id}/estado")
def cambiar_estado(tarea_id: int, datos: TareaEstado, usuario: dict = Depends(usuario_actual)):
    with database.conectar() as conn:
        tarea = _tarea_por_id(conn, tarea_id)

    if not puede_editar(usuario["rol"], tarea, usuario["id"]):
        raise HTTPException(403, "No puedes cambiar el estado de esta tarea.")

    with database.conectar() as conn:
        conn.execute(
            "UPDATE tareas SET estado=?, actualizada_en=datetime('now') WHERE id=?",
            (datos.estado, tarea_id),
        )
        tarea = _tarea_por_id(conn, tarea_id)
    return tarea


@app.delete("/tareas/{tarea_id}", status_code=204)
def eliminar_tarea(tarea_id: int, usuario: dict = Depends(usuario_actual)):
    with database.conectar() as conn:
        tarea = _tarea_por_id(conn, tarea_id)

    if not puede_eliminar(usuario["rol"], tarea, usuario["id"]):
        raise HTTPException(403, "No puedes eliminar esta tarea.")

    with database.conectar() as conn:
        conn.execute("DELETE FROM tareas WHERE id=?", (tarea_id,))
    return None


# ============================================================ usuarios
@app.get("/usuarios")
def listar_usuarios(usuario: dict = Depends(usuario_actual)):
    exigir(usuario["rol"], "usuario.ver_listado")
    with database.conectar() as conn:
        filas = conn.execute(
            "SELECT id, nombre, email, rol, creada_en FROM usuarios ORDER BY nombre"
        ).fetchall()
    return [database.a_dict(f) for f in filas]


@app.put("/usuarios/{usuario_id}/rol")
def cambiar_rol(usuario_id: int, datos: RolEntrada, usuario: dict = Depends(usuario_actual)):
    exigir(usuario["rol"], "usuario.gestionar")
    if usuario_id == usuario["id"] and datos.rol != usuario["rol"]:
        raise HTTPException(400, "No puedes cambiar tu propio rol.")
    with database.conectar() as conn:
        cur = conn.execute(
            "UPDATE usuarios SET rol=? WHERE id=?", (datos.rol, usuario_id)
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Usuario no encontrado.")
        fila = conn.execute(
            "SELECT id, nombre, email, rol FROM usuarios WHERE id=?", (usuario_id,)
        ).fetchone()
    return database.a_dict(fila)


# ============================================================ reporte
@app.get("/reporte")
def reporte(usuario: dict = Depends(usuario_actual)):
    exigir(usuario["rol"], "reporte.ver")
    with database.conectar() as conn:
        por_estado = {
            f["estado"]: f["total"]
            for f in conn.execute(
                "SELECT estado, COUNT(*) AS total FROM tareas GROUP BY estado"
            ).fetchall()
        }
        por_responsable = [
            database.a_dict(f)
            for f in conn.execute(
                """SELECT responsable AS nombre,
                          COUNT(*)                AS total,
                          SUM(estado = 'hecha')   AS hechas
                     FROM tareas
                    GROUP BY responsable
                    ORDER BY total DESC"""
            ).fetchall()
        ]

    total = sum(por_estado.values())
    hechas = por_estado.get("hecha", 0)
    return {
        "total": total,
        "por_estado": {
            "pendiente": por_estado.get("pendiente", 0),
            "progreso": por_estado.get("progreso", 0),
            "hecha": hechas,
        },
        "terminadas_pct": round(hechas * 100 / total) if total else 0,
        "responsables": len([r for r in por_responsable if r["nombre"]]),
        "por_responsable": por_responsable,
    }


# ============================================================ arranque
@app.on_event("startup")
def arrancar():
    database.crear_tablas()


if __name__ == "__main__":
    import uvicorn

    database.crear_tablas()
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
