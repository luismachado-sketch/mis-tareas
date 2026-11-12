import { estadoInfo, rolInfo } from '../lib/estados'

export function InsigniaEstado({ estado }) {
  const e = estadoInfo(estado)
  return (
    <span className="insignia" style={{ color: e.color, background: e.bg }}>
      {e.etiqueta}
    </span>
  )
}

export function InsigniaRol({ rol }) {
  const r = rolInfo(rol)
  return (
    <span className="insignia" style={{ color: r.color, background: r.bg }}>
      {r.etiqueta}
    </span>
  )
}
