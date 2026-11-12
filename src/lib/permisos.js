/* =========================================================
   MATRIZ DE PERMISOS POR ROL
   Define qué puede hacer cada rol en cada pantalla.
   Se consulta desde los componentes con puede(rol, accion).
   ========================================================= */

export const PERMISOS = {
  administrador: [
    'tarea.ver_todas',
    'tarea.crear',
    'tarea.editar_cualquiera',
    'tarea.eliminar_cualquiera',
    'usuario.gestionar',
    'usuario.ver_listado',
    'reporte.ver',
  ],
  supervisor: [
    'tarea.ver_todas',
    'tarea.crear',
    'tarea.editar_cualquiera',
    'reporte.ver',
  ],
  usuario: [
    'tarea.ver_propias',
    'tarea.crear',
    'tarea.editar_propia',
    'tarea.eliminar_propia',
  ],
}

/** ¿Tiene el rol la acción indicada? */
export const puede = (rol, accion) =>
  Array.isArray(PERMISOS[rol]) && PERMISOS[rol].includes(accion)

/** Lista de acciones (para documentar en el informe) */
export const ACCIONES = [
  'tarea.ver_todas',
  'tarea.ver_propias',
  'tarea.crear',
  'tarea.editar_cualquiera',
  'tarea.editar_propia',
  'tarea.eliminar_cualquiera',
  'tarea.eliminar_propia',
  'usuario.gestionar',
  'usuario.ver_listado',
  'reporte.ver',
]
