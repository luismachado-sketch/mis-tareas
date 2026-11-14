# Backend en Python · «Mis Tareas»

API REST escrita en **Python 3.10 + FastAPI**, con el mismo esquema de
datos y la **misma matriz de permisos por rol** que el frontend React.
Permite que el prototipo funcione con Python por una parte y con
Supabase por la otra, sin cambiar la forma de los datos.

---

## 1. Requisitos

| Herramienta | Versión usada | Comprobación |
|---|---|---|
| Python | 3.10.10 | `python --version` |
| pip | 22.3.1 | `python -m pip --version` |
| FastAPI | 0.162.5 | instalado con pip |
| Uvicorn | 0.54.0 | instalado con pip |

---

## 2. Instalación

```powershell
cd backend
python -m pip install -r requirements.txt
```

---

## 3. Arrancar el servidor

```powershell
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

| Recurso | URL |
|---|---|
| Raíz (describe la API) | http://127.0.0.1:8000 |
| Documentación interactiva | http://127.0.0.1:8000/docs |
| Esquema OpenAPI (JSON) | http://127.0.0.1:8000/openapi.json |

La base `mis_tareas.db` (SQLite) se crea sola en la primera ejecución.

---

## 4. Ejecutar las pruebas

Con el servidor corriendo, en otra terminal:

```powershell
python probar.py
```

Resultado esperado: **las 35 pruebas pasaron correctamente**.

Cubren: validación de datos, registro e inicio de sesión, CRUD de
tareas, la **regresión del bug de la tarea que desaparecía al editarla**,
permisos de los 3 roles y gestión de usuarios.

---

## 5. Archivos

| Archivo | Función |
|---|---|
| `main.py` | Rutas de la API y validación con Pydantic |
| `database.py` | Conexión SQLite y esquema de tablas |
| `permisos.py` | Matriz de permisos por rol (espejo de `permisos.js`) |
| `auth.py` | Hash de contraseñas (PBKDF2) y tokens firmados (HMAC) |
| `probar.py` | 35 pruebas automatizadas sin dependencias extra |
| `requirements.txt` | Dependencias de Python |
| `mis_tareas.db` | Base de datos SQLite (se genera sola) |
| `.secreto` | Secreto de firma de los tokens (no se sube a Git) |

---

## 6. Endpoints

### Autenticación

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/registro` | Crea una cuenta | público |
| POST | `/login` | Devuelve un token | público |
| GET | `/yo` | Perfil del token | sesión |

### Tareas

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/tareas` | Lista (con `estado` y `buscar`) | sesión |
| POST | `/tareas` | Crea una tarea | `tarea.crear` |
| PUT | `/tareas/{id}` | Edita una tarea | permiso sobre esa tarea |
| PATCH | `/tareas/{id}/estado` | Cambia solo el estado | permiso sobre esa tarea |
| DELETE | `/tareas/{id}` | Elimina una tarea | permiso sobre esa tarea |

### Usuarios y reporte

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/usuarios` | Listado de usuarios | `usuario.ver_listado` |
| PUT | `/usuarios/{id}/rol` | Cambia el rol | `usuario.gestionar` |
| GET | `/reporte` | Estadísticas | `reporte.ver` |

---

## 7. Ejemplo de uso

```powershell
# 1. Registrar
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/registro `
  -ContentType "application/json" `
  -Body '{"nombre":"Luis","email":"luis@demo.cl","password":"demo1234","rol":"administrador"}'

# 2. Iniciar sesión (guarda el token)
$tok = (Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/login `
  -ContentType "application/json" `
  -Body '{"email":"luis@demo.cl","password":"demo1234"}').token

# 3. Crear una tarea
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/tareas `
  -ContentType "application/json" -Headers @{Authorization="Bearer $tok"} `
  -Body '{"titulo":"Mi primera tarea","estado":"pendiente"}'

# 4. Listar
Invoke-RestMethod -Uri http://127.0.0.1:8000/tareas -Headers @{Authorization="Bearer $tok"}
```

---

## 8. Matriz de permisos (idéntica al frontend)

| Acción | Administrador | Supervisor | Usuario |
|---|:---:|:---:|:---:|
| `tarea.ver_todas` | ✅ | ✅ | — |
| `tarea.ver_propias` | — | — | ✅ |
| `tarea.crear` | ✅ | ✅ | ✅ |
| `tarea.editar_cualquiera` | ✅ | ✅ | — |
| `tarea.editar_propia` | — | — | ✅ |
| `tarea.eliminar_cualquiera` | ✅ | — | — |
| `tarea.eliminar_propia` | — | — | ✅ |
| `usuario.ver_listado` | ✅ | — | — |
| `usuario.gestionar` | ✅ | — | — |
| `reporte.ver` | ✅ | ✅ | — |

---

## 9. Seguridad implementada

| Control | Cómo se aplica |
|---|---|
| Contraseñas | PBKDF2-HMAC-SHA256, 100 000 iteraciones, sal de 16 bytes |
| Sesiones | Token firmado con HMAC-SHA256, caduca en 12 horas |
| Autorización | Verificación del rol **antes** de cada consulta |
| Validación | Pydantic rechaza correo, rol, estado o título inválidos |
| Archivos secretos | `.secreto` y `mis_tareas.db` fuera de Git |

---

## 10. Relación con el resto del proyecto

```
src/lib/permisos.js   ←→  backend/permisos.py     (misma matriz)
supabase/esquema.sql  ←→  backend/database.py     (mismas tablas)
src/lib/datos.js      ←→  backend/main.py         (mismas operaciones)
```

Si se cambia un permiso en uno, hay que cambiarlo en el otro.

---

Prototipo «Mis Tareas» · Ingeniería de Software · EV-03-2026
Luis Gabriel Machado Vasquez
