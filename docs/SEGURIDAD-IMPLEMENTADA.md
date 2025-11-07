# Sistema de Seguridad Implementado

## Resumen Ejecutivo

Se ha implementado un sistema de autenticación y autorización robusto que cumple con las mejores prácticas de seguridad de 2025, siguiendo los principios SOLID, DDD y arquitectura limpia.

## Características de Seguridad Implementadas

### 1. Autenticación Segura ✅

#### Hashing de Contraseñas con Argon2
- **✅ Implementado**: Uso de `@node-rs/argon2` en lugar de bcrypt
- **Ubicación**: `src/caracteristicas/autenticacion/auth.ts`
- **Configuración**:
  - memoryCost: 19456
  - timeCost: 2
  - parallelism: 1
  - outputLen: 32

#### Rate Limiting
- **✅ Implementado**: Límite de 5 intentos en 15 minutos
- **Ubicación**: `src/compartido/lib/rate-limit.ts`
- **Previene**: Ataques de fuerza bruta

#### Bloqueo de Cuentas
- **✅ Implementado**: Bloqueo automático tras 5 intentos fallidos
- **Duración**: 15 minutos
- **Ubicación**: `src/caracteristicas/usuarios/repositorio.ts:incrementFailedAttempts`

### 2. Prevención de Vulnerabilidades CVE

#### CVE-2025-29927: Bypass de Autenticación mediante Middleware
- **✅ Solucionado**: Data Access Layer (DAL) implementado
- **Ubicación**: `src/compartido/lib/dal.ts`
- **Funciones**:
  - `verifySession()`: Valida sesión en server actions
  - `requireRole()`: Verifica rol antes de ejecutar acciones
  - `getCurrentUserId()`: Obtiene ID del usuario autenticado

#### Session Hijacking - Cookies Mal Configuradas
- **✅ Solucionado**: Configuración segura de cookies
- **Ubicación**: `src/caracteristicas/autenticacion/auth.ts`
- **Configuración**:
  - `httpOnly: true`
  - `sameSite: 'lax'`
  - `secure: true` (en producción)
  - Nombre: `__Secure-next-auth.session-token`

#### SQL Injection - Prisma con Validación Zod
- **✅ Protegido**: Validación estricta con Zod
- **Ubicación**: `src/caracteristicas/usuarios/schemas.ts`
- **Validaciones**:
  - Email: Regex estricto, normalización (lowercase, trim)
  - Contraseñas: Mínimo 8 caracteres, mayúsculas, minúsculas, números, especiales
  - Nombres: Sin caracteres especiales (prevención XSS)

#### XSS (Cross-Site Scripting)
- **✅ Protegido**: Sanitización de inputs
- **Ubicación**: `src/caracteristicas/usuarios/schemas.ts`
- **Prevención**:
  - Validación de nombres sin caracteres peligrosos
  - Escape automático de React
  - Headers CSP en middleware

#### Fuerza Bruta - Rate Limiting
- **✅ Implementado**: Ver sección Rate Limiting

### 3. Sistema de Permisos Granular

#### Modelo de Base de Datos
```prisma
model Permission {
  id          Int              @id @default(autoincrement())
  codigo      String           @unique // "usuarios.crear", "ventas.ver", etc.
  nombre      String
  descripcion String?
  modulo      String           // "usuarios", "ventas", "inventario", etc.
  createdAt   DateTime         @default(now())
  roles       RolePermission[]
}

model RolePermission {
  roleId       Int
  permissionId Int
  createdAt    DateTime

  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])

  @@id([roleId, permissionId])
}
```

#### Permisos por Módulo
- **Usuarios**: ver, crear, editar, eliminar, cambiar_rol
- **Productos**: ver, crear, editar, eliminar
- **Inventario**: ver, editar, ajustar
- **Ventas**: ver, crear, editar, eliminar
- **Envíos**: ver, crear, editar, confirmar
- **Producción**: ver, crear, editar
- **Sucursales**: ver, crear, editar, eliminar
- **Reportes**: ver, exportar
- **Auditoría**: ver

#### Asignación de Permisos por Rol
- **Administrador**: Todos los permisos
- **Bodega**: Inventario, envíos, productos (solo ver)
- **Sucursal**: Ventas, inventario (solo ver)
- **Producción**: Producción completa, inventario (solo ver)

### 4. Auditoría Completa

#### Modelo de Auditoría
```prisma
model AuditLog {
  id          Int      @id @default(autoincrement())
  usuarioId   Int?
  accion      String   // "LOGIN", "LOGOUT", "CREATE_USER", etc.
  entidad     String?  // "Usuario", "Producto", "Venta", etc.
  entidadId   String?
  detalles    Json?    // Información adicional
  ipAddress   String?
  userAgent   String?
  exitoso     Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

#### Eventos Auditados
- **Autenticación**:
  - LOGIN (exitoso/fallido)
  - LOGOUT
  - LOGIN_FAILED (varios motivos)

- **Gestión de Usuarios**:
  - CREATE_USER
  - UPDATE_USER
  - DELETE_USER
  - TOGGLE_USER_ACTIVE
  - CHANGE_USER_ROLE

### 5. Middleware Seguro

#### Headers de Seguridad
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Content-Security-Policy` (en producción)

#### Validación de Estado
- Verifica que el usuario esté activo
- Verifica que el usuario no esté bloqueado
- Valida permisos por ruta y rol

### 6. Arquitectura Limpia

