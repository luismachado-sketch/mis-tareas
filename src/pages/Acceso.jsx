import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { InsigniaRol } from '../components/Insignias'

/* =========================================================
   PANTALLA DE ACCESO (login / registro)
   ========================================================= */

export default function Acceso() {
  const { entrar, registrar } = useAuth()
  const [modo, setModo] = useState('login')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('usuario')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiarModo = (m) => {
    setModo(m); setError(''); setOk('')
  }

  const enviar = async (e) => {
    e.preventDefault()
    setError(''); setOk('')

    if (!email.trim() || !password) {
      setError('Completa el correo y la contraseña.'); return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('El correo no tiene un formato válido.'); return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.'); return
    }
    if (modo === 'registro' && !nombre.trim()) {
      setError('Ingresa tu nombre completo.'); return
    }

    setEnviando(true)
    try {
      if (modo === 'login') {
        await entrar({ email: email.trim(), password })
      } else {
        await registrar({ nombre: nombre.trim(), email: email.trim(), password, rol })
      }
    } catch (err) {
      setError(err.message || 'No se pudo completar la operación.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="pantalla-acceso">
      <div className="acceso-lado izquierdo">
        <span className="logo-mark">MT</span>
        <h1>Mis Tareas</h1>
        <p>
          Gestor de tareas con roles de acceso, diseño consistente y
          persistencia de datos.
        </p>
        <ul className="lista-beneficios">
          <li>Roles: administrador, supervisor y usuario</li>
          <li>CRUD completo sobre tareas</li>
          <li>Stack: React + Vite + Supabase</li>
        </ul>
      </div>

      <div className="acceso-lado derecho">
        <form className="tarjeta acceso-form" onSubmit={enviar} noValidate>
          <div className="tabs-acceso">
            <button
              type="button"
              className={`tab ${modo === 'login' ? 'activo' : ''}`}
              onClick={() => cambiarModo('login')}
            >Iniciar sesión</button>
            <button
              type="button"
              className={`tab ${modo === 'registro' ? 'activo' : ''}`}
              onClick={() => cambiarModo('registro')}
            >Registrarse</button>
          </div>

          {error && <div className="aviso aviso-error" role="alert">{error}</div>}
          {ok && <div className="aviso aviso-ok" role="status">{ok}</div>}

          {modo === 'registro' && (
            <div className="campo">
              <label htmlFor="nombre">Nombre completo</label>
              <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre" autoComplete="name" />
            </div>
          )}

          <div className="campo">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@correo.cl" autoComplete="email" />
          </div>

          <div className="campo">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'} />
          </div>

          {modo === 'registro' && (
            <div className="campo">
              <label htmlFor="rol">Rol asignado</label>
              <select id="rol" value={rol} onChange={(e) => setRol(e.target.value)}>
                <option value="usuario">Usuario</option>
                <option value="supervisor">Supervisor</option>
                <option value="administrador">Administrador</option>
              </select>
              <div className="ayuda">
                En producción el rol lo asigna un administrador.
              </div>
            </div>
          )}

          <button className="btn btn-primario ancho" type="submit" disabled={enviando}>
            {enviando ? 'Procesando…' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>

          {modo === 'login' && (
            <div className="acceso-demo tarjeta">
              <strong>Cuentas de prueba (modo demo):</strong>
              <div className="demo-linea"><code>admin@demo.cl</code> <InsigniaRol rol="administrador" /></div>
              <div className="demo-linea"><code>super@demo.cl</code> <InsigniaRol rol="supervisor" /></div>
              <div className="demo-linea"><code>user@demo.cl</code> <InsigniaRol rol="usuario" /></div>
              <div className="demo-linea suave">Contraseña: <code>demo1234</code></div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
