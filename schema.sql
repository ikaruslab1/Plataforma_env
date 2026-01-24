-- ==========================================
-- 1. CONFIGURACIÓN INICIAL Y LIMPIEZA
-- ==========================================
-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- (Opcional) Limpiar tablas si se quiere reiniciar de cero (Descomentar con precaución)
-- drop table if exists event_attendance;
-- drop table if exists events;
-- drop table if exists profiles;
-- drop type if exists grado_academico;
-- drop type if exists genero_enum;
-- drop type if exists tipo_participacion;

-- ==========================================
-- 2. CREACIÓN DE ENUMS
-- ==========================================
DO $$ BEGIN
    CREATE TYPE grado_academico AS ENUM ('Doctorado', 'Maestría', 'Licenciatura', 'Estudiante');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE genero_enum AS ENUM ('Masculino', 'Femenino', 'Neutro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_participacion AS ENUM ('Ponente', 'Asistente');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- 3. TABLA PROFILES (Perfiles de Usuario)
-- ==========================================
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  short_id text unique not null,
  nombre text not null,
  apellido text not null,
  grado grado_academico not null,
  genero genero_enum not null,
  participacion tipo_participacion not null default 'Asistente',
  correo text not null,
  telefono text not null,
  
  -- Campos Flexibles de Identidad
  curp text, -- Ahora es opcional (nullable)
  codigo_identidad text, -- Para extranjeros o sin CURP
  fecha_nacimiento date, -- Respaldo si no hay CURP
  nacionalidad text, -- Respaldo si no hay CURP
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para búsqueda rápida
create index if not exists profiles_short_id_idx on profiles(short_id);
create index if not exists profiles_curp_idx on profiles(curp);
create index if not exists profiles_correo_idx on profiles(correo);

-- ==========================================
-- 4. TABLA EVENTS (Eventos)
-- ==========================================
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  event_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 5. TABLA EVENT_ATTENDANCE (Asistencia/Agenda)
-- ==========================================
create table if not exists event_attendance (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  is_interested boolean default false,
  has_attended boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(profile_id, event_id) -- Un usuario solo puede tener un registro por evento
);

-- ==========================================
-- 6. SEGURIDAD (Row Level Security)
-- ==========================================
alter table profiles enable row level security;
alter table events enable row level security;
alter table event_attendance enable row level security;

-- --- POLÍTICAS DE PROFILES ---

-- Permitir inserción anónima (Registro)
create policy "Allow anonymous insert profiles"
on profiles for insert
to anon
with check (true);

-- Permitir lectura pública (Para verificar IDs y mostrar perfiles)
-- Nota: En producción, podrías restringir esto, pero para este sistema se pidió validar login fácilmente.
create policy "Allow public read profiles"
on profiles for select
to anon
using (true);

-- Permitir actualización pública (Opcional, si quieres que el usuario edite su perfil sin auth compleja)
-- Por seguridad básica, es mejor restringirlo o manejarlo vía Server Actions con Service Role (Bypass).
-- create policy "Allow public update profiles" ...

-- --- POLÍTICAS DE EVENTS ---

create policy "Allow public read events"
on events for select
to anon
using (true);

-- --- POLÍTICAS DE ATTENDANCE ---

create policy "Allow public read attendance"
on event_attendance for select
to anon
using (true);

create policy "Allow public insert attendance"
on event_attendance for insert
to anon
with check (true);

create policy "Allow public update attendance"
on event_attendance for update
to anon
using (true);
