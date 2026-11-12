import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as datos from '../lib/datos'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        await datos.cargarUsuariosEjemplo()
        await datos.cargarEjemplo()
        const s = await datos.obtenerSesion()
        if (s) setUsuario(s)
      } finally {
        setCargando(false)
      }
    })()
  }, [])

  const entrar = useCallback(async (credenciales) => {
    const u = await datos.iniciarSesion(credenciales)
    const perfil = { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol }
    setUsuario(perfil)
    return perfil
  }, [])

  const registrar = useCallback(async (datosForm) => {
    const u = await datos.crearUsuario(datosForm)
    const perfil = { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol || 'usuario' }
    setUsuario(perfil)
    return perfil
  }, [])

  const salir = useCallback(async () => {
    await datos.cerrarSesion()
    setUsuario(null)
  }, [])

  return (
    <AuthCtx.Provider value={{ usuario, cargando, entrar, registrar, salir }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
