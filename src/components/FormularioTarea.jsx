import { useState } from 'react'
import { ESTADOS } from '../lib/estados'

/* =========================================================
   FORMULARIO DE TAREA
   Validación: el título es obligatorio (Actividad 2).
   ========================================================= */

export default function FormularioTarea({ inicial, usuarios = [], onGuardar, onCancelar }) {
  const editando = Boolean(inicial?.id)
  const [titulo, setTitulo] = useState(inicial?.titulo || '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion || '')
  const [estado, setEstado] = useState(inicial?.estado || 'pendiente')
  const [responsable, setResponsable] = useState(inicial?.responsable || '')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    if (!titulo.trim()) {
      setError('El título es obligatorio.')
      return
    }
    if (titulo.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres.')
      return
    }
    setError('')
    setEnviando(true)
    try {
      await onGuardar({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        estado,
        responsable: responsable.trim(),
        responsable_id: usuarios.find((u) => u.nombre === responsable)?.id || null,
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="tarjeta formulario-tarea" onSubmit={enviar} noValidate>
      <div className="fila separar">
        <h3 style={{ margin: 0 }}>{editando ? 'Editar tarea' : 'Nueva tarea'}</h3>
        {editando && (
          <button type="button" className="btn btn-fantasma btn-sm" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>

      {error && <div className="aviso aviso-error" role="alert">{error}</div>}

      <div className="campo">
        <label htmlFor="titulo">Título *</label>
        <input
          id="titulo"
          className={error && !titulo.trim() ? 'invalido' : ''}
          value={titulo}
          onChange={(e) => { setTitulo(e.target.value); if (error) setError('') }}
          placeholder="¿Qué hay que hacer?"
          maxLength={90}
          autoFocus
        />
        {error && !titulo.trim() && <div className="error">{error}</div>}
      </div>

      <div className="campo">
        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Detalles, contexto, enlaces..."
          maxLength={500}
        />
        <div className="ayuda">{descripcion.length}/500 caracteres</div>
      </div>

      <div className="fila">
        <div className="campo" style={{ flex: '1 1 170px' }}>
          <label htmlFor="estado">Estado</label>
          <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {ESTADOS.map((s) => (
              <option key={s.id} value={s.id}>{s.etiqueta}</option>
            ))}
          </select>
        </div>

        <div className="campo" style={{ flex: '1 1 200px' }}>
          <label htmlFor="responsable">Usuario responsable</label>
          <input
            id="responsable"
            list="lista-usuarios"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            placeholder="Nombre o correo"
          />
          <datalist id="lista-usuarios">
            {usuarios.map((u) => <option key={u.id} value={u.nombre} />)}
          </datalist>
        </div>
      </div>

      <div className="fila">
        <button className="btn btn-primario" type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar tarea'}
        </button>
        {editando && (
          <button type="button" className="btn btn-secundario" onClick={onCancelar}>
            Descartar
          </button>
        )}
      </div>
    </form>
  )
}
