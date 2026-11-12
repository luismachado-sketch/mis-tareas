-- =========================================================
-- ESQUEMA DE BASE DE DATOS - Prototipo "Mis Tareas"
-- Motor: PostgreSQL (Supabase)
-- Ejecutar en: Supabase > SQL Editor > New query
-- =========================================================

-- ---------- 1. TABLA DE PERFILES (roles de usuario) ----------
create table if not exists public.perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null,
  email       text not null unique,
  rol         text not null default 'usuario'
              check (rol in ('administrador', 'supervisor', 'usuario')),
  creado_en   timestamptz not null default now()
);

comment on column public.perfiles.rol is
  'Rol de acceso: administrador, supervisor o usuario.';

-- ---------- 2. TABLA DE TAREAS ----------
create table if not exists public.tareas (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null check (length(trim(titulo)) >= 3),
  descripcion    text default '',
  estado         text not null default 'pendiente'
                 check (estado in ('pendiente', 'progreso', 'hecha')),
  responsable    text default '',
  responsable_id uuid references auth.users (id) on delete set null,
  creada_en      timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

create index if not exists idx_tareas_estado      on public.tareas (estado);
create index if not exists idx_tareas_responsable on public.tareas (responsable_id);

-- ---------- 3. FUNCIÓN AUXILIAR ----------
-- Devuelve el rol del usuario autenticado en la sesión actual.
create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'administrador'
  );
$$;

create or replace function public.es_supervisor_o_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol in ('administrador', 'supervisor')
  );
$$;

-- ---------- 4. PERMISO DE LECTURA ----------
-- Administrador y supervisor ven todas las tareas.
-- El usuario normal solo ve las suyas.
create policy "leer tareas segun rol"
  on public.tareas for select
  using (
    es_supervisor_o_admin()
    or responsable_id = auth.uid()
  );

-- ---------- 5. PERMISO DE CREAR ----------
-- Cualquier usuario autenticado puede crear tareas.
create policy "crear tareas autenticado"
  on public.tareas for insert
  with check (auth.uid() is not null);

-- ---------- 6. PERMISO DE MODIFICAR ----------
-- El responsable, los supervisores y administradores pueden editar.
create policy "editar tareas segun rol"
  on public.tareas for update
  using (
    es_supervisor_o_admin()
    or responsable_id = auth.uid()
  );

-- ---------- 7. PERMISO DE ELIMINAR ----------
-- Solo el administrador y el responsable pueden eliminar.
create policy "eliminar tareas segun rol"
  on public.tareas for delete
  using (
    es_admin()
    or responsable_id = auth.uid()
  );

-- ---------- 8. PERFILES: LECTURA Y ADMINISTRACIÓN ----------
create policy "leer todos los perfiles"
  on public.perfiles for select using (true);

create policy "administrar perfiles"
  on public.perfiles for update
  using (es_admin());

create policy "insertar propio perfil"
  on public.perfiles for insert
  with check (id = auth.uid());

-- ---------- 9. TRIGGER: crear perfil al registrarse ----------
create or replace function public.crear_perfil()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'rol', 'usuario')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists tr_crear_perfil on auth.users;
create trigger tr_crear_perfil
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ---------- 10. RLS ACTIVO ----------
alter table public.perfiles enable row level security;
alter table public.tareas   enable row level security;

-- =========================================================
-- VERIFICACIÓN
-- =========================================================
-- select * from public.tareas;
-- select id, nombre, email, rol from public.perfiles;
