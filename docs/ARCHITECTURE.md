# 🏗 Arquitectura del CRM Multi-Sucursal

## 📋 Resumen del Proyecto
Este es un CRM (Customer Relationship Management) construido con una arquitectura moderna y escalable utilizando:
- **Frontend**: Next.js 14 (React)
- **Backend**: Server Actions de Next.js (Serverless)
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: NextAuth.js
- **Despliegue**: Vercel (Serverless)

## 🏛️ Patrón Arquitectónico

### **Feature-Driven Architecture + Server Actions**

Este proyecto implementa una arquitectura **orientada a características** (Vertical Slice Architecture) combinada con el patrón moderno de **Server Actions** de Next.js 14.

#### ✅ **NO es MVC tradicional**
- No usa Controllers HTTP tradicionales
- No separa Models/Views en carpetas distintas
- La lógica no está dividida en capas horizontales

#### ✅ **NO es Hexagonal (Ports & Adapters)**
- No abstrae la base de datos detrás de interfaces/ports
- No usa adapters para dependencias externas
- Prisma se llama directamente desde las acciones

#### ✅ **ES Feature-Driven (Screaming Architecture)**
- **Organización vertical**: Cada característica contiene toda su lógica
- **La estructura "grita"**: Al ver las carpetas sabes qué hace el sistema
- **Cohesión alta**: Todo lo relacionado a "productos" está junto

### Principios Aplicados:

1. **Separación por Dominio** (no por tecnología)
   ```
   ❌ NO:  controllers/ models/ views/
   ✅ SÍ:  productos/ inventario/ ventas/
   ```

2. **Server Actions como capa de negocio**
   - Remplazan controllers tradicionales
   - Se ejecutan en el servidor (serverless)
   - Retornan datos directamente a componentes

3. **Colocation** (cercanía)
   - UI y lógica de negocio de cada feature están cerca
   - Facilita encontrar y modificar código relacionado

## 🏢 Capas de la Arquitectura

```
┌─────────────────────────────────────────┐
│  PRESENTACIÓN (UI)                      │
│  src/app/(principal)/dashboard/         │
│  - Páginas (Server Components)          │
│  - Componentes de UI (Client)           │
│  - Formularios y tablas                 │
└─────────────────┬───────────────────────┘
                  │
                  ↓ llama a
┌─────────────────────────────────────────┐
│  LÓGICA DE NEGOCIO (Features)           │
│  src/caracteristicas/*/acciones.ts      │
│  - Server Actions ('use server')        │
│  - Validaciones de negocio              │
│  - Transformaciones de datos            │
└─────────────────┬───────────────────────┘
                  │
                  ↓ usa
┌─────────────────────────────────────────┐
│  ACCESO A DATOS (ORM)                   │
│  Prisma Client                          │
│  - Queries a PostgreSQL                 │
│  - Transacciones                        │
│  - Relaciones entre modelos             │
└─────────────────┬───────────────────────┘
                  │
                  ↓ persiste en
┌─────────────────────────────────────────┐
│  BASE DE DATOS                          │
│  Supabase (PostgreSQL)                  │
│  - Esquema relacional                   │
│  - Constraints e índices                │
└─────────────────────────────────────────┘
```

## 📊 Estructura de Carpetas Detallada

