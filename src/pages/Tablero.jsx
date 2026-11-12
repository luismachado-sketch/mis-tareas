import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import * as datos from '../lib/datos'
import { puede } from '../lib/permisos'
import { ESTADOS } from '../lib/estados'
import FormularioTarea from '../components/FormularioTarea'
import TarjetaTarea from '../components/TarjetaTarea'

const FILTROS = [
  { id: 'todas', etiqueta: 'Todas' },
  ...ESTADOS.map((e) => ({ id: e.id, etiqueta: e.etiqueta })),
]

export default function Tablero() {
  const { usuario } = useAuth()
  const [tareas, setTareas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [filtro, setFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  const verTodas = puede(usuario.rol, 'tarea.ver_todas')

  const cargar = async () => {
    try {
      const [t, u] = await Promise.all([
        datos.listarTareas({ soloPropias: !verTodas, userId: usuario.id }),
        puede(usuario.rol, 'usuario.ver_listado') ? datos.listarUsuarios() : Promise.resolve([]),
      ])
      setTareas(t)
      setUsuarios(u)
      setError('')
    } catch (e) {
      setError('No se pudieron cargar las tareas: ' + e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [usuario.id, usuario.rol])

  const mostrar = (texto, tipo = 'ok') => {
    setAviso({ texto, tipo })
    setTimeout(() => setAviso(null), 3200)
  }

  /* ---------- Filtrado ---------- */
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return tareas.filter((t) => {
      const okFiltro = filtro === 'todas' || t.estado === filtro
      const okBusca = !q ||
        t.titulo.toLowerCase().includes(q) ||
        (t.descripcion || '').toLowerCase().includes(q) ||
        (t.responsable || '').toLowerCase().includes(q)
      return okFiltro && okBusca
    })
  }, [tareas, filtro, busqueda])

  /* ---------- Contadores ---------- */
  const conteo = useMemo(() => {
    const c = { todas: tareas.length }
    ESTADOS.forEach((e) => { c[e.id] = tareas.filter((t) => t.estado === e.id).length })
    return c
  }, [tareas])

  /* ---------- Acciones ---------- */
  const guardar = async (valores) => {
    try {
      /* Si no se eligió responsable, la tarea queda asignada
         al usuario que la crea. */
      if (!valores.responsable_id && !valores.responsable) {
        valores.responsable = usuario.nombre
        valores.responsable_id = usuario.id
      }

      if (editando) {
        await datos.actualizarTarea(editando.id, valores)
        mostrar('Tarea actualizada correctamente.')
      } else {
        await datos.crearTarea(valores)
        mostrar('Tarea agregada correctamente.')
      }
      setEditando(null); setMostrarForm(false)
      await cargar()
    } catch (e) {
      setError('No se pudo guardar: ' + e.message)
    }
  }

  const eliminar = async (t) => {
    const seguro = window.confirm(`¿Eliminar la tarea "${t.titulo}"? Esta acción no se puede deshacer.`)
    if (!seguro) return
    try {
      await datos.eliminarTarea(t.id)
      mostrar('Tarea eliminada.', 'info')
      await cargar()
    } catch (e) {
      setError('No se pudo eliminar: ' + e.message)
    }
  }

  const cambiarEstado = async (t, nuevoEstado) => {
    try {
      await datos.actualizarTarea(t.id, { estado: nuevoEstado })
      await cargar()
    } catch (e) {
      setError('No se pudo cambiar el estado: ' + e.message)
    }
  }

  const permisoEditar = (t) =>
    puede(usuario.rol, 'tarea.editar_cualquiera') ||
    (puede(usuario.rol, 'tarea.editar_propia') && t.responsable_id === usuario.id)

  const permisoEliminar = (t) =>
    puede(usuario.rol, 'tarea.eliminar_cualquiera') ||
    (puede(usuario.rol, 'tarea.eliminar_propia') && t.responsable_id === usuario.id)

  /* ---------- Render ---------- */
  return (
    <div className="tablero">
      <header className="cabecera-tablero">
        <div>
          <h1 className="titulo-principal">Mis tareas</h1>
          <p className="suave" style={{ margin: 0 }}>
            {conteo.todas === 0 ? '0 tareas abiertas' : `${conteo.todas} tareas en total`}
            {!verTodas && ' · solo tus tareas'}
          </p>
        </div>
        <button
          className="btn btn-primario"
          onClick={() => { setEditando(null); setMostrarForm((v) => !v) }}
        >
          {mostrarForm ? 'Cerrar' : '+ Nueva tarea'}
        </button>
      </header>

      {aviso && <div className={`aviso aviso-${aviso.tipo === 'info' ? 'info' : 'ok'}`}>{aviso.texto}</div>}
      {error && <div className="aviso aviso-error" role="alert">{error}</div>}

      {(mostrarForm || editando) && (
        <FormularioTarea
          inicial={editando}
          usuarios={usuarios}
          onGuardar={guardar}
          onCancelar={() => { setEditando(null); setMostrarForm(false) }}
        />
      )}

      <div className="barra-herramientas">
        <div className="filtros" role="tablist" aria-label="Filtrar por estado">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filtro === f.id}
              className={`filtro ${filtro === f.id ? 'activo' : ''}`}
              onClick={() => setFiltro(f.id)}
            >
              {f.etiqueta} <span className="conteo">{conteo[f.id] ?? 0}</span>
            </button>
          ))}
        </div>
        <input
          className="buscador"
          type="search"
          placeholder="Buscar por título, descripción o responsable…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar tareas"
        />
      </div>

      {cargando ? (
        <div className="vacio"><div className="icono">⏳</div>Cargando tareas…</div>
      ) : visibles.length === 0 ? (
        <div className="vacio">
          <div className="icono">🗂️</div>
          <strong>No hay tareas para mostrar</strong>
          <p className="chico">Cambia el filtro o agrega una tarea nueva.</p>
        </div>
      ) : (
        <div className="lista-tareas">
          {visibles.map((t) => (
            <div key={t.id} className="item-tarea">
              <TarjetaTarea
                tarea={t}
                puedeEditar={permisoEditar(t)}
                puedeEliminar={permisoEliminar(t)}
                onEditar={(x) => { setEditando(x); setMostrarForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                onEliminar={eliminar}
              />
              <select
                className="cambio-estado"
                value={t.estado}
                onChange={(e) => cambiarEstado(t, e.target.value)}
                aria-label={`Estado de ${t.titulo}`}
                disabled={!permisoEditar(t)}
              >
                {ESTADOS.map((s) => <option key={s.id} value={s.id}>{s.etiqueta}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
