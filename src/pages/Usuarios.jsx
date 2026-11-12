import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import * as datos from '../lib/datos'
import { ROLES } from '../lib/estados'
import { puede } from '../lib/permisos'
import { InsigniaRol } from '../components/Insignias'

/* =========================================================
   GESTIÓN DE USUARIOS Y ROLES
   Acceso restringido: solo administrador.
   ========================================================= */

export default function Usuarios() {
  const { usuario } = useAuth()
  const [lista, setLista] = useState([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [cargando, setCargando] = useState(true)

  const autorizado = puede(usuario.rol, 'usuario.gestionar')

  const cargar = async () => {
    try {
      setLista(await datos.listarUsuarios())
      setError('')
    } catch (e) {
      setError('No se pudo cargar el listado: ' + e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { if (autorizado) cargar() }, [autorizado])

  const cambiarRol = async (u, rol) => {
    if (u.id === usuario.id && rol !== 'administrador') {
      setError('No puedes quitar tu propio rol de administrador.')
      return
    }
    try {
      await datos.cambiarRol(u.id, rol)
      setOk(`Rol de ${u.nombre} actualizado a ${rol}.`)
      setTimeout(() => setOk(''), 3000)
      await cargar()
    } catch (e) {
      setError('No se pudo actualizar el rol: ' + e.message)
    }
  }

  if (!autorizado) {
    return (
      <div className="vacio tarjeta" style={{ marginTop: 32 }}>
        <div className="icono">🔒</div>
        <strong>Acceso restringido</strong>
        <p className="chico">Esta pantalla está disponible únicamente para el rol administrador.</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Gestión de usuarios</h1>
      <p className="suave">
        Define el rol de cada persona. El rol determina qué pantallas y acciones puede usar.
      </p>

      {ok && <div className="aviso aviso-ok">{ok}</div>}
      {error && <div className="aviso aviso-error" role="alert">{error}</div>}

      <div className="leyenda-roles">
        {ROLES.map((r) => (
          <span key={r.id} className="insignia" style={{ color: r.color, background: r.bg }}>
            {r.etiqueta}
          </span>
        ))}
      </div>

      {cargando ? (
        <div className="vacio">Cargando usuarios…</div>
      ) : lista.length === 0 ? (
        <div className="vacio">
          <div className="icono">👥</div>
          <strong>No hay usuarios registrados</strong>
        </div>
      ) : (
        <div className="tabla-contenedor tarjeta">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol actual</th>
                <th>Cambiar rol</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id} className={u.id === usuario.id ? 'fila-propia' : ''}>
                  <td>
                    <strong>{u.nombre}</strong>
                    {u.id === usuario.id && <small className="suave"> (tú)</small>}
                  </td>
                  <td className="chico suave">{u.email}</td>
                  <td><InsigniaRol rol={u.rol} /></td>
                  <td>
                    <select
                      value={u.rol}
                      onChange={(e) => cambiarRol(u, e.target.value)}
                      aria-label={`Rol de ${u.nombre}`}
                    >
                      {ROLES.map((r) => <option key={r.id} value={r.id}>{r.etiqueta}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
