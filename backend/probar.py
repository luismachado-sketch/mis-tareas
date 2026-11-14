"""Pruebas automatizadas del backend Python (sin dependencias extra).

Ejecutar con:  python probar.py
Comprueba: CRUD, validaciones, los 3 roles, la matriz de permisos
y la corrección del bug de la tarea que desaparecía al editar.
"""

import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
pasados = 0
fallidos = []


def ok(nombre, condicion, detalle=""):
    global pasados
    if condicion:
        pasados += 1
        print(f"  [OK]   {nombre}")
    else:
        fallidos.append(nombre)
        print(f"  [FALLA] {nombre}  {detalle}")


def llamada(metodo, ruta, datos=None, token=None):
    """Devuelve (status, json) sin lanzar excepción."""
    import json

    cuerpo = None
    if datos is not None:
        cuerpo = json.dumps(datos).encode("utf-8")
    req = urllib.request.Request(
        BASE + ruta, data=cuerpo, method=metodo,
        headers={"Content-Type": "application/json"},
    )
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    # Ignora el proxy del sistema: localhost debe ir en directo.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open(req, timeout=15) as r:
            texto = r.read().decode("utf-8")
            return r.status, json.loads(texto) if texto else None
    except urllib.error.HTTPError as e:
        texto = e.read().decode("utf-8")
        try:
            return e.code, json.loads(texto)
        except Exception:
            return e.code, {"detail": texto}
    except Exception as e:  # servidor caído
        return 0, {"detail": str(e)}


