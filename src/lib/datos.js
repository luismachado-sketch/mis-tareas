/* =========================================================
   CAPA DE DATOS
   Expone una única API para la interfaz.
   - Si Supabase está configurado, usa la base de datos.
   - Si no, usa localStorage (modo demostración).
   ========================================================= */

import { supabase, SUPABASE_ACTIVO } from './supabase'
import { avisarCambio } from './bus'

const K_TAREAS = 'mt_tareas'
const K_USUARIOS = 'mt_usuarios'
const K_SESION = 'mt_sesion'

/* ---------- utilidades locales ---------- */
const leer = (k, def) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? def } catch { return def }
}
const guardar = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const uid = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())

/* ---------- USUARIOS ---------- */
export async function listarUsuarios() {
  if (SUPABASE_ACTIVO) {
    const { data, error } = await supabase.from('perfiles').select('*').order('nombre')
    if (error) throw error
    return data
  }
  return leer(K_USUARIOS, [])
}

export async function crearUsuario({ nombre, email, password, rol = 'usuario' }) {
  if (SUPABASE_ACTIVO) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { nombre, rol } },
    })
    if (error) throw error
    return data.user
  }

  const usuarios = leer(K_USUARIOS, [])
  if (usuarios.some((u) => u.email === email)) {
    throw new Error('Ya existe una cuenta con ese correo.')
  }
  const nuevo = { id: uid(), nombre, email, password, rol, creado: new Date().toISOString() }
  usuarios.push(nuevo)
  guardar(K_USUARIOS, usuarios)
  return nuevo
}

export async function iniciarSesion({ email, password }) {
  if (SUPABASE_ACTIVO) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  }

  const usuarios = leer(K_USUARIOS, [])
  const u = usuarios.find((x) => x.email === email && x.password === password)
  if (!u) throw new Error('Correo o contraseña incorrectos.')
  const sesion = { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol }
  guardar(K_SESION, sesion)
  return sesion
}

export async function cerrarSesion() {
  if (SUPABASE_ACTIVO) { await supabase.auth.signOut(); return }
  localStorage.removeItem(K_SESION)
}

export async function obtenerSesion() {
  if (SUPABASE_ACTIVO) {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return null
    const u = data.session.user
    const rol = u.user_metadata?.rol || 'usuario'
    return { id: u.id, nombre: u.user_metadata?.nombre || u.email, email: u.email, rol }
  }
  return leer(K_SESION, null)
}

export async function cambiarRol(id, rol) {
  if (SUPABASE_ACTIVO) {
    const { error } = await supabase.from('perfiles').update({ rol }).eq('id', id)
    if (error) throw error
    return
  }
  const usuarios = leer(K_USUARIOS, [])
  const i = usuarios.findIndex((u) => u.id === id)
  if (i >= 0) { usuarios[i].rol = rol; guardar(K_USUARIOS, usuarios) }
}

/* ---------- TAREAS ---------- */
export async function listarTareas({ soloPropias = false, userId = null } = {}) {
  if (SUPABASE_ACTIVO) {
    let q = supabase.from('tareas').select('*').order('creada_en', { ascending: false })
    if (soloPropias) q = q.eq('responsable_id', userId)
    const { data, error } = await q
    if (error) throw error
    return data
  }

  let tareas = leer(K_TAREAS, [])
  if (soloPropias) tareas = tareas.filter((t) => t.responsable_id === userId)
  return tareas.sort((a, b) => (b.creada_en || '').localeCompare(a.creada_en || ''))
}

export async function crearTarea(tarea) {
  const nueva = {
    id: uid(),
    titulo: tarea.titulo.trim(),
    descripcion: (tarea.descripcion || '').trim(),
    estado: tarea.estado || 'pendiente',
    responsable: tarea.responsable || '',
    responsable_id: tarea.responsable_id || null,
    creada_en: new Date().toISOString(),
    actualizada_en: new Date().toISOString(),
  }

  if (SUPABASE_ACTIVO) {
    const { data, error } = await supabase.from('tareas').insert(nueva).select().single()
    if (error) throw error
    avisarCambio()
    return data
  }

  const tareas = leer(K_TAREAS, [])
  tareas.unshift(nueva)
  guardar(K_TAREAS, tareas)
  avisarCambio()
  return nueva
}

