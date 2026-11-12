/* Catálogo único de estados y roles: se usa en TODA la aplicación
   para garantizar consistencia de nombres, colores y textos. */

export const ESTADOS = [
  { id: 'pendiente',  etiqueta: 'Pendiente',   color: 'var(--estado-pendiente)',  bg: 'var(--estado-pendiente-bg)' },
  { id: 'progreso',   etiqueta: 'En Progreso', color: 'var(--estado-progreso)',   bg: 'var(--estado-progreso-bg)' },
  { id: 'hecha',      etiqueta: 'Hecha',       color: 'var(--estado-hecha)',      bg: 'var(--estado-hecha-bg)' },
];

export const ROLES = [
  { id: 'administrador', etiqueta: 'Administrador', color: 'var(--rol-admin)',      bg: 'var(--rol-admin-bg)' },
  { id: 'supervisor',    etiqueta: 'Supervisor',    color: 'var(--rol-supervisor)', bg: 'var(--rol-supervisor-bg)' },
  { id: 'usuario',       etiqueta: 'Usuario',       color: 'var(--rol-usuario)',    bg: 'var(--rol-usuario-bg)' },
];

export const estadoInfo = (id) => ESTADOS.find((e) => e.id === id) || ESTADOS[0];
export const rolInfo = (id) => ROLES.find((r) => r.id === id) || ROLES[2];