```
src/
├── app/                                # Next.js App Router (Presentación)
│   ├── (autenticacion)/
│   │   └── iniciar-sesion/            # Login
│   │
│   ├── (principal)/                    # Grupo de rutas protegidas
│   │   ├── dashboard/
│   │   │   ├── productos/             # CRUD de productos
│   │   │   ├── inventario/            # Control de stock
│   │   │   ├── envios/                # Planificación de traslados
│   │   │   ├── ventas/                # Punto de venta (POS)
│   │   │   ├── sucursales/            # Gestión de sucursales
│   │   │   └── reportes/              # Analítica y reportes
│   │   └── layout.tsx                 # Layout con sidebar
│   │
│   ├── api/                            # API Routes (minimal)
│   │   ├── auth/[...nextauth]/        # NextAuth handler
│   │   └── sucursales/                # Endpoints REST (si necesario)
│   │
│   └── no-autorizado/                 # Página de acceso denegado
│
├── caracteristicas/                    # Lógica de Negocio (Features)
│   ├── autenticacion/
│   │   ├── auth.ts                    # Config NextAuth
│   │   └── adapter.ts                 # Adapter custom
│   │
│   ├── productos/
│   │   └── acciones.ts                # Server Actions de productos
│   │
│   ├── inventario/
│   │   └── acciones.ts                # Server Actions de inventario
│   │
│   ├── envios/
│   │   └── acciones.ts                # Server Actions de envíos
│   │
│   ├── ventas/
│   │   └── acciones.ts                # Server Actions de ventas
│   │
│   ├── sucursales/
│   │   └── acciones.ts                # Server Actions de sucursales
│   │
│   └── dashboard/
│       └── acciones.ts                # Server Actions del dashboard
│
└── compartido/                         # Código Compartido
    ├── componentes/
    │   ├── ui/                        # shadcn/ui components
    │   └── layout/                    # Sidebar, navbar
    ├── tipos/                         # TypeScript types
    └── lib/                           # Utilidades

lib/
└── prisma.ts                          # Singleton de Prisma Client

prisma/
├── schema.prisma                      # Esquema de base de datos
└── seed.ts                            # Datos de prueba

middleware.ts                          # Auth + RBAC
```

## 🔄 Flujo de Datos (Ejemplo: Registrar Venta)

```typescript
// 1. PRESENTACIÓN: Usuario interactúa
// src/app/(principal)/dashboard/ventas/page.tsx
'use client'
import { registrarVenta } from '@/caracteristicas/ventas/acciones'

function FormularioVenta() {
  const handleSubmit = async (data) => {
    const result = await registrarVenta(data)  // ← Llama Server Action
    if (result.success) { /* ... */ }
  }
}

// 2. LÓGICA DE NEGOCIO: Server Action
// src/caracteristicas/ventas/acciones.ts
'use server'
import { prisma } from '@/lib/prisma'

export async function registrarVenta(data) {
  // Validaciones de negocio
  if (data.items.length === 0) return { success: false }

  // Operación en BD (transacción)
  const venta = await prisma.$transaction(async (tx) => {
    // Crear venta
    const nuevaVenta = await tx.venta.create({ ... })

    // Actualizar inventario
    for (const item of data.items) {
      await tx.inventario.update({ ... })
    }

    return nuevaVenta
  })

  revalidatePath('/dashboard/ventas')
  return { success: true, venta }
}

// 3. ACCESO A DATOS: Prisma ejecuta queries
// 4. BASE DE DATOS: PostgreSQL persiste
```

## 🔄 Flujo de Petición Completo

1. **Usuario** → Interactúa con formulario (Client Component)
2. **Client** → Llama Server Action directamente
3. **Server Action** → Valida datos de negocio
4. **Prisma** → Ejecuta queries/transacciones
5. **PostgreSQL** → Persiste datos
6. **Prisma** → Retorna resultados
7. **Server Action** → Revalida caché (`revalidatePath`)
8. **Client** → Recibe respuesta y actualiza UI

## ✨ Ventajas de esta Arquitectura

### 1. **Mantenibilidad** 🔧
- Todo el código de una feature está en un solo lugar
- Fácil encontrar dónde modificar algo (ej: productos → `caracteristicas/productos/`)
- Menos acoplamiento entre features

### 2. **Escalabilidad** 📈
- Arquitectura serverless que escala automáticamente en Vercel
- Base de datos PostgreSQL escalable con Supabase
- Cada feature puede crecer independientemente
- Fácil agregar nuevas features sin afectar las existentes

