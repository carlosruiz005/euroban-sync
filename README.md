# Sistema de Gestión Documental

Sistema web de gestión documental con autenticación y control de acceso basado en roles.

## Características

- 🔐 Sistema de autenticación con Supabase
- 👥 Control de acceso basado en roles (cliente, interno, ejecutivo)
- 📄 Carga y gestión de documentos (Excel/CSV)
- ✅ Sistema de aprobación de documentos
- 👁️ Visor integrado de archivos Excel y CSV
- 🎨 Interfaz moderna con React y Tailwind CSS

## Instalación

### Prerrequisitos

- Node.js 18.x o superior ([instalar con nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm (incluido con Node.js)
- Cuenta de Supabase (para la base de datos y almacenamiento)

### Pasos de instalación

1. **Clonar el repositorio**
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. **Instalar dependencias**
```sh
npm install
```

3. **Configurar variables de entorno**

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
VITE_SUPABASE_PROJECT_ID="tu_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="tu_publishable_key"
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
```

> **Nota**: Estas credenciales se obtienen desde el panel de Supabase en Project Settings > API

4. **Configurar Supabase**

El proyecto incluye migraciones de base de datos en `supabase/migrations/`. Asegúrate de que tu proyecto de Supabase tenga:

- Tabla `profiles` con los campos: `id`, `user_id`, `full_name`, `role`
- Tabla `documents` para gestión de archivos
- Storage bucket configurado para almacenar archivos
- Políticas de seguridad (RLS) habilitadas

5. **Iniciar el servidor de desarrollo**
```sh
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Scripts disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Crea la versión de producción
- `npm run preview` - Previsualiza la versión de producción
- `npm run lint` - Ejecuta el linter de código

## Roles de usuario

El sistema maneja tres roles principales:

- **cliente**: Puede cargar documentos y ver sus propios archivos
- **interno**: Puede ver todos los documentos aprobados
- **ejecutivo**: Puede aprobar/rechazar documentos cargados por clientes

## Estructura del proyecto

```
src/
├── components/       # Componentes React reutilizables
├── pages/           # Páginas de la aplicación
├── hooks/           # Custom hooks
├── lib/             # Utilidades y configuración
└── integrations/    # Integraciones (Supabase)
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2ab9ce9b-d3c7-4dbf-b35c-bc11aec637cb) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
