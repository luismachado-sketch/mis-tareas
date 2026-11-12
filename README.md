# Mis Tareas · Prototipo de Ingeniería de Software

Prototipo de aplicación web desarrollado para la evaluación **EV-03-2026**
de la asignatura Ingeniería de Software (UA 3: Implementación, pruebas y
calidad de software).

El sistema es un **gestor de tareas** con título, descripción, estado y
usuario responsable, con autenticación, roles de acceso y persistencia
de datos en la nube.

---

## Enlaces del proyecto

| Recurso | URL |
|---|---|
| Aplicación publicada | https://mis-tareas-taupe.vercel.app |
| Vista pública (solo lectura) | https://mis-tareas-taupe.vercel.app/solo-lectura |
| Repositorio | https://github.com/luismachado-sketch/mis-tareas |
| Panel de Vercel | https://vercel.com/ev-03-lm/mis-tareas |

---

## 1. Requisitos previos

| Herramienta | Versión mínima | Para comprobarla |
|---|---|---|
| Node.js | 18 o superior | `node --version` |
| npm | 9 o superior | `npm --version` |
| Visual Studio Code | última estable | `code --version` |
| Git | 2.x | `git --version` |

Opcional para publicar: cuenta en **GitHub**, **Supabase** y **Vercel**.

---

## 2. Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/luismachado-sketch/mis-tareas.git
cd mis-tareas

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (modo producción con Supabase)
copy .env.example .env
# Editar .env y colocar la URL y la clave pública de Supabase

# 4. Ejecutar el servidor de desarrollo
npm run dev
```

Abrir en el navegador: **http://localhost:5173/**

> **Modo demostración:** si no se configura `.env`, la aplicación funciona
> igualmente guardando los datos en el navegador (localStorage). Ideal para
> ensayar la demo sin depender de servicios externos.

### Comandos útiles

```bash
npm run dev      # servidor de desarrollo con recarga automática
npm run build    # compilación de producción en la carpeta dist/
npm run preview  # sirve la compilación de producción
npm run lint     # revisión de código con oxlint
```

---

## 3. Cuentas de prueba (modo demo)

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@demo.cl` | `demo1234` |
| Supervisor | `super@demo.cl` | `demo1234` |
| Usuario | `user@demo.cl` | `demo1234` |

---

## 4. Estructura del proyecto

```
mis-tareas/
├── index.html
├── package.json
├── vite.config.js
├── .env.example              # plantilla de variables de entorno
├── supabase/
│   └── esquema.sql           # tablas, RLS y trigger de perfiles
└── src/
    ├── main.jsx              # punto de entrada con BrowserRouter
    ├── App.jsx               # rutas, barra de navegación y protección
    ├── App.css               # estilos de la aplicación
    ├── index.css             # estilos globales
    ├── styles/
    │   └── tokens.css        # paleta de colores y tipografía
    ├── context/
    │   └── AuthContext.jsx   # estado de sesión
    ├── lib/
    │   ├── supabase.js       # cliente y detección de modo demo
    │   ├── datos.js          # capa de datos (CRUD)
    │   ├── permisos.js       # matriz de permisos por rol
    │   └── estados.js        # catálogo de estados y roles
    ├── components/
    │   ├── FormularioTarea.jsx
    │   ├── TarjetaTarea.jsx
    │   └── Insignias.jsx
    └── pages/
        ├── Acceso.jsx        # inicio de sesión y registro
        ├── Tablero.jsx       # pantalla principal de tareas
        ├── Reporte.jsx       # estadísticas (admin y supervisor)
        └── Usuarios.jsx      # gestión de roles (solo admin)
```

---

## 5. Roles y permisos

| Acción | Administrador | Supervisor | Usuario |
|---|:---:|:---:|:---:|
| Ver todas las tareas | ✅ | ✅ | ❌ |
| Ver solo sus tareas | ❌ | ❌ | ✅ |
| Crear tareas | ✅ | ✅ | ✅ |
| Editar cualquier tarea | ✅ | ✅ | ❌ |
| Editar sus propias tareas | ✅ | ✅ | ✅ |
| Eliminar cualquier tarea | ✅ | ❌ | ❌ |
| Eliminar sus propias tareas | ✅ | ❌ | ✅ |
| Gestionar usuarios y roles | ✅ | ❌ | ❌ |
| Ver reporte de avance | ✅ | ✅ | ❌ |

La misma matriz está implementada en `src/lib/permisos.js` y aplicada en
la base de datos mediante políticas de seguridad por fila (RLS) en
`supabase/esquema.sql`.

---

## 6. Configuración de Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. Ir a **SQL Editor** → pegar y ejecutar el contenido de `supabase/esquema.sql`.
3. En **Project Settings → API** copiar la *Project URL* y la *anon public key*.
4. Pegarlas en el archivo `.env` como `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
5. En **Authentication → Providers** habilitar *Email*.

---

## 7. Publicación en Vercel

1. Subir el repositorio a GitHub:
   ```bash
   git init
   git add .
   git commit -m "Primera versión del prototipo Mis Tareas"
   git branch -M main
   git remote add origin https://github.com/luismachado-sketch/mis-tareas.git
   git push -u origin main
   ```
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importar el repositorio.
3. En **Environment Variables** agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Presionar **Deploy**.
5. Para actualizar: hacer `git push` en GitHub y Vercel vuelve a compilar automáticamente.

---

## 8. Stack tecnológico

| Componente | Tecnología |
|---|---|
| Editor de código | Visual Studio Code |
| Asistente de IA | Claude (a elección del equipo) |
| Entorno de desarrollo | Node.js + npm |
| Frontend | React + JavaScript |
| Herramienta de desarrollo | Vite |
| Control de versiones | Git |
| Repositorio y colaboración | GitHub |
| Backend y base de datos | Supabase + PostgreSQL |
| Alojamiento web | Vercel |

---

*Ingeniería de Software · Unidad de Aprendizaje 3 · EV-03-2026*
