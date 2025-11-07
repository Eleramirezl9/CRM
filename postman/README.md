# Colección Postman para CRM

Esta carpeta contiene archivos listos para importar en Postman y comenzar a probar la API del CRM.

## 📦 Archivos Incluidos

- `CRM-API-Collection.json` - Colección completa de endpoints
- `CRM-Environment.json` - Variables de entorno configuradas
- `README.md` - Este archivo

## 🚀 Guía Rápida de Inicio

### 1. Importar a Postman

**Opción A: Importar ambos archivos a la vez**
1. Abre Postman
2. Click en **Import** (esquina superior izquierda)
3. Arrastra los dos archivos JSON a la ventana:
   - `CRM-API-Collection.json`
   - `CRM-Environment.json`
4. Click en **Import**

**Opción B: Importar uno por uno**
1. Abre Postman
2. Click en **Import**
3. Selecciona `CRM-API-Collection.json`
4. Click en **Import**
5. Repite para `CRM-Environment.json`

### 2. Activar el Environment

1. En Postman, busca el selector de **Environment** (esquina superior derecha)
2. Selecciona **CRM - Development**
3. Ahora todas las variables (`{{base_url}}`, etc.) estarán disponibles

### 3. Obtener Token de Sesión

**Método 1: Desde el Navegador (Recomendado)**

1. Inicia sesión en tu aplicación: `http://localhost:3000/iniciar-sesion`
2. Presiona **F12** (DevTools)
3. Ve a **Application** → **Cookies** → `http://localhost:3000`
4. Busca `next-auth.session-token`
5. Copia el **Value**
6. En Postman:
   - Click en el **Environment** "CRM - Development"
   - Pega el valor en la variable `session_token`
   - Guarda (Ctrl+S)

**Método 2: Usar Request de Login**

1. En Postman, ve a la carpeta **0. Autenticación**
2. Selecciona **Login - Administrador** (o el rol que quieras)
3. Click en **Send**
4. Copia el valor de `next-auth.session-token` del header `Set-Cookie`
5. Pégalo en la variable de entorno `session_token`

### 4. Hacer tu Primera Request

1. Ve a la carpeta **1. Producción Diaria**
2. Selecciona **Listar Toda la Producción**
3. Click en **Send**
4. ¡Deberías ver la lista de producciones!

## 📚 Estructura de la Colección

```
CRM API - Completa
├── 0. Autenticación
│   ├── Login - Administrador
│   ├── Login - Producción
│   ├── Login - Bodega
│   ├── Login - Sucursal
│   └── Obtener Sesión Actual
├── 1. Producción Diaria
│   ├── Listar Toda la Producción
│   ├── Filtrar por Fecha
│   ├── Filtrar Producción No Enviada
│   ├── Registrar Nueva Producción
│   └── Marcar Producción como Enviada
├── 2. Inventario
│   └── Obtener Inventario de Sucursal
├── 3. Tests de Seguridad
│   ├── Test: Request sin Autenticación
│   ├── Test: Sucursal intenta Registrar Producción
│   └── Test: Sucursal accede a Otra Sucursal
└── 4. Utilidades
    └── Test de Conexión
```

## 🔐 Credenciales Disponibles

Las credenciales están pre-configuradas en el Environment:

| Rol | Email | Password |
|-----|-------|----------|
| **Administrador** | admin@empresa.com | Admin@2025 |
| **Producción** | produccion@empresa.com | Produccion@2025 |
| **Bodega** | bodega@empresa.com | Bodega@2025 |
| **Sucursal** | sucursal@empresa.com | Sucursal@2025 |

## 🧪 Ejemplos de Pruebas

### Ejemplo 1: Registrar Producción

1. Inicia sesión como **Producción** (usa el request de login)
2. Obtén el ID de un producto:
   ```bash
   npm run prisma:studio
   ```
   - Ve a la tabla `Producto`
   - Copia el `id` de cualquier producto
3. Ve a **1. Producción Diaria** → **Registrar Nueva Producción**
4. Edita el body y reemplaza `REEMPLAZAR_CON_ID_PRODUCTO` con el ID copiado
5. Click en **Send**
6. ✅ Deberías recibir `{ "success": true, ... }`

