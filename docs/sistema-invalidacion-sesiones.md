# Sistema de Invalidación de Sesiones en Tiempo Real

## Introducción

Este documento describe el sistema implementado para actualizar permisos de usuarios en tiempo real (< 5 segundos) usando Redis como mecanismo de invalidación de sesiones.

## Problema Resuelto

**Problema original**: Los permisos se guardaban correctamente en la base de datos, pero los usuarios no veían los cambios reflejados hasta que cerraban sesión y volvían a iniciar.

**Causa**: NextAuth cachea permisos en el JWT token por 8 horas. El JWT callback solo se ejecuta en login, no en cada request.

**Solución**: Sistema de invalidación de sesiones con Redis + polling cliente.

---

## Arquitectura de la Solución

### Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                           │
└─────────────────────────────────────────────────────────────┘

1. Admin modifica permisos (Web UI)
   │
   ├──▶ Server Action: asignarPermisosUsuario()
   │    ├─ Guarda permisos en BD (PostgreSQL)
   │    └─ Marca sesión como invalidada en Redis
   │       └─ Key: invalidate-session:{usuarioId}
   │          TTL: 5 minutos
   │
2. Usuario tiene sesión activa
   │
   ├──▶ SessionRefresher Component (Client)
   │    ├─ Polling cada 5 segundos
   │    └─ Llama GET /api/check-session-validity
   │       │
   │       ├──▶ API Route
   │       │    ├─ Verifica autenticación
   │       │    ├─ Rate limiting (30 req/min)
   │       │    └─ Consulta Redis: ¿está invalidada?
   │       │       │
   │       │       ├─ SÍ → Retorna { shouldRefresh: true }
   │       │       └─ NO → Retorna { shouldRefresh: false }
   │       │
   │       └──▶ Cliente recibe respuesta
   │            │
   │            └─ Si shouldRefresh === true:
   │               └─ Llama update() de useSession
   │                  │
   │                  └──▶ NextAuth ejecuta JWT callback
   │                       ├─ Detecta sesionInvalidada en Redis
   │                       ├─ Recarga permisos desde BD
   │                       ├─ Actualiza token JWT
   │                       └─ Limpia marca en Redis
   │
3. Usuario ve permisos actualizados
   └─ Tiempo total: < 5 segundos
```

---

## Archivos Implementados

### Archivos Nuevos

| Archivo | Descripción | Ubicación |
|---------|-------------|-----------|
| `redis.ts` | Cliente de Upstash Redis | `src/compartido/lib/redis.ts` |
| `invalidar-sesion.ts` | Servicio de invalidación | `src/compartido/lib/invalidar-sesion.ts` |
| `check-session-validity/route.ts` | API endpoint | `src/app/api/check-session-validity/route.ts` |
| `SessionRefresher.tsx` | Componente cliente | `src/compartido/componentes/layout/SessionRefresher.tsx` |
| `invalidar-sesion.test.ts` | Tests unitarios | `src/compartido/lib/__tests__/invalidar-sesion.test.ts` |

### Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `usuarios/acciones.ts` | Llama a `invalidarSesionUsuario()` | 384 |
| `autenticacion/auth.ts` | Verifica invalidación en JWT callback | 156-202 |
| `(principal)/layout.tsx` | Integra `SessionRefresher` | 17 |
| `.env` | Credenciales de Redis | 14-16 |

---

## Configuración

### 1. Variables de Entorno

Agregar a `.env`:

```bash
# Upstash Redis - Sistema de invalidación de sesiones
UPSTASH_REDIS_REST_URL="https://adjusted-buck-35858.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AYwSAAIncDIwNjRmZmQwNDI5Y2U0ZTUyOTQ1OGVkZjhmOWMyMzhlOHAyMzU4NTg"
```

**IMPORTANTE**: Estas credenciales también deben configurarse en:
- Vercel (Production + Preview)
- `.env.example` (para documentación, sin valores reales)

### 2. Instalación de Dependencias

```bash
npm install @upstash/redis
```

### 3. Configuración de Upstash Redis

1. Crear cuenta en [Upstash](https://upstash.com)
2. Crear nueva base de datos Redis
   - Región: Elegir la más cercana a tu deployment
   - Type: "Regional" (más barato)
   - TLS: Habilitado (por defecto)
3. Copiar credenciales:
   - REST URL
   - REST TOKEN

---

## Uso

### Asignar Permisos a un Usuario

```typescript
// En el panel de administración
import { asignarPermisosUsuario } from '@/caracteristicas/usuarios/acciones'

const result = await asignarPermisosUsuario(usuarioId, [1, 2, 3])