### 3. **Developer Experience** 👨‍💻
- Estructura intuitiva: "¿Dónde está la lógica de ventas?" → `caracteristicas/ventas/`
- Menos boilerplate que arquitecturas tradicionales
- Server Actions = menos código que API REST tradicional
- TypeScript + Prisma = seguridad de tipos end-to-end

### 4. **Performance** ⚡
- Server Components por defecto (menos JS al cliente)
- Server Actions optimizados por Next.js
- Caché automático con `revalidatePath()`
- Queries Prisma optimizadas

### 5. **Testabilidad** ✅
- Server Actions son funciones puras fáciles de testear
- Cada feature es independiente
- Mocks de Prisma para testing

## 🆚 Comparación con otras Arquitecturas

| Aspecto | Este Proyecto | MVC Tradicional | Hexagonal |
|---------|---------------|-----------------|-----------|
| **Organización** | Por features (vertical) | Por capas (horizontal) | Por capas + ports |
| **Boilerplate** | Bajo | Medio | Alto |
| **Complejidad** | Baja-Media | Media | Alta |
| **Mantenibilidad** | ✅ Alta (cohesión) | ⚠️ Media | ✅ Alta |
| **Curva aprendizaje** | ✅ Baja | Media | Alta |
| **Ideal para** | Apps serverless modernas | Apps monolíticas | Sistemas complejos |

## 🔀 Patrones de Diseño Aplicados

### 1. **Transaction Script** (en Server Actions)
Lógica de negocio organizada en procedimientos por caso de uso:
```typescript
export async function registrarVenta(data) {
  // Todo el flujo de registrar venta en una función
  await prisma.$transaction(...)
}
```

### 2. **Active Record** (con Prisma)
Los modelos de Prisma incluyen métodos para persistencia:
```typescript
await prisma.producto.create(...)
await prisma.inventario.update(...)
```

### 3. **Repository Pattern** (implícito con Prisma)
Prisma actúa como repository sin abstracciones extra:
```typescript
// Prisma = Repository para todos los modelos
const productos = await prisma.producto.findMany()
```

### 4. **Service Layer** (Server Actions)
Server Actions actúan como capa de servicios:
```typescript
// caracteristicas/inventario/acciones.ts
export async function registrarMovimiento(data) {
  // Validación
  // Lógica de negocio
  // Persistencia
}
```

## 🛠 Cómo Continuar el Desarrollo

### 1. Configuración Local
```bash
git clone <repositorio>
npm install
npm run dev
```

### 2. Requisitos
- Node.js 18+
- npm o yarn
- Cuenta en Supabase
- Variables de entorno configuradas

### 3. Agregar una Nueva Feature

**Ejemplo: Agregar módulo de "Clientes"**

1. **Actualizar Schema de BD** (`prisma/schema.prisma`):
```prisma
model Cliente {
  id        String   @id @default(cuid())
  nombre    String
  correo    String   @unique
  telefono  String?
  createdAt DateTime @default(now())

  @@map("clientes")
}
```

2. **Ejecutar migración**:
```bash
npm run prisma:generate
npm run prisma:migrate
```

3. **Crear Server Actions** (`src/caracteristicas/clientes/acciones.ts`):
```typescript
'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function obtenerClientes() {
  const clientes = await prisma.cliente.findMany()
  return { success: true, clientes }
}

export async function crearCliente(data) {
  const cliente = await prisma.cliente.create({ data })
  revalidatePath('/dashboard/clientes')
  return { success: true, cliente }
}
```

4. **Crear Página** (`src/app/(principal)/dashboard/clientes/page.tsx`):
```typescript
import { obtenerClientes } from '@/caracteristicas/clientes/acciones'

export default async function ClientesPage() {
  const { clientes } = await obtenerClientes()
  return <div>{/* UI aquí */}</div>
}
```

5. **Actualizar Middleware** (si hay restricciones de rol):
```typescript
// middleware.ts
const roleAccess = {
  administrador: [
    /^\/dashboard\/clientes(\/.*)?$/,  // ← Agregar
  ],
}
```

