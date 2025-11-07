# Arquitectura DDD (Domain-Driven Design)

## Introducción

Este proyecto implementa **Domain-Driven Design (DDD)** combinado con **Screaming Architecture**, priorizando que la estructura del código refleje claramente el dominio del negocio.

## Estructura del Proyecto

```
src/
├── caracteristicas/          # Domain Layer - Casos de uso del negocio
│   ├── autenticacion/        # Bounded Context: Autenticación
│   ├── usuarios/             # Bounded Context: Gestión de Usuarios
│   ├── productos/            # Bounded Context: Productos
│   ├── inventario/           # Bounded Context: Inventario
│   ├── ventas/               # Bounded Context: Ventas
│   ├── envios/               # Bounded Context: Envíos
│   ├── produccion/           # Bounded Context: Producción
│   ├── sucursales/           # Bounded Context: Sucursales
│   └── roles/                # Bounded Context: Roles y Permisos
│
├── compartido/               # Shared Kernel
│   ├── lib/                  # Utilidades compartidas
│   │   ├── dal.ts           # Data Access Layer
│   │   ├── permisos.ts      # Sistema de permisos
│   │   ├── auditoria.ts     # Servicio de auditoría
│   │   ├── rate-limit.ts    # Rate limiting
│   │   └── container.ts     # Inyección de dependencias
│   │
│   ├── componentes/          # UI Components compartidos
│   │   ├── layout/          # Layouts
│   │   └── ui/              # Componentes base (shadcn/ui)
│   │
│   └── tipos/                # Types compartidos
│       └── next-auth.d.ts   # Extensiones de tipos
│
├── app/                      # Presentation Layer (Next.js App Router)
│   ├── (auth)/              # Grupo de rutas de autenticación
│   └── (principal)/         # Grupo de rutas principales
│       └── dashboard/       # Dashboard principal
│
├── lib/                      # Infrastructure Layer
│   ├── prisma.ts            # Cliente de Prisma
│   └── utils.ts             # Utilidades generales
│
└── prisma/                   # Database Schema
    ├── schema.prisma        # Definición del schema
    └── seed.ts              # Datos iniciales
```

## Capas de la Arquitectura

### 1. Domain Layer (`src/caracteristicas/`)

Contiene la lógica de negocio organizada por **Bounded Contexts**.

#### Estructura de un Bounded Context

```
src/caracteristicas/usuarios/
├── repositorio.ts           # Repository Pattern
├── schemas.ts               # Validaciones con Zod (Domain Rules)
├── acciones.ts              # Server Actions (Application Services)
├── tipos.ts                 # Types del dominio
├── componentes/             # UI Components específicos
│   ├── UsuariosLista.tsx
│   ├── FormularioUsuario.tsx
│   └── ToggleUsuarioActivo.tsx
└── __tests__/               # Tests del dominio
    ├── repositorio.test.ts
    └── schemas.test.ts
```

#### Repository Pattern

Los repositorios encapsulan el acceso a datos y las operaciones CRUD:

```typescript
// src/caracteristicas/usuarios/repositorio.ts
@injectable()
export class UsuarioRepository {
  async create(data: CreateUsuarioInput) {
    // Validación
    const validated = createUsuarioSchema.parse(data)

    // Hash de contraseña
    const hashedPassword = await hash(validated.password, {
      memoryCost: 19456,
      timeCost: 2,
    })

    // Crear usuario
    return prisma.usuario.create({
      data: {
        ...validated,
        contrasenaHash: hashedPassword,
      },
    })
  }

  async findByEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { correo: email.toLowerCase().trim() },
      include: { rol: true },
    })
  }

  // ... más métodos
}
```

#### Schemas (Domain Rules)

Las validaciones definen las reglas del dominio:

```typescript
// src/caracteristicas/usuarios/schemas.ts
export const emailSchema = z
  .string()
  .email('Email inválido')
  .max(255)
  .transform(val => val.toLowerCase().trim())

export const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(100)
  .regex(/[a-z]/, 'Debe incluir minúsculas')
  .regex(/[A-Z]/, 'Debe incluir mayúsculas')
  .regex(/[0-9]/, 'Debe incluir números')
  .regex(/[^a-zA-Z0-9]/, 'Debe incluir caracteres especiales')

export const createUsuarioSchema = z.object({
  nombre: nombreSchema,
  correo: emailSchema,
  password: passwordSchema,
  rolId: z.number().int().positive(),
})
```

#### Server Actions (Application Services)

Las Server Actions orquestan casos de uso:

