import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import * as datos from '../lib/datos'
import { puede } from '../lib/permisos'
import { ESTADOS } from '../lib/estados'

/* =========================================================
   REPORTE / PANEL DE ESTADÍSTICAS
   Resumen visual del avance de las tareas.
   ========================================================= */

export default function Reporte() {
  const { usuario } = useAuth()
  const [tareas, setTareas] = useState([])
  const [error, setError] = useState('')
  const autorizado = puede(usuario.rol, 'reporte.ver')

  useEffect(() => {
    if (!autorizado) return
    datos.listarTareas()
      .then(setTareas)
      .catch((e) => setError('No se pudo generar el reporte: ' + e.message))
  }, [autorizado])

  if (!autorizado) {
    return (
      <div className="vacio tarjeta" style={{ marginTop: 32 }}>
        <div className="icono">🔒</div>
        <strong>Acceso restringido</strong>
        <p className="chico">El reporte está disponible para administradores y supervisores.</p>
      </div>
    )
  }

  const total = tareas.length
  const porEstado = ESTADOS.map((e) => ({
    ...e,
    cantidad: tareas.filter((t) => t.estado === e.id).length,
  }))
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0)

  const porResponsable = Object.values(
    tareas.reduce((acc, t) => {
      const key = t.responsable || 'Sin asignar'
      acc[key] = acc[key] || { nombre: key, total: 0, hechas: 0 }
      acc[key].total++
      if (t.estado === 'hecha') acc[key].hechas++
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  return (
    <div>
      <h1>Reporte de avance</h1>
      <p className="suave">Estado consolidado de las tareas del proyecto.</p>

      {error && <div className="aviso aviso-error">{error}</div>}

      <div className="kpis">
        <div className="kpi tarjeta">
          <span className="kpi-valor">{total}</span>
          <span className="kpi-etiqueta">Tareas totales</span>
        </div>
        <div className="kpi tarjeta">
          <span className="kpi-valor">{pct(porEstado[2].cantidad)}%</span>
          <span className="kpi-etiqueta">Terminadas</span>
        </div>
        <div className="kpi tarjeta">
          <span className="kpi-valor">{porResponsable.length}</span>
          <span className="kpi-etiqueta">Responsables</span>
        </div>
      </div>

      <section className="tarjeta seccion-reporte">
        <h3>Distribución por estado</h3>
        {porEstado.map((e) => (
          <div key={e.id} className="barra-fila">
            <span className="barra-nombre">{e.etiqueta}</span>
            <div className="barra-track">
              <div className="barra-relleno"
                style={{ width: `${pct(e.cantidad)}%`, background: e.color }} />
            </div>
            <span className="barra-valor">{e.cantidad} ({pct(e.cantidad)}%)</span>
          </div>
        ))}
      </section>

      <section className="tarjeta seccion-reporte">
        <h3>Carga por responsable</h3>
        {porResponsable.length === 0 ? (
          <p className="suave chico">Sin datos para mostrar.</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr><th>Responsable</th><th>Tareas</th><th>Hechas</th><th>Avance</th></tr>
              </thead>
              <tbody>
                {porResponsable.map((r) => (
                  <tr key={r.nombre}>
                    <td>{r.nombre}</td>
                    <td>{r.total}</td>
                    <td>{r.hechas}</td>
                    <td>
                      <div className="barra-track mini">
                        <div className="barra-relleno"
                          style={{ width: `${pct(r.hechas)}%`, background: 'var(--estado-hecha)' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