6. **Agregar al Sidebar** (`src/compartido/componentes/layout/sidebar.tsx`):
```typescript
<Link href="/dashboard/clientes">Clientes</Link>
```

### 4. Áreas de Expansión
- ✅ Implementar más módulos (clientes, proveedores, etc.)
- ✅ Agregar análisis y reportes avanzados
- ✅ Implementar notificaciones en tiempo real
- ✅ Integrar con servicios externos (facturación, envíos)
- ✅ Agregar exportación de reportes (PDF, Excel)

## 📐 Mejores Prácticas del Proyecto

### Convenciones de Código

1. **Nombres en Español** para dominio de negocio:
```typescript
// ✅ CORRECTO
export async function obtenerProductos() { }
const ventasTotales = 0

// ❌ INCORRECTO
export async function getProducts() { }
const totalSales = 0
```

2. **Server Actions siempre retornan objeto con `success`**:
```typescript
// ✅ CORRECTO
return { success: true, data: producto }
return { success: false, error: 'Mensaje de error' }

// ❌ INCORRECTO
return producto  // Sin wrapper
throw new Error() // No lanzar errores
```

3. **Usar transacciones para operaciones múltiples**:
```typescript
// ✅ CORRECTO - Transacción atómica
await prisma.$transaction(async (tx) => {
  await tx.venta.create({ ... })
  await tx.inventario.update({ ... })
})

// ❌ INCORRECTO - Operaciones separadas
await prisma.venta.create({ ... })
await prisma.inventario.update({ ... })
```

4. **Revalidar caché después de mutaciones**:
```typescript
// ✅ CORRECTO
export async function crearProducto(data) {
  const producto = await prisma.producto.create({ data })
  revalidatePath('/dashboard/productos')  // ← Revalidar
  return { success: true, producto }
}
```

5. **Incluir datos relacionados con `include`**:
```typescript
// ✅ CORRECTO - Evita N+1 queries
const ventas = await prisma.venta.findMany({
  include: {
    items: { include: { producto: true } },
    vendedor: true,
  }
})

// ❌ INCORRECTO - Múltiples queries
const ventas = await prisma.venta.findMany()
for (const venta of ventas) {
  venta.items = await prisma.ventaItem.findMany({ ... })
}
```

### Estructura de Componentes

```typescript
// Server Component (página)
// src/app/(principal)/dashboard/productos/page.tsx
import { obtenerProductos } from '@/caracteristicas/productos/acciones'
import { ProductosLista } from './productos-lista'

export default async function ProductosPage() {
  const { productos } = await obtenerProductos()
  return <ProductosLista productos={productos} />
}

// Client Component (interactivo)
// src/app/(principal)/dashboard/productos/productos-lista.tsx
'use client'
export function ProductosLista({ productos }) {
  // Lógica interactiva aquí
}
```

## 🔒 Seguridad

### Implementada:
- ✅ **Autenticación**: NextAuth.js con JWT
- ✅ **Autorización**: RBAC en `middleware.ts`
- ✅ **Validación**: Zod schemas en formularios
- ✅ **Variables de entorno**: Separadas del código
- ✅ **Server Actions**: Se ejecutan solo en servidor
- ✅ **Prisma**: Previene SQL injection

### Middleware de Autenticación:
```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  if (!token) return redirect('/iniciar-sesion')

  const rol = token.rol
  const allowed = roleAccess[rol]?.some(re => re.test(pathname))
  if (!allowed) return redirect('/no-autorizado')

  return NextResponse.next()
}
```

## 📈 Monitoreo y Debugging

### Herramientas Disponibles:
- **Vercel Analytics**: Métricas de rendimiento y tráfico
- **Supabase Logs**: Queries de base de datos
- **Prisma Studio**: `npm run prisma:studio` - GUI para ver/editar datos
- **Next.js DevTools**: Debugging en desarrollo
- **Console Logs**: Ver logs en terminal del servidor

