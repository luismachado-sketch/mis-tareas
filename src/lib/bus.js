/* =========================================================
   CANAL DE SINCRONIZACIÓN ENTRE VISTAS
   Permite que un cambio realizado en el tablero principal
   se refleje al instante en la vista de solo lectura, tanto
   en la misma pestaña como entre pestañas del navegador.
   ========================================================= */

const CANAL = 'mt-cambios-canal'
const EVENTO = 'mt:datos-cambiados'

let canal = null
if (typeof BroadcastChannel !== 'undefined') {
  canal = new BroadcastChannel(CANAL)
}

/** Avisa que los datos cambiaron. */
export function avisarCambio() {
  try {
    if (canal) canal.postMessage({ en: Date.now() })
  } catch { /* canal no disponible */ }
  try {
    window.dispatchEvent(new CustomEvent(EVENTO))
  } catch { /* entorno sin eventos */ }
}

/** Se suscribe a los cambios. Devuelve la función de baja. */
export function escucharCambio(callback) {
  const porCanal = (e) => callback(e?.data || {})
  const porEvento = () => callback({})

  if (canal) canal.addEventListener('message', porCanal)
  window.addEventListener(EVENTO, porEvento)

  /* Si los datos se guardan en otra pestaña, storage también avisa */
  const porStorage = (e) => { if (e.key) callback({}) }
  window.addEventListener('storage', porStorage)

  return () => {
    if (canal) canal.removeEventListener('message', porCanal)
    window.removeEventListener(EVENTO, porEvento)
    window.removeEventListener('storage', porStorage)
  }
}