export async function actualizarTarea(id, cambios) {
  cambios.actualizada_en = new Date().toISOString()

  if (SUPABASE_ACTIVO) {
    const { data, error } = await supabase
      .from('tareas').update(cambios).eq('id', id).select().single()
    if (error) throw error
    avisarCambio()
    return data
  }

  const tareas = leer(K_TAREAS, [])
  const i = tareas.findIndex((t) => t.id === id)
  if (i < 0) throw new Error('Tarea no encontrada.')
  tareas[i] = { ...tareas[i], ...cambios }
  guardar(K_TAREAS, tareas)
  avisarCambio()
  return tareas[i]
}

export async function eliminarTarea(id) {
  if (SUPABASE_ACTIVO) {
    const { error } = await supabase.from('tareas').delete().eq('id', id)
    if (error) throw error
    avisarCambio()
    return
  }
  guardar(K_TAREAS, leer(K_TAREAS, []).filter((t) => t.id !== id))
  avisarCambio()
}

/* ---------- DATOS DE EJEMPLO ---------- */
export async function cargarEjemplo() {
  const existentes = leer(K_TAREAS, [])
  if (existentes.length) return

  /* Se asignan a los usuarios de demo para que cada rol
     tenga tareas visibles según sus permisos. */
  const usuarios = leer(K_USUARIOS, [])
  const idDe = (email) => usuarios.find((u) => u.email === email)?.id || null
  const nombreDe = (email) => usuarios.find((u) => u.email === email)?.nombre || ''

  const base = [
    { titulo: 'Presentación ing de software', descripcion: 'Exponer las tecnologías que al grupo le tocó y preparar PDF con la guía de pasos.', estado: 'hecha', email: 'user@demo.cl' },
    { titulo: 'Definir roles del prototipo', descripcion: 'Enumerar accesos y restricciones de administrador, supervisor y usuario.', estado: 'progreso', email: 'super@demo.cl' },
    { titulo: 'Diseñar la paleta de colores', descripcion: 'Elegir colores y tipografía consistentes para todas las pantallas.', estado: 'pendiente', email: 'admin@demo.cl' },
    { titulo: 'Configurar RLS en Supabase', descripcion: 'Política para que cada usuario solo vea sus propias tareas.', estado: 'pendiente', email: 'user@demo.cl' },
    { titulo: 'Publicar en Vercel', descripcion: 'Variables de entorno y despliegue desde GitHub.', estado: 'pendiente', email: 'super@demo.cl' },
    { titulo: 'Revisar políticas de acceso', descripcion: 'Verificar que el rol supervisor no pueda eliminar tareas.', estado: 'pendiente', email: 'admin@demo.cl' },
  ]

  guardar(K_TAREAS, base.map((t) => ({
    titulo: t.titulo,
    descripcion: t.descripcion,
    estado: t.estado,
    responsable: nombreDe(t.email),
    responsable_id: idDe(t.email),
    id: uid(),
    creada_en: new Date().toISOString(),
    actualizada_en: new Date().toISOString(),
  })))
}

/* ---------- USUARIOS DE EJEMPLO (modo demo) ---------- */
export async function cargarUsuariosEjemplo() {
  if (leer(K_USUARIOS, []).length) return
  guardar(K_USUARIOS, [
    { id: uid(), nombre: 'Administrador Demo', email: 'admin@demo.cl', password: 'demo1234', rol: 'administrador', creado: new Date().toISOString() },
    { id: uid(), nombre: 'Supervisor Demo',   email: 'super@demo.cl', password: 'demo1234', rol: 'supervisor',    creado: new Date().toISOString() },
    { id: uid(), nombre: 'Usuario Demo',      email: 'user@demo.cl',  password: 'demo1234', rol: 'usuario',       creado: new Date().toISOString() },
  ])
}