def main():
    print("=" * 62)
    print("  PRUEBAS · API Python «Mis Tareas»")
    print("=" * 62)

    # ---------------------------------------------------------- servicio
    print("\n1. Servicio")
    estado, raiz = llamada("GET", "/")
    ok("El servidor responde", estado == 200, str(estado))
    if estado != 200:
        print("\n  No se puede continuar: el servidor no responde.")
        print("  Arráncalo con:  python -m uvicorn main:app --port 8000")
        return 1
    ok("Declara que está hecho en Python", raiz.get("lenguaje") == "Python")

    # ------------------------------------------------------- validación
    print("\n2. Validación de datos (Actividad 2)")
    estado, r = llamada("POST", "/registro", {
        "nombre": "Prueba Corta", "email": "sin-arroba-demo",
        "password": "123456", "rol": "usuario",
    })
    ok("Rechaza correo sin formato válido",
       estado in (400, 422), str(estado))

    estado, r = llamada("POST", "/registro", {
        "nombre": "Prueba Rol", "email": "rol@demo.cl",
        "password": "123456", "rol": "jefe",
    })
    ok("Rechaza rol inexistente", estado in (400, 422), str(estado))

    estado, r = llamada("POST", "/registro", {
        "nombre": "Prueba Clave", "email": "clave@demo.cl",
        "password": "123", "rol": "usuario",
    })
    ok("Rechaza contraseña de menos de 6 caracteres",
       estado in (400, 422), str(estado))

    # --------------------------------------------------------- registro
    print("\n3. Registro y login")
    correo_admin = "admin.py@demo.cl"
    correo_super = "super.py@demo.cl"
    correo_user = "user.py@demo.cl"

    estado, admin = llamada("POST", "/registro", {
        "nombre": "Admin Python", "email": correo_admin,
        "password": "demo1234", "rol": "administrador",
    })
    ok("Crea administrador", estado == 201, str(estado))

    _, super_ = llamada("POST", "/registro", {
        "nombre": "Super Python", "email": correo_super,
        "password": "demo1234", "rol": "supervisor",
    })
    ok("Crea supervisor", estado == 201)

    _, user = llamada("POST", "/registro", {
        "nombre": "Usuario Python", "email": correo_user,
        "password": "demo1234", "rol": "usuario",
    })
    ok("Crea usuario", estado == 201)

    estado, r = llamada("POST", "/registro", {
        "nombre": "Admin Python", "email": correo_admin,
        "password": "demo1234", "rol": "administrador",
    })
    ok("Rechaza correo repetido", estado == 400, str(estado))

    estado, r = llamada("POST", "/login", {"email": correo_admin, "password": "mala"})
    ok("Rechaza contraseña incorrecta", estado == 401, str(estado))

    estado, tok_admin = llamada("POST", "/login", {"email": correo_admin, "password": "demo1234"})
    ok("Login de administrador", estado == 200 and "token" in tok_admin)
    _, tok_super = llamada("POST", "/login", {"email": correo_super, "password": "demo1234"})
    _, tok_user = llamada("POST", "/login", {"email": correo_user, "password": "demo1234"})

    a = tok_admin.get("token")
    s = tok_super.get("token")
    u = tok_user.get("token")

    estado, r = llamada("GET", "/yo", token="token-falso")
    ok("Rechaza token inválido", estado == 401, str(estado))

    # ------------------------------------------------------------ CRUD
    print("\n4. CRUD de tareas")
    estado, t1 = llamada("POST", "/tareas", {
        "titulo": "Tarea creada por el usuario",
        "descripcion": "Debe seguir visible al editarla",
        "estado": "pendiente",
    }, token=u)
    ok("Usuario crea tarea", estado == 201, str(estado))
    ok("Queda asignada al creador", t1.get("responsable_id") is not None)

    estado, r = llamada("POST", "/tareas", {"titulo": "ab"}, token=u)
    ok("Rechaza título de menos de 3 caracteres", estado in (400, 422), str(estado))

    estado, r = llamada("POST", "/tareas", {"titulo": "Estado inválido", "estado": "listo"}, token=u)
    ok("Rechaza estado inválido", estado in (400, 422), str(estado))

    tid = t1.get("id")

    # ---- LA PRUEBA DEL BUG ----
    print("\n5. Regresión: la tarea NO debe desaparecer al editarla")
    estado, r = llamada("PUT", f"/tareas/{tid}", {
        "titulo": "Tarea creada por el usuario",
        "descripcion": "Editada",
        "estado": "hecha",
    }, token=u)
    ok("El usuario puede editar su propia tarea", estado == 200, str(estado))
    ok("Sigue teniendo responsable después de editar",
       r.get("responsable_id") is not None, str(r.get("responsable_id")))

    estado, lista = llamada("GET", "/tareas", token=u)
    if not isinstance(lista, list):
        ok("La lista de tareas responde correctamente", False, str(lista))
        lista = []
    ids = [t["id"] for t in lista]
    ok("La tarea sigue en la lista del usuario", tid in ids, str(ids))
    ok("Y está marcada como hecha",
       any(t["id"] == tid and t["estado"] == "hecha" for t in lista))

    estado, r = llamada("PATCH", f"/tareas/{tid}/estado", {"estado": "progreso"}, token=u)
    ok("Cambio de estado directo", estado == 200 and r.get("estado") == "progreso")

    # ------------------------------------------------------- permisos
    print("\n6. Permisos por rol")
    _, t_admin = llamada("POST", "/tareas", {"titulo": "Tarea del administrador"}, token=a)

    estado, lista_u = llamada("GET", "/tareas", token=u)
    ok("El usuario NO ve tareas ajenas",
       t_admin.get("id") not in [t["id"] for t in lista_u])

    estado, lista_a = llamada("GET", "/tareas", token=a)
    ok("El administrador ve TODAS las tareas", estado == 200 and len(lista_a) >= 2)

    estado, r = llamada("DELETE", f"/tareas/{t_admin['id']}", token=u)
    ok("El usuario NO puede eliminar tarea ajena", estado == 403, str(estado))

    estado, r = llamada("PUT", f"/tareas/{t_admin['id']}", {
        "titulo": "Tarea del administrador", "estado": "hecha",
    }, token=u)
    ok("El usuario NO puede editar tarea ajena", estado == 403, str(estado))

    estado, r = llamada("DELETE", f"/tareas/{t_admin['id']}", token=s)
    ok("El supervisor NO puede eliminar tareas", estado == 403, str(estado))

    estado, r = llamada("PUT", f"/tareas/{t_admin['id']}", {
        "titulo": "Tarea del administrador", "estado": "hecha",
    }, token=s)
    ok("El supervisor SÍ puede editar tareas", estado == 200, str(estado))

    estado, r = llamada("GET", "/usuarios", token=u)
    ok("El usuario NO ve el listado de usuarios", estado == 403, str(estado))

    estado, r = llamada("GET", "/usuarios", token=a)
    ok("El administrador SÍ ve el listado", estado == 200)

    estado, r = llamada("GET", "/reporte", token=u)
    ok("El usuario NO ve el reporte", estado == 403, str(estado))

    estado, rep = llamada("GET", "/reporte", token=s)
    ok("El supervisor SÍ ve el reporte", estado == 200)
    ok("El reporte calcula el total", isinstance(rep.get("total"), int))

    # -------------------------------------------------- gestión de roles
    print("\n7. Gestión de usuarios")
    uid_user = user.get("id")
    estado, r = llamada("PUT", f"/usuarios/{uid_user}/rol", {"rol": "supervisor"}, token=a)
    ok("El administrador cambia roles", estado == 200 and r.get("rol") == "supervisor")

    estado, r = llamada("PUT", f"/usuarios/{uid_user}/rol", {"rol": "usuario"}, token=s)
    ok("El supervisor NO gestiona usuarios", estado == 403, str(estado))

    estado, r = llamada("PUT", f"/usuarios/{tok_admin.get('id')}/rol",
                        {"rol": "usuario"}, token=a)
    ok("El administrador no se quita su propio rol", estado == 400, str(estado))

    # ------------------------------------------------------- resumen
    print("\n" + "=" * 62)
    if fallidos:
        print(f"  RESULTADO: {pasados} correctas, {len(fallidos)} fallidas")
        for f in fallidos:
            print(f"    - {f}")
        print("=" * 62)
        return 1
    print(f"  RESULTADO: las {pasados} pruebas pasaron correctamente")
    print("=" * 62)
    return 0


if __name__ == "__main__":
    sys.exit(main())