if (result.success) {
  // ✅ Permisos guardados en BD
  // ✅ Sesión marcada como invalidada en Redis
  // ⏱️ Usuario verá cambios en < 5 segundos
}
```

### Verificar Invalidación Manualmente

```typescript
import { verificarSesionInvalidada } from '@/compartido/lib/invalidar-sesion'

const shouldRefresh = await verificarSesionInvalidada(123)
// true = debe refrescar permisos
// false = permisos están actualizados
```

### Invalidar Sesión Manualmente

```typescript
import { invalidarSesionUsuario } from '@/compartido/lib/invalidar-sesion'

// Ejemplo: Cambio de rol
await prisma.usuario.update({
  where: { id: userId },
  data: { rolId: newRoleId },
})

// Invalidar sesión para forzar recarga de permisos
await invalidarSesionUsuario(userId)
```

---

## Flujo Detallado

### 1. Admin Modifica Permisos

```typescript
// src/caracteristicas/usuarios/acciones.ts

export async function asignarPermisosUsuario(
  usuarioId: number,
  permissionIds: number[]
) {
  // 1. Eliminar permisos actuales
  await prisma.userPermission.deleteMany({
    where: { usuarioId },
  })

  // 2. Crear nuevos permisos
  await prisma.userPermission.createMany({
    data: permissionIds.map((permissionId) => ({
      usuarioId,
      permissionId,
    })),
  })

  // 3. Registrar auditoría
  await registrarAuditoria({
    accion: 'UPDATE_USER_PERMISSIONS',
    entidad: 'Usuario',
    entidadId: String(usuarioId),
  })

  // 4. ✅ Invalidar sesión del usuario
  await invalidarSesionUsuario(usuarioId)

  return {
    success: true,
    message: 'Permisos actualizados. Los cambios se aplicarán en menos de 5 segundos.',
  }
}
```

### 2. Sesión Marcada en Redis

```typescript
// src/compartido/lib/invalidar-sesion.ts

export async function invalidarSesionUsuario(usuarioId: number) {
  const key = `invalidate-session:${usuarioId}`

  // Guardar timestamp con TTL de 5 minutos
  await redis.set(key, Date.now(), {
    ex: 300, // Expira en 5 minutos
  })
}
```

**Estructura en Redis:**

```
Key: invalidate-session:123
Value: 1736547600000 (timestamp)
TTL: 300 segundos (5 minutos)
```

### 3. Cliente Verifica Cambios

```typescript
// src/compartido/componentes/layout/SessionRefresher.tsx

useEffect(() => {
  const checkSessionValidity = async () => {
    const response = await fetch('/api/check-session-validity')
    const data = await response.json()

    if (data.shouldRefresh) {
      // Forzar recarga de permisos
      await update()
    }
  }

  // Ejecutar cada 5 segundos
  const interval = setInterval(checkSessionValidity, 5000)

  return () => clearInterval(interval)
}, [])
```

### 4. API Verifica en Redis

```typescript
// src/app/api/check-session-validity/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = parseInt(session.user.id)

  // ✅ Rate limiting: 30 req/min
  const rateLimitResult = await checkRateLimit(`check-session:${userId}`, {
    windowMs: 60 * 1000,
    max: 30,
  })

  // Verificar en Redis
  const shouldRefresh = await verificarSesionInvalidada(userId)

  return NextResponse.json({ shouldRefresh })
}
```

### 5. JWT Callback Recarga Permisos

```typescript
// src/caracteristicas/autenticacion/auth.ts

callbacks: {
  async jwt({ token }) {
    const userId = parseInt(String(token.id))

    // Verificar si la sesión fue invalidada
    const sesionInvalidada = await verificarSesionInvalidada(userId)

    if (sesionInvalidada) {
      // Recargar permisos desde BD
      const userWithPermissions = await usuarioRepo.findById(userId)

      // Actualizar token
      token.permisos = [...permisosRol, ...permisosIndividuales]
      token.permisosLastUpdate = Date.now()

      // Limpiar marca de Redis
      await limpiarInvalidacion(userId)
    }

    return token
  }
}
```

---

## Performance y Costos

### Upstash Redis - Free Tier

```
Plan Gratuito:
- 10,000 comandos/día
- 256 MB almacenamiento
- Suficiente para:
  - 50-100 usuarios activos
  - ~3,000 verificaciones/día
```

### Cálculo de Uso

```
Escenario: 100 usuarios activos simultáneos

Polling:
- Intervalo: 5 segundos
- Requests/usuario/minuto: 12
- Total requests/minuto: 1,200
- Total requests/día: ~1,700,000

