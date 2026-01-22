-- ALERTA: Debes ejecutar este script en tu Tablero SQL de Supabase para actualizar la base de datos --

-- 1. Crear el tipo enum si no existe
DO $$ BEGIN
    CREATE TYPE tipo_participacion AS ENUM ('Ponente', 'Asistente');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Agregar la columna a la tabla existente
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS participacion tipo_participacion NOT NULL DEFAULT 'Asistente';

-- 3. (Opcional) Si quieres actualizar registros viejos (aunque el default ya lo hace)
-- UPDATE profiles SET participacion = 'Asistente' WHERE participacion IS NULL;
