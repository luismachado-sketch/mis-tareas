import { useState } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Acceso from './pages/Acceso'
import Tablero from './pages/Tablero'
import Usuarios from './pages/Usuarios'
import Reporte from './pages/Reporte'
import SoloLectura from './pages/SoloLectura'
import { InsigniaRol } from './components/Insignias'
import { puede } from './lib/permisos'
import { configResumen } from './lib/supabase'
import './App.css'

function BarraNavegacion() {
  const { usuario, salir } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const enlaces = [
    { to: '/tareas', etiqueta: 'Mis tareas', condicion: true },
    { to: '/reporte', etiqueta: 'Reporte', condicion: puede(usuario.rol, 'reporte.ver') },
    { to: '/usuarios', etiqueta: 'Usuarios', condicion: puede(usuario.rol, 'usuario.ver_listado') },
  ].filter((e) => e.condicion)

  return (
    <header className="barra-nav">
      <div className="contenedor fila separar">
        <div className="marca">
          <span className="logo-mark chico-mark">MT</span>
          <span className="nombre-marca">Mis Tareas</span>
        </div>

        <nav className={`nav-enlaces ${menuAbierto ? 'abierto' : ''}`}>
          {enlaces.map((e) => (
            <NavLink
              key={e.to}
              to={e.to}
              className={({ isActive }) => `enlace ${isActive ? 'activo' : ''}`}
              onClick={() => setMenuAbierto(false)}
            >{e.etiqueta}</NavLink>
          ))}
          <a className="enlace enlace-lectura" href="/solo-lectura" target="_blank" rel="noreferrer">
            Vista pública ↗
          </a>
        </nav>

        <div className="usuario-nav">
          <div className="datos-usuario">
            <span className="nombre-usuario">{usuario.nombre}</span>
            <InsigniaRol rol={usuario.rol} />
          </div>
          <button className="btn btn-secundario btn-sm" onClick={salir}>
            Cerrar sesión
          </button>
          <button
            className="btn btn-fantasma btn-sm menu-toggle"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label="Abrir menú"
          >☰</button>
        </div>
      </div>
    </header>
  )
}

function ContenidoProtegido() {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  /* ---- Zona pública: solo lectura, no requiere sesión ---- */
  if (location.pathname === '/solo-lectura') {
    return <SoloLectura />
  }

  if (cargando) {
    return <div className="vacio" style={{ marginTop: 80 }}>Cargando aplicación…</div>
  }

  if (!usuario) {
    return <Acceso />
  }

  return (
    <>
      <BarraNavegacion />
      <main className="contenedor contenido-principal">
        <Routes>
          <Route path="/" element={<Navigate to="/tareas" replace />} />
          <Route path="/tareas" element={<Tablero />} />
          <Route path="/reporte" element={<Reporte />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="*" element={<Navigate to="/tareas" replace state={{ from: location }} />} />
        </Routes>
      </main>
      <footer className="pie">
        <div className="contenedor fila separar chico suave">
          <span>Prototipo · Ingeniería de Software · EV-03-2026</span>
          <span>{configResumen.modo}</span>
        </div>
      </footer>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ContenidoProtegido />
    </AuthProvider>
  )
}
