import { InsigniaEstado } from './Insignias'

/* =========================================================
   TARJETA DE TAREA
   Muestra los 4 campos: título, descripción, estado y
   usuario responsable.
   ========================================================= */

const fecha = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es-CL', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return '' }
}

export default function TarjetaTarea({ tarea, puedeEditar, puedeEliminar, onEditar, onEliminar }) {
  return (
    <article className="tarjeta tarjeta-tarea">
      <div className="fila separar">
        <h4 className="titulo-tarea">{tarea.titulo}</h4>
        <InsigniaEstado estado={tarea.estado} />
      </div>

      {tarea.descripcion && <p className="desc-tarea">{tarea.descripcion}</p>}

      <div className="fila separar pie-tarea">
        <span className="responsable">
          <span className="avatar">{(tarea.responsable || 'S/N').charAt(0).toUpperCase()}</span>
          {tarea.responsable || 'Sin asignar'}
        </span>

        <span className="fila" style={{ gap: 6 }}>
          <small className="suave">{fecha(tarea.creada_en)}</small>
          {puedeEditar && (
            <button className="btn btn-fantasma btn-sm" onClick={() => onEditar(tarea)}>
              Editar
            </button>
          )}
          {puedeEliminar && (
            <button className="btn btn-fantasma btn-sm peligro-texto" onClick={() => onEliminar(tarea)}>
              Eliminar
            </button>
          )}
        </span>
      </div>
    </article>
  )
}