#### Principios SOLID
- **S**ingle Responsibility: Cada clase tiene una responsabilidad
- **O**pen/Closed: Extensible sin modificación
- **L**iskov Substitution: Interfaces bien definidas
- **I**nterface Segregation: Interfaces específicas
- **D**ependency Inversion: Inyección de dependencias con tsyringe

#### Repository Pattern
- `UsuarioRepository`: CRUD de usuarios
- `RoleRepository`: Gestión de roles y permisos

#### Data Access Layer (DAL)
- Capa de seguridad entre la aplicación y la base de datos
- Validación de sesión en cada operación
- Prevención de CVE-2025-29927

#### Inyección de Dependencias
- Configuración: `src/compartido/lib/container.ts`
- Uso de `tsyringe` con decoradores `@injectable()`

## Estructura de Archivos

```
src/
├── caracteristicas/
│   ├── autenticacion/
│   │   ├── auth.ts                    # Configuración NextAuth con Argon2
│   │   ├── adapter.ts                 # Adapter personalizado
│   │   └── __tests__/
│   │       └── auth.integration.test.ts
│   │
│   ├── usuarios/
│   │   ├── repositorio.ts             # Repository Pattern
│   │   ├── schemas.ts                 # Validaciones Zod
│   │   ├── acciones.ts                # Server Actions protegidas
│   │   ├── componentes/
│   │   │   ├── UsuariosLista.tsx
│   │   │   ├── FormularioUsuario.tsx
│   │   │   └── ToggleUsuarioActivo.tsx
│   │   └── __tests__/
│   │       ├── repositorio.test.ts
│   │       └── schemas.test.ts
│   │
│   └── roles/
│       └── repositorio.ts              # Gestión de permisos
│
├── compartido/
│   ├── lib/
│   │   ├── dal.ts                      # Data Access Layer
│   │   ├── permisos.ts                 # Sistema de permisos
│   │   ├── auditoria.ts                # Servicio de auditoría
│   │   ├── rate-limit.ts               # Rate limiting
│   │   ├── container.ts                # Inyección de dependencias
│   │   └── __tests__/
│   │       └── permisos.test.ts
│   │
│   └── componentes/
│       └── ui/
│           └── alert-dialog.tsx         # Componente de confirmación
│
└── app/
    └── (principal)/
        └── dashboard/
            └── usuarios/
                ├── page.tsx             # Lista de usuarios
                └── nuevo/
                    └── page.tsx         # Crear usuario

middleware.ts                            # Middleware con headers de seguridad
prisma/
└── schema.prisma                        # Modelos actualizados
```

## Credenciales de Prueba

```
ADMINISTRADOR
Email:    admin@empresa.com
Password: Admin@2025

BODEGA
Email:    bodega@empresa.com
Password: Bodega@2025

PRODUCCIÓN
Email:    produccion@empresa.com
Password: Produccion@2025

SUCURSAL
Email:    sucursal@empresa.com
Password: Sucursal@2025
```

**⚠️ IMPORTANTE**: Cambiar estas contraseñas en producción

## Testing

### Ejecutar Tests de Seguridad
```bash
npm run test:security        # Ejecutar todos los tests
npm run test:security:watch  # Modo watch
```

### Cobertura de Tests
- ✅ Tests unitarios para repositorios
- ✅ Tests de validación con Zod
- ✅ Tests de integración para autenticación
- ✅ Tests de permisos

### Resultados Actuales
- **42 de 46 tests pasando** (91% de éxito)
- Tests de autenticación: 14/14 ✅
- Tests de schemas: 21/23 ✅
- Tests de permisos: 7/9 ✅

## Comandos Útiles

```bash
# Base de datos
npm run prisma:migrate       # Crear migración
npm run db:seed              # Poblar base de datos
npm run prisma:studio        # Explorar base de datos

# Desarrollo
npm run dev                  # Iniciar servidor

# Testing
npm run test:security        # Tests de seguridad
npm run test:unit           # Tests unitarios
npm run test:integration    # Tests de integración
```

## Próximos Pasos Recomendados

### Alta Prioridad
1. **Implementar MFA (Multi-Factor Authentication)**
   - TOTP con Google Authenticator
   - SMS o Email backup

2. **Mejorar Rate Limiting con Redis**
   - Reemplazar implementación in-memory
   - Persistencia entre reinicios

3. **Agregar recuperación de contraseña**
   - Tokens seguros con expiración
   - Envío de emails

### Media Prioridad
4. **Implementar RBAC más granular**
   - Permisos a nivel de registro
   - Permisos contextuales (ej: solo su sucursal)

5. **Agregar logs centralizados**
   - Integración con Sentry o LogRocket
   - Alertas de seguridad

6. **Implementar refresh tokens**
   - Mayor seguridad en sesiones
   - Revocación de tokens

### Baja Prioridad
7. **Agregar CAPTCHA en login**
   - Prevención adicional de bots
   - Solo después de 3 intentos fallidos

8. **Implementar política de contraseñas**
   - Expiración de contraseñas
   - Historial de contraseñas
   - Prohibir contraseñas comunes

## Documentación Adicional

- [Guía de Arquitectura DDD](./docs/arquitectura-ddd.md)
- [Guía de Permisos](./docs/sistema-permisos.md)
- [Guía de Testing](./docs/testing.md)

## Soporte

Para preguntas o problemas de seguridad, contacta al equipo de desarrollo.

---

**Última actualización**: 2025-11-06
**Versión**: 1.0.0
