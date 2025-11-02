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

## Flujo Principal del Sistema

### Ejemplo de Uso Completo

A continuación se describe el flujo completo del sistema desde la carga de un documento hasta su visualización final:

#### 1. Cliente Carga un Documento

**Rol requerido**: `client`

1. El cliente inicia sesión en el sistema con sus credenciales
2. Es redirigido automáticamente a `/upload`
3. En la página de carga:
   - Completa el campo **Título** (ej: "Reporte Financiero Q1 2024")
   - Completa el campo **Descripción** (ej: "Análisis financiero del primer trimestre")
   - Selecciona el **Tipo de documento** del menú desplegable:
     - Datos Generales
     - Colaborador
     - Carátula Afiliación
     - Validación IMSS
     - Análisis
   - Hace clic en **Seleccionar archivo** y elige un archivo Excel (.xlsx, .xls) o CSV
4. Presiona el botón **Subir documento**
5. El sistema:
   - Verifica si ya existe un documento del mismo tipo
   - Si existe, crea una nueva versión incrementando el número de versión
   - Si no existe, crea un nuevo documento con versión 1
   - Sube el archivo a Supabase Storage en la ruta: `documents/{documentId}/v{version}/{filename}`
   - Registra la versión en la tabla `document_versions`
   - Actualiza el estado del documento a `pending_review`
6. Se muestra un mensaje de confirmación: "Documento subido exitosamente"

#### 2. Ejecutivo Aprueba el Documento

**Rol requerido**: `executive`

1. El ejecutivo inicia sesión en el sistema
2. Es redirigido automáticamente a `/approvals`
3. En el panel de aprobaciones puede ver:
   - **Estadísticas**: Total de documentos, pendientes, aprobados, cambios solicitados
   - **Tabla de documentos** con información:
     - Título del documento
     - Tipo de documento
     - Versión actual
     - Estado (con badge de color)
     - Subido por (nombre del cliente)
     - Fecha de subida
4. Para revisar un documento, el ejecutivo tiene dos opciones:
   
   **Opción A - Visualizar el documento**:
   - Hace clic en el botón **Ver** (icono de ojo)
   - El sistema descarga y muestra el contenido del archivo Excel/CSV en una tabla
   - Puede revisar todos los datos directamente en el navegador
   
   **Opción B - Aprobar directamente**:
   - Hace clic en el botón **Aprobar** (icono de check)
   
5. El sistema al aprobar:
   - Actualiza el estado del documento a `approved`
   - Crea un registro en la tabla `approvals` con:
     - `status`: 'approved'
     - `reviewed_by`: ID del ejecutivo
     - `reviewed_at`: timestamp actual
   - Inserta una notificación para el cliente
   - Registra la acción en `audit_logs`
6. Se muestra un mensaje: "Documento aprobado exitosamente"

**Alternativa - Solicitar Cambios**:
- Si el ejecutivo encuentra problemas, puede hacer clic en **Solicitar Cambios**
- Se abre un diálogo donde puede escribir comentarios
- El documento cambia a estado `changes_requested`
- El cliente recibirá una notificación con los comentarios

#### 3. Interno Visualiza el Documento Aprobado

**Rol requerido**: `internal_team`

1. El usuario interno inicia sesión en el sistema
2. Es redirigido automáticamente a `/internal-docs`
3. En la página de documentos internos puede ver:
   - Información del usuario logueado
   - Resumen: "X documentos aprobados disponibles"
   - **Tabla de documentos aprobados** con:
     - Título
     - Tipo de documento
     - Versión actual
     - Estado (siempre "approved")
     - Subido por (nombre del cliente)
     - Fecha de subida
4. Para visualizar un documento:
   - Hace clic en el botón **Ver** (icono de ojo)
   - El sistema:
     - Obtiene la última versión del documento desde `document_versions`
     - Descarga el archivo desde Supabase Storage
     - Parsea el archivo Excel/CSV usando la librería XLSX
     - Muestra el contenido en una tabla HTML
5. El visor muestra:
   - Título del documento
   - Tipo de documento
   - Versión actual
   - Estado
   - Información del uploader
   - Contenido completo del archivo en formato tabla
   - Botón **Cerrar** para volver a la lista

### Notas Importantes

- **Seguridad**: El sistema utiliza Row Level Security (RLS) de Supabase para garantizar que cada usuario solo pueda acceder a los datos permitidos según su rol
- **Versionamiento**: Cada vez que un cliente sube un archivo del mismo tipo, se crea una nueva versión automáticamente
- **Storage**: Los archivos se almacenan en Supabase Storage con una estructura organizada por documento y versión
- **Notificaciones**: El sistema genera notificaciones automáticas cuando cambia el estado de un documento
- **Auditoría**: Todas las acciones importantes se registran en `audit_logs` para trazabilidad

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
