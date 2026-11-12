import { createClient } from '@supabase/supabase-js'

/* =========================================================
   Configuración de Supabase
   Si existen las variables de entorno se usa Supabase real.
   Si no, la aplicación entra en MODO DEMO: guarda los datos
   en el navegador (localStorage) para poder demostrar el
   prototipo sin credenciales.
   ========================================================= */

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const SUPABASE_ACTIVO = Boolean(url && anon)

export const supabase = SUPABASE_ACTIVO ? createClient(url, anon) : null

export const configResumen = SUPABASE_ACTIVO
  ? { modo: 'Supabase (producción)', url }
  : { modo: 'Modo demo (localStorage)', url: 'sin VITE_SUPABASE_URL' }
