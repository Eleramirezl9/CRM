# 🔐 Sistema de Seguridad y Permisos

## 📋 Índice
- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Sistema de Autenticación](#sistema-de-autenticación)
- [Sistema de Permisos](#sistema-de-permisos)
- [Control de Acceso](#control-de-acceso)
- [Invalidación de Sesiones](#invalidación-de-sesiones)
- [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Resumen Ejecutivo

### Arquitectura de Seguridad
El sistema implementa múltiples capas de seguridad:

1. **Autenticación con NextAuth.js** - JWT con Credentials provider
2. **Control de Acceso Basado en Roles (RBAC)** - 3 roles con permisos granulares
3. **Middleware de Protección** - Validación en cada request
4. **Invalidación de Sesiones** - Sistema de revocación manual
5. **Validación en Backend** - Doble verificación de permisos

---

## 🔑 Sistema de Autenticación

### Configuración de NextAuth.js

**Archivo:** `src/caracteristicas/autenticacion/auth.ts`

```typescript
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validación de credenciales
        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: { rol: true, sucursal: true }
        })

        if (user && await verifyPassword(credentials.password, user.password)) {
          return {
            id: user.id,
            email: user.email,
            name: user.nombre,
            rol: user.rol.nombre,
            sucursalId: user.sucursalId
          }
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.rol = user.rol
        token.sucursalId = user.sucursalId
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.rol = token.rol
      session.user.sucursalId = token.sucursalId
      return session
    }
  },
  pages: {
    signIn: '/iniciar-sesion',
    error: '/no-autorizado'
  }
}
```

### Flujo de Autenticación

```
1. Usuario ingresa credenciales en /iniciar-sesion
   ↓
2. CredentialsProvider valida en base de datos
   ↓
3. Si es válido, genera JWT con datos del usuario
   ↓
4. JWT incluye: id, email, rol, sucursalId
   ↓
5. Token se almacena en cookie httpOnly
   ↓
6. Todas las requests posteriores incluyen el token
```

### Endpoints de Autenticación

```typescript
// API Route: /api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/caracteristicas/autenticacion/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

**Endpoints disponibles:**
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Obtener sesión actual
- `GET /api/auth/csrf` - CSRF token

---

## 👥 Sistema de Permisos

### Roles Disponibles

#### 1. Administrador
**Permisos completos:**
- ✅ Acceso a todas las rutas
- ✅ Gestión de usuarios y roles
- ✅ Gestión de sucursales
- ✅ Configuración del sistema
- ✅ Reportes globales

**Rutas permitidas:**
- `/dashboard/*` (todas)

#### 2. Bodega
**Permisos de almacén:**
- ✅ Gestión de inventario
- ✅ Gestión de envíos
- ✅ Gestión de sucursales
- ❌ Sin acceso a configuración de usuarios
- ❌ Sin acceso a ventas

**Rutas permitidas:**
- `/dashboard`
- `/dashboard/inventario`
- `/dashboard/envios`
- `/dashboard/sucursales`

#### 3. Sucursal
**Permisos de punto de venta:**
- ✅ Registro de ventas
- ✅ Consulta de inventario (solo su sucursal)
- ✅ Ver perfil de su sucursal
- ❌ Sin acceso a otras sucursales
- ❌ Sin acceso a envíos
- ❌ Sin acceso a configuración

**Rutas permitidas:**
- `/dashboard`
- `/dashboard/ventas`
- `/dashboard/inventario` (solo lectura)
- `/dashboard/sucursales/[id]/perfil` (solo su sucursal)

### Modelo de Datos

```prisma
// prisma/schema.prisma

model Rol {
  id       Int       @id @default(autoincrement())
  nombre   String    @unique
  usuarios Usuario[]
}

model Usuario {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  nombre        String
  rolId         Int
  rol           Rol       @relation(fields: [rolId], references: [id])
  sucursalId    String?
  sucursal      Sucursal? @relation(fields: [sucursalId], references: [id])
  activo        Boolean   @default(true)
  creado_at     DateTime  @default(now())
  actualizado_at DateTime @updatedAt
}
```

---

## 🛡️ Control de Acceso

### Middleware de Protección

**Archivo:** `middleware.ts`

```typescript
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Rutas públicas
    if (path === '/iniciar-sesion' || path === '/no-autorizado') {
      return NextResponse.next()
    }

    // Verificar autenticación
    if (!token) {
      return NextResponse.redirect(new URL('/iniciar-sesion', req.url))
    }

    // Control de acceso por rol
    const rol = token.rol as string

    // Administrador: acceso completo
    if (rol === 'administrador') {
      return NextResponse.next()
    }

    // Bodega: rutas permitidas
    if (rol === 'bodega') {
      const allowedPaths = [
        '/dashboard',
        '/dashboard/inventario',
        '/dashboard/envios',
        '/dashboard/sucursales'
      ]
      if (allowedPaths.some(p => path.startsWith(p))) {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL('/no-autorizado', req.url))
    }

    // Sucursal: rutas restringidas
    if (rol === 'sucursal') {
      const allowedPaths = [
        '/dashboard',
        '/dashboard/ventas',
        '/dashboard/inventario'
      ]

      // Permitir solo su propia sucursal
      if (path.startsWith('/dashboard/sucursales/')) {
        const sucursalId = path.split('/')[3]
        if (sucursalId !== token.sucursalId) {
          return NextResponse.redirect(new URL('/no-autorizado', req.url))
        }
      }

      if (allowedPaths.some(p => path.startsWith(p))) {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL('/no-autorizado', req.url))
    }

    return NextResponse.redirect(new URL('/no-autorizado', req.url))
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: ['/dashboard/:path*']
}
```

### Validación en Server Actions

**Patrón recomendado:**

```typescript
'use server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/caracteristicas/autenticacion/auth'

export async function crearProducto(data: ProductoInput) {
  // 1. Verificar sesión
  const session = await getServerSession(authOptions)
  if (!session) {
    return { success: false, error: 'No autenticado' }
  }

  // 2. Verificar permisos
  if (session.user.rol !== 'administrador' && session.user.rol !== 'bodega') {
    return { success: false, error: 'Sin permisos' }
  }

  // 3. Validar datos
  if (!data.nombre || !data.precio) {
    return { success: false, error: 'Datos inválidos' }
  }

  // 4. Ejecutar lógica de negocio
  try {
    const producto = await prisma.producto.create({ data })
    return { success: true, producto }
  } catch (error) {
    return { success: false, error: 'Error al crear producto' }
  }
}
```

### Protección de Rutas en Components

**Client Component:**

```typescript
'use client'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function ProtectedComponent() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/iniciar-sesion')
    }
  })

  if (status === 'loading') {
    return <div>Cargando...</div>
  }

  // Verificar rol
  if (session.user.rol !== 'administrador') {
    return <div>Acceso denegado</div>
  }

  return <div>Contenido protegido</div>
}
```

**Server Component:**

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/caracteristicas/autenticacion/auth'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/iniciar-sesion')
  }

  if (session.user.rol !== 'administrador') {
    redirect('/no-autorizado')
  }

  return <div>Página protegida</div>
}
```

---

## 🚫 Invalidación de Sesiones

### Sistema Implementado

**Problema resuelto:** Cerrar sesión de un usuario remotamente cuando:
- Se cambia su rol
- Se desactiva su cuenta
- Se detecta actividad sospechosa

**Solución:**

#### 1. Modelo de Sesiones Invalidadas

```prisma
model SesionInvalidada {
  id        String   @id @default(cuid())
  usuarioId String
  usuario   Usuario  @relation(fields: [usuarioId], references: [id])
  razon     String?
  creado_at DateTime @default(now())

  @@index([usuarioId])
}
```

#### 2. Función de Invalidación

```typescript
// src/caracteristicas/autenticacion/acciones.ts
'use server'

export async function invalidarSesion(usuarioId: string, razon?: string) {
  await prisma.sesionInvalidada.create({
    data: {
      usuarioId,
      razon: razon || 'Cierre de sesión manual'
    }
  })

  return { success: true }
}
```

#### 3. Verificación en Middleware

```typescript
// En middleware.ts o en cada Server Action
async function verificarSesionValida(usuarioId: string): Promise<boolean> {
  const sesionInvalidada = await prisma.sesionInvalidada.findFirst({
    where: { usuarioId },
    orderBy: { creado_at: 'desc' }
  })

  return !sesionInvalidada
}
```

#### 4. Uso en la Aplicación

**Invalidar sesión al cambiar rol:**
```typescript
export async function cambiarRolUsuario(usuarioId: string, nuevoRolId: number) {
  // 1. Actualizar rol
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { rolId: nuevoRolId }
  })

  // 2. Invalidar sesiones existentes
  await invalidarSesion(usuarioId, 'Cambio de rol')

  return { success: true }
}
```

**Desactivar usuario:**
```typescript
export async function desactivarUsuario(usuarioId: string) {
  // 1. Desactivar
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { activo: false }
  })

  // 2. Invalidar sesiones
  await invalidarSesion(usuarioId, 'Usuario desactivado')

  return { success: true }
}
```

---

## 🔒 Mejores Prácticas

### 1. Nunca Confíes en el Cliente

```typescript
// ❌ MAL - Validación solo en cliente
'use client'
export default function FormularioProducto() {
  const { user } = useSession()

  if (user.rol !== 'administrador') return null

  // Usuario puede manipular el HTML y enviar el form igual
  return <form>...</form>
}

// ✅ BIEN - Validación en servidor
'use server'
export async function crearProducto(data: any) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.rol !== 'administrador') {
    return { success: false, error: 'Sin permisos' }
  }

  // Lógica de negocio
}
```

### 2. Valida Permisos en Cada Acción

```typescript
// ✅ Siempre verificar sesión y permisos
'use server'
export async function actualizarProducto(id: string, data: any) {
  // 1. Verificar autenticación
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('No autenticado')

  // 2. Verificar permisos
  if (!['administrador', 'bodega'].includes(session.user.rol)) {
    throw new Error('Sin permisos')
  }

  // 3. Validar ownership (si aplica)
  if (session.user.rol === 'sucursal') {
    const producto = await prisma.producto.findUnique({ where: { id } })
    if (producto.sucursalId !== session.user.sucursalId) {
      throw new Error('Sin permisos para esta sucursal')
    }
  }

  // 4. Ejecutar acción
  return await prisma.producto.update({ where: { id }, data })
}
```

### 3. Usa Middleware para Rutas

```typescript
// ✅ Protección a nivel de ruta
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/productos/:path*',
    '/api/ventas/:path*'
  ]
}
```

### 4. Encripta Contraseñas Correctamente

```typescript
import bcrypt from 'bcryptjs'

// ✅ Hash con bcrypt
export async function crearUsuario(data: { email: string, password: string }) {
  const hashedPassword = await bcrypt.hash(data.password, 10)

  return await prisma.usuario.create({
    data: {
      ...data,
      password: hashedPassword
    }
  })
}

// ✅ Verificación
export async function verificarPassword(plain: string, hashed: string) {
  return await bcrypt.compare(plain, hashed)
}
```

### 5. Implementa Rate Limiting

```typescript
// Ejemplo con redis o memory store
import rateLimit from 'express-rate-limit'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP
  message: 'Demasiados intentos, intenta más tarde'
})
```

### 6. Logs de Auditoría

```typescript
// Modelo de auditoría
model LogAuditoria {
  id        String   @id @default(cuid())
  usuarioId String
  accion    String   // 'login', 'logout', 'crear_producto', etc.
  detalles  Json?
  ip        String?
  creado_at DateTime @default(now())

  @@index([usuarioId])
  @@index([accion])
}

// Función helper
export async function registrarAuditoria(
  usuarioId: string,
  accion: string,
  detalles?: any
) {
  await prisma.logAuditoria.create({
    data: { usuarioId, accion, detalles }
  })
}
```

### 7. Variables de Entorno Seguras

```bash
# .env (NUNCA commitear)
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-chars
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

**Generar secret:**
```bash
openssl rand -base64 32
```

### 8. Headers de Seguridad

```typescript
// next.config.js
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        }
      ]
    }
  ]
}
```

---

## 🎯 Checklist de Seguridad

Antes de desplegar a producción:

- [ ] **Autenticación**
  - [ ] NextAuth configurado con secret seguro
  - [ ] Contraseñas hasheadas con bcrypt
  - [ ] JWT con expiración configurada

- [ ] **Autorización**
  - [ ] Middleware protege todas las rutas necesarias
  - [ ] Server Actions validan permisos
  - [ ] Usuarios solo acceden a sus propios datos

- [ ] **Variables de Entorno**
  - [ ] `.env` no está en git
  - [ ] Variables configuradas en Vercel
  - [ ] Secrets rotados si fueron comprometidos

- [ ] **Headers de Seguridad**
  - [ ] CSP configurado
  - [ ] X-Frame-Options: DENY
  - [ ] HTTPS en producción

- [ ] **Base de Datos**
  - [ ] Prisma con prepared statements (SQL injection prevention)
  - [ ] Índices en campos de búsqueda
  - [ ] Backups automáticos configurados

- [ ] **Auditoría**
  - [ ] Logs de acciones críticas
  - [ ] Monitoreo de intentos fallidos de login
  - [ ] Alertas de actividad sospechosa

---

## 📚 Recursos

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