### Ejemplo 2: Probar Control de Permisos

1. Inicia sesión como **Sucursal** (rol limitado)
2. Ve a **3. Tests de Seguridad** → **Test: Sucursal intenta Registrar Producción**
3. Click en **Send**
4. ✅ Deberías recibir `403 Forbidden` porque usuarios de sucursal no pueden registrar producción

### Ejemplo 3: Consultar Inventario

1. Inicia sesión con cualquier usuario
2. Obtén el ID de una sucursal desde Prisma Studio
3. Ve a **2. Inventario** → **Obtener Inventario de Sucursal**
4. Reemplaza `:sucursalId` en la URL con el ID real
5. Click en **Send**
6. ✅ Deberías ver la lista de productos en inventario

## 🔍 Variables de Entorno

El environment incluye estas variables:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `base_url` | URL base de la API | http://localhost:3000 |
| `session_token` | Token de sesión JWT | (vacío - lo obtienes al login) |
| `admin_email` | Email del admin | admin@empresa.com |
| `admin_password` | Password del admin | Admin@2025 |
| `produccion_email` | Email de producción | produccion@empresa.com |
| ... | ... | ... |

Puedes usar estas variables en cualquier request así:
```
{{base_url}}/api/produccion-diaria
```

## ⚠️ Troubleshooting

### Error 401 - No autorizado
- ✅ Verifica que el `session_token` esté configurado en el Environment
- ✅ El token puede expirar después de 8 horas, vuelve a hacer login
- ✅ Asegúrate de tener el Environment **CRM - Development** seleccionado

### Error 403 - Sin permisos
- ✅ Verifica que el usuario tenga el rol correcto para ese endpoint
- ✅ Usuarios de "sucursal" solo pueden ver su propia sucursal
- ✅ Solo usuarios de "produccion" o "admin" pueden registrar producción

### Error 400 - Datos inválidos
- ✅ Verifica que reemplazaste los placeholders (REEMPLAZAR_CON_ID_PRODUCTO)
- ✅ Asegúrate de que los IDs existan en la base de datos (usa Prisma Studio)
- ✅ Verifica que el JSON esté bien formado

### El token no funciona
1. Borra todas las cookies en el navegador (Application → Cookies → Clear)
2. Cierra sesión y vuelve a iniciar
3. Copia el nuevo token
4. Actualiza la variable en Postman

## 📖 Documentación Relacionada

- [Guía Completa de Postman](../docs/GUIA-POSTMAN.md) - Documentación detallada de cada endpoint
- [Sistema de Seguridad](../docs/SEGURIDAD-IMPLEMENTADA.md) - Información sobre autenticación
- [Arquitectura](../docs/arquitectura-ddd.md) - Cómo está estructurado el proyecto

## 💡 Tips

1. **Usa el Runner de Postman** para ejecutar múltiples requests en secuencia
2. **Crea Tests** en cada request para automatizar validaciones
3. **Usa Scripts** en la pestaña "Tests" para extraer el token automáticamente
4. **Organiza tus Environments** - crea uno para desarrollo y otro para producción

### Script para Extraer Token Automáticamente

Agrega esto en la pestaña **Tests** del request de login:

```javascript
// Extraer token de la cookie
var cookies = pm.response.headers.get('Set-Cookie');
if (cookies) {
  var token = cookies.match(/next-auth\.session-token=([^;]+)/);
  if (token && token[1]) {
    pm.environment.set("session_token", token[1]);
    console.log("Token guardado:", token[1]);
  }
}
```

Ahora cada vez que hagas login, el token se guardará automáticamente en el Environment.

## 🚀 Próximos Pasos

1. Explora todos los endpoints de la colección
2. Prueba con diferentes roles de usuario
3. Crea tus propios requests para nuevos endpoints
4. Agrega tests automatizados para validar respuestas

---

**¿Necesitas ayuda?** Consulta la [Guía Completa de Postman](../docs/GUIA-POSTMAN.md)