### Endpoints de Diagnóstico:
```typescript
// /api/test-db - Verificar conexión a BD
// /api/debug-env - Ver variables de entorno (solo dev)
// /api/diagnostics - Estado general del sistema
```

## 📚 Recursos de Aprendizaje

### Documentación Oficial:
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Archivos del Proyecto:
- `CLAUDE.md` - Guía para Claude Code
- `INICIO-RAPIDO.md` - Setup rápido
- `ESTRUCTURA-ESPAÑOL.md` - Convenciones de nomenclatura
- `CONFIGURACION-SUPABASE.md` - Setup de base de datos

## 🎯 Resumen Ejecutivo

### Este proyecto ES:
✅ Feature-Driven Architecture (organización vertical)
✅ Server Actions para lógica de negocio
✅ Prisma como ORM directo
✅ Next.js 14 serverless en Vercel
✅ Nomenclatura en español para dominio

### Este proyecto NO ES:
❌ MVC tradicional (no hay controllers/models/views separados)
❌ Hexagonal (no hay ports/adapters)
❌ API REST tradicional (usa Server Actions)
❌ Aplicación monolítica (es serverless)

### Stack Tecnológico:
```
Frontend:   Next.js 14 + React + TypeScript
Estilos:    Tailwind CSS + shadcn/ui
Backend:    Next.js Server Actions (serverless)
Base Datos: Supabase (PostgreSQL) + Prisma
Auth:       NextAuth.js (JWT)
Deploy:     Vercel
```

### Flujo de Trabajo Típico:
1. Usuario interactúa con **Client Component**
2. Llama **Server Action** desde `caracteristicas/*/acciones.ts`
3. Server Action usa **Prisma** para BD
4. Revalida caché con `revalidatePath()`
5. Retorna resultado al componente
6. UI se actualiza reactivamente

---

## 🚀 Quick Start

Para comenzar a trabajar en el proyecto:

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Supabase

# 3. Generar Prisma Client
npm run prisma:generate

# 4. Ejecutar migraciones
npm run prisma:migrate

# 5. Poblar datos de prueba
npm run seed

# 6. Iniciar desarrollo
npm run dev
```

Accede a: http://localhost:3000

**Credenciales de prueba:**
- Admin: `admin@empresa.com` / `admin123`
- Bodega: `bodega@empresa.com` / `bodega123`
- Sucursal: `sucursal@empresa.com` / `sucursal123`

---

## 🧪 Estrategia de Testing

### Estructura de Tests

El proyecto implementa una estrategia de testing en **tres niveles** siguiendo la pirámide de testing:

```
tests/
├── unitarios/              # 60% - Tests rápidos de funciones aisladas
│   ├── productos/
│   ├── inventario/
│   ├── ventas/
│   └── envios/
│
├── integracion/            # 30% - Tests con base de datos
│   ├── productos/
│   ├── inventario/
│   ├── ventas/
│   └── envios/
│
├── e2e/                    # 10% - Tests de usuario completo
│   ├── autenticacion/
│   ├── flujos-ventas/
│   ├── flujos-inventario/
│   └── flujos-envios/
│
└── setup/                  # Configuración
    ├── jest.config.js
    ├── jest.setup.js
    ├── playwright.config.ts
    └── mocks/
        ├── prisma.ts
        └── datos-prueba.ts
```

### Comandos de Testing

```bash
# Tests Unitarios (rápidos)
npm run test:unit              # Correr todos los unitarios
npm run test:unit:watch        # Modo watch para desarrollo

# Tests de Integración (con BD)
npm run test:integration       # Correr todos con BD real

# Tests E2E (usuario completo)
npm run test:e2e               # Correr E2E con Playwright
npm run test:e2e:ui            # Modo interfaz visual
npm run test:e2e:headed        # Con navegador visible

