"""Matriz de permisos por rol.

Es el ESPEJO EXACTO de src/lib/permisos.js del frontend React:
si se cambia uno, hay que cambiar el otro.
"""

PERMISOS = {
    "administrador": [
        "tarea.ver_todas",
        "tarea.crear",
        "tarea.editar_cualquiera",
        "tarea.eliminar_cualquiera",
        "usuario.gestionar",
        "usuario.ver_listado",
        "reporte.ver",
    ],
    "supervisor": [
        "tarea.ver_todas",
        "tarea.crear",
        "tarea.editar_cualquiera",
        "reporte.ver",
    ],
    "usuario": [
        "tarea.ver_propias",
        "tarea.crear",
        "tarea.editar_propia",
        "tarea.eliminar_propia",
    ],
}

ACCIONES = [
    "tarea.ver_todas",
    "tarea.ver_propias",
    "tarea.crear",
    "tarea.editar_cualquiera",
    "tarea.editar_propia",
    "tarea.eliminar_cualquiera",
    "tarea.eliminar_propia",
    "usuario.gestionar",
    "usuario.ver_listado",
    "reporte.ver",
]


def puede(rol: str, accion: str) -> bool:
    """¿Tiene el rol la acción indicada?"""
    return accion in PERMISOS.get(rol, [])


def puede_editar(rol: str, tarea: dict, usuario_id: int) -> bool:
    """Edición: cualquiera (admin/supervisor) o la propia (usuario)."""
    if puede(rol, "tarea.editar_cualquiera"):
        return True
    return puede(rol, "tarea.editar_propia") and tarea.get("responsable_id") == usuario_id


def puede_eliminar(rol: str, tarea: dict, usuario_id: int) -> bool:
    """Eliminación: solo administrador, o la propia tarea (usuario)."""
    if puede(rol, "tarea.eliminar_cualquiera"):
        return True
    return puede(rol, "tarea.eliminar_propia") and tarea.get("responsable_id") == usuario_id
