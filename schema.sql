-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Enums
create type grado_academico as enum ('Doctorado', 'Maestría', 'Licenciatura', 'Estudiante');
create type genero_enum as enum ('Masculino', 'Femenino', 'Neutro');
create type tipo_participacion as enum ('Ponente', 'Asistente');

-- Create Profiles Tables
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  short_id text unique not null,
  nombre text not null,
  apellido text not null,
  grado grado_academico not null,
  genero genero_enum not null,
  participacion tipo_participacion not null default 'Asistente',
  curp text not null,
  correo text not null,
  telefono text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table profiles enable row level security;

-- Policy to allow anonymous insertion (for registration)
create policy "Allow anonymous insert"
on profiles for insert
to anon
with check (true);

-- Policy to allow public read (for verifying ID and viewing profile)
create policy "Allow public read"
on profiles for select
to anon
using (true);

-- Indexes for performance
create index profiles_short_id_idx on profiles(short_id);
create index profiles_curp_idx on profiles(curp);