```typescript
// src/caracteristicas/usuarios/acciones.ts
'use server'

export async function crearUsuario(data: CreateUsuarioInput) {
  try {
    // 1. Verificar permisos
    await requirePermission('usuarios.crear')

    // 2. Obtener usuario actual
    const currentUserId = await getCurrentUserId()

    // 3. Validar datos
    const validated = createUsuarioSchema.parse(data)

    // 4. Crear usuario
    const repository = new UsuarioRepository()
    const usuario = await repository.create(validated)

    // 5. Auditoría
    await registrarAuditoria({
      usuarioId: currentUserId,
      accion: 'CREATE_USER',
      entidad: 'Usuario',
      entidadId: String(usuario.id),
      detalles: { nombre: usuario.nombre, correo: usuario.correo },
      exitoso: true,
    })

    return { success: true, usuario }
  } catch (error) {
    return { success: false, error: 'Error al crear usuario' }
  }
}
```

### 2. Shared Kernel (`src/compartido/`)

Código compartido entre múltiples Bounded Contexts.

#### Data Access Layer (DAL)

Capa de seguridad que valida sesiones:

```typescript
// src/compartido/lib/dal.ts
export async function verifySession() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error('No autorizado')
  }

  return session
}

export async function requireRole(role: string | string[]) {
  const session = await verifySession()
  const userRole = session.user.roleName

  const allowedRoles = Array.isArray(role) ? role : [role]

  if (!allowedRoles.includes(userRole)) {
    throw new Error('No tienes permisos para esta acción')
  }

  return session
}
```

#### Sistema de Permisos

Validación granular de permisos:

```typescript
// src/compartido/lib/permisos.ts
export async function requirePermission(permission: string) {
  const session = await verifySession()

  // Administrador tiene todos los permisos
  if (session.user.roleName === 'administrador') {
    return session
  }

  const hasPermission = await roleRepo.hasPermission(
    session.user.roleName,
    permission
  )

  if (!hasPermission) {
    throw new Error(`No tienes el permiso: ${permission}`)
  }

  return session
}
```

### 3. Presentation Layer (`src/app/`)

Componentes de UI y rutas de Next.js.

#### Server Components

```typescript
// src/app/(principal)/dashboard/usuarios/page.tsx
export default async function UsuariosPage() {
  // ✅ Validación de rol en el servidor
  await requireRole('administrador')

  return (
    <div>
      <h1>Gestión de Usuarios</h1>
      <Suspense fallback={<Loading />}>
        <UsuariosLista />
      </Suspense>
    </div>
  )
}
```

#### Client Components

```typescript
// src/caracteristicas/usuarios/componentes/FormularioUsuario.tsx
'use client'

export function FormularioUsuario({ roles }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const result = await crearUsuario(data)

      if (result.success) {
        router.push('/dashboard/usuarios')
      }
    })
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### 4. Infrastructure Layer (`lib/`)

Configuración de infraestructura y servicios externos.

```typescript
// lib/prisma.ts
const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}
```

## Principios SOLID

### Single Responsibility Principle (SRP)

Cada clase tiene una única responsabilidad:

```typescript
// ✅ Bueno: Responsabilidades separadas
class UsuarioRepository {
  // Solo se encarga de operaciones CRUD
}

class UsuarioValidator {
  // Solo se encarga de validaciones
}

class PasswordHasher {
  // Solo se encarga de hashear contraseñas
}
```

### Open/Closed Principle (OCP)

Abierto para extensión, cerrado para modificación:

```typescript
// Base abstracta
interface IRepository<T> {
  findById(id: number): Promise<T | null>
  create(data: any): Promise<T>
  update(id: number, data: any): Promise<T>
  delete(id: number): Promise<void>
}

// Implementación específica
class UsuarioRepository implements IRepository<Usuario> {
  // Implementación
}
```

### Liskov Substitution Principle (LSP)

Las clases derivadas deben poder sustituir a las base:

```typescript
interface IAuthService {
  login(credentials: Credentials): Promise<Session>
  logout(sessionId: string): Promise<void>
}

class NextAuthService implements IAuthService {
  // Implementación con NextAuth
}

class CustomAuthService implements IAuthService {
  // Implementación personalizada
}
```

### Interface Segregation Principle (ISP)

Interfaces específicas en lugar de generales:

```typescript
// ❌ Malo: Interface muy grande
interface IUserOperations {
  create()
  read()
  update()
  delete()
  changePassword()
  resetPassword()
  sendEmail()
}

// ✅ Bueno: Interfaces segregadas
interface IUserCRUD {
  create()
  read()
  update()
  delete()
}

interface IUserPassword {
  changePassword()
  resetPassword()
}

interface IUserNotification {
  sendEmail()
}
```

### Dependency Inversion Principle (DIP)

Depender de abstracciones, no de implementaciones:

```typescript
// src/compartido/lib/container.ts
import 'reflect-metadata'
import { container } from 'tsyringe'

// Registrar dependencias
container.register('IUsuarioRepository', {
  useClass: UsuarioRepository,
})