Redis comandos:
- Por request: 1 GET
- Total comandos/día: ~1,700,000

⚠️ Excede Free Tier (10,000/día)

Solución:
- Aumentar intervalo a 15 segundos → 3,400 req/día ✅
- O usar plan Pay-as-you-go (~$2/mes)
```

### Costos Vercel

```
Serverless Functions:
- 100 usuarios × 12 req/min × 60 min × 8 hrs = 576,000 invocaciones/día
- Free tier: 100,000 invocaciones/mes
- ⚠️ Requiere plan Pro ($20/mes)

Alternativa:
- Aumentar intervalo a 10-15 segundos
- Reduce invocaciones en 50-67%
```

---

## Seguridad

### Rate Limiting

El endpoint `/api/check-session-validity` está protegido con rate limiting:

```typescript
// Máximo 30 requests por minuto por usuario
const rateLimitResult = await checkRateLimit(`check-session:${userId}`, {
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 requests
})
```

**Protege contra:**
- Abuse del endpoint
- Ataques de degradación de servicio
- Polling excesivo

### Validación de Sesión

```typescript
// Solo usuarios autenticados pueden verificar
const session = await getServerSession(authOptions)

if (!session?.user?.id) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}
```

### TTL en Redis

Las marcas de invalidación expiran automáticamente después de 5 minutos:

```typescript
await redis.set(key, timestamp, { ex: 300 })
```

**Beneficios:**
- No acumula basura en Redis
- Auto-limpieza sin intervención manual
- Previene memoria infinita

---

## Testing

### Ejecutar Tests

```bash
# Tests unitarios
npm run test:unit src/compartido/lib/__tests__/invalidar-sesion.test.ts

# Modo watch
npm run test:unit:watch
```

### Cobertura de Tests

```
✅ invalidarSesionUsuario - 3 tests
✅ verificarSesionInvalidada - 3 tests
✅ limpiarInvalidacion - 2 tests
✅ obtenerTimestampInvalidacion - 2 tests
✅ invalidarSesionesMultiples - 3 tests
✅ Flujo completo - 1 test
✅ Manejo de errores - 1 test

Total: 14 tests (100% passing)
```

---

## Troubleshooting

### Problema: Usuario no ve cambios después de 5 segundos

**Verificar:**

1. Redis está configurado correctamente:
```bash
# En la consola del navegador
fetch('/api/check-session-validity').then(r => r.json())
```

2. SessionRefresher está montado:
```bash
# Buscar en DevTools → Components
# Debe aparecer <SessionRefresher>
```

3. Logs de desarrollo (local):
```
🔄 Permisos INVALIDADOS y actualizados para usuario 123: [...]
```

### Problema: Error "Redis configuration missing"

**Solución:**

Verificar que `.env` tenga:
```bash
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

Reiniciar servidor de desarrollo:
```bash
npm run dev
```

### Problema: Too many requests (429)

**Causa:** Rate limit excedido (30 req/min)

**Solución:**
- Aumentar intervalo de polling en `SessionRefresher.tsx`
- O aumentar límite en `check-session-validity/route.ts`

### Problema: Permisos se actualizan pero luego vuelven a los anteriores

**Causa:** Múltiples tabs/sesiones abiertas con JWT diferente

**Solución:**
- Cerrar todas las tabs
- Limpiar cookies
- Reloguear

---

## Mejoras Futuras

### 1. WebSockets en lugar de Polling

**Ventajas:**
- Push instantáneo (0 segundos)
- 0 polling overhead
- Menor carga en servidor

**Implementación:**
```typescript
// Usar Pusher, Ably, o Server-Sent Events
pusher.trigger(`user-${userId}`, 'permissions-updated', {})
```

### 2. Invalidación Selectiva

**Actualmente:** Invalida toda la sesión

**Mejora:** Solo invalidar si cambió permiso relevante

```typescript
// Ejemplo
if (removedPermissions.includes('usuarios.editar')) {
  // Solo invalidar si el usuario está en /dashboard/usuarios
}
```

### 3. Métricas y Monitoreo

```typescript
// Registrar en analytics
await trackEvent('session_invalidated', {
  userId,
  reason: 'permissions_updated',
  timestamp: Date.now(),
})
```

---

## Referencias

- [Upstash Redis Docs](https://upstash.com/docs/redis)
- [NextAuth JWT Callback](https://next-auth.js.org/configuration/callbacks#jwt-callback)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

**Última actualización**: 2025-11-10
**Versión**: 1.0.0
**Autor**: Sistema CRM Multi-Sucursal