# Todos los tests
npm run test                   # Unitarios + Integración
npm run test:ci                # Todos incluido E2E (para CI/CD)
npm run test:coverage          # Generar reporte de cobertura
npm run test:watch             # Modo watch general
```

### Tipos de Tests

#### 1. Tests Unitarios (`tests/unitarios/`)
**Objetivo**: Probar funciones aisladas con mocks

**Qué testear**:
- ✅ Server Actions con Prisma mockeado
- ✅ Funciones de utilidad
- ✅ Validaciones de negocio
- ✅ Cálculos y transformaciones

**Ejemplo**:
```typescript
// tests/unitarios/productos/crear-producto.test.ts
import { crearProducto } from '@/caracteristicas/productos/acciones'
import { prismaMock } from '../../setup/mocks/prisma'

it('debe crear un producto exitosamente', async () => {
  prismaMock.producto.create.mockResolvedValue(mockProducto)

  const resultado = await crearProducto(datos)

  expect(resultado.success).toBe(true)
  expect(prismaMock.producto.create).toHaveBeenCalledTimes(1)
})
```

#### 2. Tests de Integración (`tests/integracion/`)
**Objetivo**: Probar flujos completos con base de datos real

**Qué testear**:
- ✅ Server Actions con Prisma real
- ✅ Transacciones de base de datos
- ✅ Relaciones entre modelos
- ✅ Casos de negocio completos

**Ejemplo**:
```typescript
// tests/integracion/ventas/registrar-venta.test.ts
it('debe registrar venta y actualizar inventario', async () => {
  const resultado = await registrarVenta(datosVenta)

  expect(resultado.success).toBe(true)

  // Verificar en BD real
  const venta = await prisma.venta.findUnique(...)
  const inventario = await prisma.inventario.findUnique(...)

  expect(venta).toBeDefined()
  expect(inventario.cantidadActual).toBe(stockEsperado)
})
```

#### 3. Tests E2E (`tests/e2e/`)
**Objetivo**: Probar la aplicación como un usuario real

**Qué testear**:
- ✅ Flujos de usuario completos
- ✅ Navegación entre páginas
- ✅ Formularios y validaciones
- ✅ Autenticación y autorización

**Ejemplo**:
```typescript
// tests/e2e/flujos-ventas/registrar-venta.spec.ts
test('debe registrar una venta completa', async ({ page }) => {
  await page.goto('/iniciar-sesion')
  await page.fill('input[name="correo"]', 'admin@empresa.com')
  await page.click('button[type="submit"]')

  await page.goto('/dashboard/ventas')
  await page.click('[data-testid="agregar-producto"]')
  await page.click('[data-testid="registrar-venta"]')

  await expect(page.locator('.toast-success')).toBeVisible()
})
```

### Convenciones de Testing

**Nombres de archivos** (en español):
```
✅ crear-producto.test.ts
✅ registrar-venta.test.ts
✅ calcular-stock.test.ts
✅ login.spec.ts (E2E)

❌ createProduct.test.ts
❌ sale.spec.ts
```

**Estructura de tests** (AAA Pattern):
```typescript
it('descripción en español del comportamiento', async () => {
  // Arrange - Preparar datos
  const datos = { ... }

  // Act - Ejecutar acción
  const resultado = await funcionATestear(datos)

  // Assert - Verificar resultado
  expect(resultado.success).toBe(true)
})
```

### Herramientas

- **Jest**: Tests unitarios e integración
- **React Testing Library**: Tests de componentes
- **Playwright**: Tests E2E
- **jest-mock-extended**: Mocks de Prisma

### Cobertura de Tests

**Objetivo mínimo**: 80% de cobertura general

**Prioridades**:
1. 🔴 **Crítico** (100%): Ventas, Inventario, Transacciones
2. 🟡 **Importante** (80%): Productos, Envíos
3. 🟢 **Normal** (60%): Utilidades, UI

Ver documentación completa en: `tests/README.md`

---

**Última actualización:** 2025
**Mantenedor:** Equipo de desarrollo
**Arquitectura:** Feature-Driven + Server Actions