// Uso con inyección
@injectable()
class UsuarioService {
  constructor(
    @inject('IUsuarioRepository') private repo: IUsuarioRepository
  ) {}
}
```

## Patrones de Diseño Utilizados

### 1. Repository Pattern
- Encapsula acceso a datos
- Facilita testing con mocks
- Independencia de la implementación de BD

### 2. Service Layer Pattern
- Server Actions como capa de servicios
- Orquestación de casos de uso
- Validación y autorización

### 3. Factory Pattern
- Creación de objetos complejos
- Usado en repositorios y servicios

### 4. Dependency Injection
- Desacoplamiento de componentes
- Facilita testing
- Uso de tsyringe

### 5. Strategy Pattern
- Diferentes estrategias de autenticación
- Validaciones configurables

## Bounded Contexts

### Contexto: Usuarios
**Responsabilidad**: Gestión de usuarios y autenticación

**Entidades**:
- Usuario
- Role
- Permission

**Casos de uso**:
- Crear usuario
- Editar usuario
- Activar/Desactivar usuario
- Asignar rol
- Cambiar contraseña

### Contexto: Inventario
**Responsabilidad**: Control de stock

**Entidades**:
- Inventario
- MovimientoInventario

**Casos de uso**:
- Registrar entrada
- Registrar salida
- Ajustar stock
- Consultar disponibilidad

### Contexto: Ventas
**Responsabilidad**: Gestión de ventas

**Entidades**:
- Venta
- VentaItem
- Devolucion

**Casos de uso**:
- Crear venta
- Registrar devolución
- Consultar ventas
- Generar reportes

## Comunicación Entre Contextos

### Eventos de Dominio

```typescript
// src/compartido/eventos/dominio.ts
interface DomainEvent {
  type: string
  payload: any
  timestamp: Date
}

class EventBus {
  private handlers = new Map<string, Function[]>()

  subscribe(eventType: string, handler: Function) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    this.handlers.get(eventType)!.push(handler)
  }

  publish(event: DomainEvent) {
    const handlers = this.handlers.get(event.type) || []
    handlers.forEach(handler => handler(event))
  }
}
```

### Ejemplo de Uso

```typescript
// Cuando se crea una venta
eventBus.publish({
  type: 'VENTA_CREADA',
  payload: { ventaId, items },
  timestamp: new Date(),
})

// El contexto de inventario escucha
eventBus.subscribe('VENTA_CREADA', async (event) => {
  // Descontar del inventario
  await inventarioService.descontarStock(event.payload.items)
})
```

## Testing en DDD

### Tests Unitarios

```typescript
// Test del repositorio
describe('UsuarioRepository', () => {
  it('debe crear un usuario con contraseña hasheada', async () => {
    const repo = new UsuarioRepository()
    const usuario = await repo.create({
      nombre: 'Test',
      correo: 'test@test.com',
      password: 'Password123!',
      rolId: 1,
    })

    expect(usuario.contrasenaHash).not.toBe('Password123!')
  })
})
```

### Tests de Integración

```typescript
// Test del caso de uso completo
describe('Crear Usuario - Caso de Uso', () => {
  it('debe crear usuario y registrar auditoría', async () => {
    const result = await crearUsuario({
      nombre: 'Test',
      correo: 'test@test.com',
      password: 'Password123!',
      rolId: 1,
    })

    expect(result.success).toBe(true)

    // Verificar que se registró en auditoría
    const logs = await prisma.auditLog.findMany({
      where: { accion: 'CREATE_USER' },
    })
    expect(logs.length).toBeGreaterThan(0)
  })
})
```

## Mejores Prácticas

### 1. Mantener Bounded Contexts Pequeños
- Cada contexto debe tener una responsabilidad clara
- Evitar contextos "dios" que hacen de todo

### 2. Validar en el Dominio
- Todas las reglas de negocio en schemas.ts
- Validación antes de persistir

### 3. Usar Value Objects
```typescript
class Email {
  private readonly value: string

  constructor(email: string) {
    if (!this.isValid(email)) {
      throw new Error('Email inválido')
    }
    this.value = email.toLowerCase().trim()
  }

  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  toString(): string {
    return this.value
  }
}
```

### 4. Separar Read y Write Models (CQRS)
```typescript
// Write Model
async function crearUsuario(data) {
  // Lógica compleja de creación
}

// Read Model (optimizado para lectura)
async function obtenerUsuariosParaLista() {
  return prisma.usuario.findMany({
    select: {
      id: true,
      nombre: true,
      correo: true,
      rol: { select: { nombre: true } },
    },
  })
}
```

### 5. Auditoría en Todos los Cambios
```typescript
async function updateEntity(id, data) {
  const old = await repo.findById(id)
  const updated = await repo.update(id, data)

  await registrarAuditoria({
    accion: 'UPDATE',
    entidad: 'Usuario',
    entidadId: id,
    detalles: {
      antes: old,
      despues: updated,
    },
  })
}
```

## Referencias

- [Domain-Driven Design por Eric Evans](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)
- [Implementing Domain-Driven Design por Vaughn Vernon](https://www.amazon.com/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577)
- [Clean Architecture por Robert C. Martin](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)

---

**Última actualización**: 2025-11-06
