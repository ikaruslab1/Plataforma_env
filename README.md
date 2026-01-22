# Sistema de Perfiles Académicos

Este proyecto es un sistema de registro y gestión de perfiles académicos, diseñado para eventos como congresos, seminarios o conferencias. Permite a los usuarios registrarse, obtener una identificación única y visualizar un perfil público con un código QR para una fácil identificación.

## Características Principales

- **Registro de Usuarios:** Formulario de inscripción para nuevos participantes.
- **Generación de ID Único:** Asignación automática de un `short_id` para cada usuario.
- **Perfil Público:** Página de perfil individual con los datos del participante.
- **Código QR:** Generación de un código QR en el perfil para una rápida identificación y acceso.
- **Inicio de Sesión por ID:** Acceso rápido al perfil utilizando el `short_id`.

## Stack Tecnológico

- **Framework:** [Next.js](https://nextjs.org/)
- **Base de Datos:** [Supabase](https://supabase.io/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Manejo de Formularios:** [React Hook Form](https://react-hook-form.com/) y [Zod](https://zod.dev/)
- **Componentes de UI:** [Lucide React](https://lucide.dev/guide/packages/lucide-react) (iconos)
- **Generación de QR:** `qrcode.react`

## Cómo Empezar

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos

- Node.js (v18 o superior)
- npm, pnpm, or yarn
- Una cuenta de Supabase

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/nombre-del-repositorio.git
cd nombre-del-repositorio
```

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Configurar Supabase

1.  **Crear un Nuevo Proyecto:** Ve a tu [dashboard de Supabase](https://app.supabase.io) y crea un nuevo proyecto.
2.  **Obtener Credenciales:** En la configuración de tu proyecto, ve a la sección de **API** y copia la **URL del Proyecto** y la **llave `anon` pública**.
3.  **Configurar Variables de Entorno:**
    -   Crea un archivo `.env.local` en la raíz del proyecto.
    -   Añade las siguientes variables de entorno:

    ```env
    NEXT_PUBLIC_SUPABASE_URL="TU_PROJECT_URL"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="TU_ANON_KEY"
    ```

4.  **Ejecutar el Schema SQL:**
    -   Ve al **Editor SQL** en tu dashboard de Supabase.
    -   Copia y pega el contenido del archivo `schema.sql` y ejecútalo para crear las tablas y políticas de seguridad.

### 4. Ejecutar el Servidor de Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación en funcionamiento.

## Estructura del Proyecto

```
/
├── app/                  # Rutas y lógica principal de la aplicación
│   ├── admin/            # (Futuro) Panel de administración
│   ├── profile/          # Página de perfil de usuario
│   ├── actions.ts        # Server Actions
│   ├── globals.css       # Estilos globales
│   └── page.tsx          # Página de inicio (registro y login)
├── components/           # Componentes reutilizables de la UI
├── lib/                  # Funciones y clientes de servicios
│   └── supabase/         # Clientes de Supabase para cliente y servidor
├── public/               # Archivos estáticos
└── schema.sql            # Definición del schema de la base de datos
```

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un *issue* para discutir cambios importantes o envía un *pull request*.
