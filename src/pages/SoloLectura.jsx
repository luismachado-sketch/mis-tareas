import { useCallback, useEffect, useState } from 'react'
import * as datos from '../lib/datos'
import { escucharCambio } from '../lib/bus'
import { ESTADOS } from '../lib/estados'
import TarjetaTarea from '../components/TarjetaTarea'

/* =========================================================
   VISTA DE SOLO LECTURA
   Muestra las tareas SIN posibilidad de crear, editar ni
   eliminar. Los cambios hechos en el tablero principal se
   reflejan aquí automáticamente.
   ========================================================= */

const FILTROS = [
  { id: 'todas', etiqueta: 'Todas' },
  ...ESTADOS.map((e) => ({ id: e.id, etiqueta: e.etiqueta })),
]

export default function SoloLectura() {
  const [tareas, setTareas] = useState([])
  const [filtro, setFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [actualizado, setActualizado] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const t = await datos.listarTareas()
      setTareas(t)
      setError('')
      setActualizado(new Date())
    } catch (e) {
      setError('No se pudieron cargar las tareas: ' + e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  /* Carga inicial */
  useEffect(() => { cargar() }, [cargar])

  /* Se actualiza sola cuando cambian los datos */
  useEffect(() => {
    const baja = escucharCambio(() => cargar())
    return baja
  }, [cargar])

  /* Refresco de seguridad cada 5 segundos */
  useEffect(() => {
    const id = setInterval(cargar, 5000)
    return () => clearInterval(id)
  }, [cargar])

  const visibles = tareas.filter((t) => {
    const q = busqueda.trim().toLowerCase()
    const okFiltro = filtro === 'todas' || t.estado === filtro
    const okBusca = !q ||
      t.titulo.toLowerCase().includes(q) ||
      (t.descripcion || '').toLowerCase().includes(q) ||
      (t.responsable || '').toLowerCase().includes(q)
    return okFiltro && okBusca
  })

  const conteo = { todas: tareas.length }
  ESTADOS.forEach((e) => { conteo[e.id] = tareas.filter((t) => t.estado === e.id).length })

  return (
    <div className="solo-lectura">
      <header className="barra-lectura">
        <div className="contenedor fila separar">
          <div className="marca">
            <span className="logo-mark chico-mark">MT</span>
            <span className="nombre-marca">Mis Tareas</span>
          </div>
          <span className="insignia solo-lectura-insignia">
            Vista de solo lectura
          </span>
        </div>
      </header>

      <main className="contenedor contenido-principal">
        <div className="aviso aviso-info aviso-lectura">
          <strong>Solo lectura.</strong> En esta zona no es posible crear, editar ni eliminar
          tareas. Los cambios realizados en el tablero principal se reflejan aquí
          automáticamente.
          {actualizado && (
            <span className="chico suave">
              {' '}· Última actualización {actualizado.toLocaleTimeString('es-CL')}
            </span>
          )}
        </div>

        <header className="cabecera-tablero">
          <div>
            <h1 className="titulo-principal">Mis tareas</h1>
            <p className="suave" style={{ margin: 0 }}>
              {conteo.todas === 0 ? '0 tareas registradas' : `${conteo.todas} tareas en total`}
            </p>
          </div>
          <button className="btn btn-secundario" onClick={cargar}>
            ↻ Actualizar
          </button>
        </header>

        {error && <div className="aviso aviso-error" role="alert">{error}</div>}

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
            <p className="chico">Cambia el filtro o la búsqueda.</p>
          </div>
        ) : (
          <div className="lista-tareas">
            {visibles.map((t) => (
              <TarjetaTarea
                key={t.id}
                tarea={t}
                puedeEditar={false}
                puedeEliminar={false}
                onEditar={() => {}}
                onEliminar={() => {}}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="pie">
        <div className="contenedor fila separar chico suave">
          <span>Prototipo · Ingeniería de Software · EV-03-2026</span>
          <span>Vista pública de consulta</span>
        </div>
      </footer>
    </div>
  )
}
