# Plan de Implementación: Sistema de Registro Académico

## 1. Configuración Inicial del Proyecto

- [x] Inicializar proyecto Next.js 14 con TypeScript y Tailwind CSS.
- [ ] Instalar dependencias clave:
  - `zod`, `react-hook-form`, `@hookform/resolvers` (Manejo de formularios).
  - `@supabase/ssr`, `@supabase/supabase-js` (Base de datos).
  - `qrcode.react` (Generación de QR).
  - `lucide-react` (Iconos).
  - `framer-motion` (Opcional, para animaciones minimalistas y "premium").
- [ ] Configurar variables de entorno (`.env.local`).
- [ ] Configurar limpieza de estilos base en `globals.css` para un look "premium" (fuentes Inter/Outfit, esquema de colores).

## 2. Base de Datos & Tipos (Supabase)

- [x] Ejecutar `schema.sql` en el dashboard de Supabase (Editor SQL).
- [ ] Generar definiciones de tipos TypeScript para Supabase (o definirlas manualmente para `profiles` basado en el schema).

## 3. Utilerías y Helpers

- [ ] `lib/supabase/client.ts`: Cliente para componentes cliente.
- [ ] `lib/supabase/server.ts`: Cliente para componentes servidor/actions.
- [ ] `lib/utils.ts`:
  - `generateShortId(grado)`: Genera IDs únicos (ej: "DOC-1234").
  - `getDegreeAbbr(grado, genero)`: Retorna abreviatura (ej: "Dra.").

## 4. Componentes UI (Diseño Minimalista)

- [ ] `components/ui/Button.tsx`: Variantes (Primary, Outline).
- [ ] `components/ui/Input.tsx`: Estilizado con estados de error.
- [ ] `components/ui/Select.tsx`: Select nativo o custom limpio.
- [ ] `components/ui/Dialog.tsx`: Modal para feedback de registro.
- [ ] `components/ui/Card.tsx`: Contenedor para el perfil.

## 5. Desarrollo de Funcionalidades

### 5.1 Home (`/`)

- [ ] Implementar **Server Action** `registerUser`:
  - Validar datos con Zod.
  - Generar `short_id` (reintentar si colisiona, aunque improbable).
  - Insertar en Supabase.
  - Retornar éxito/error.
- [ ] Implementar **Formulario de Registro**:
  - Validaciones de campo (CURP, Coincidencia de correo).
  - Feedback visual (loading, success modal).
- [ ] Implementar **Formulario de Login**:
  - Input para `short_id`.
  - Validación de existencia (Server Action `verifyUser`).
  - Redirección a `/profile/[short_id]`.

### 5.2 Perfil (`/profile/[short_id]`)

- [ ] Carga de datos `server-side` (`generateMetadata` dinámico también).
- [ ] Manejo de estado de carga/error (Skeleton o 404).
- [ ] Renderizado de tarjeta de identidad:
  - Header visual.
  - Nombre con prefijo (`getDegreeAbbr`).
  - QR Code dinámico.
  - Botón para imprimir o regresar.

## 6. Revisión y Pulido

- [ ] Verificar RLS en Supabase.
- [ ] Auditar accesibilidad y diseño responsive.
- [ ] Pruebas manuales de flujo completo.
