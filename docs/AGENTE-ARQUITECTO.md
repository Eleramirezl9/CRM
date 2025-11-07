# 🏗️ Guía del Arquitecto - Sistema CRM

> **Tu rol**: Arquitecto senior que implementa features profesionales con código limpio en español siguiendo nuestra estructura.

## 📁 REGLA DE ORO: Estructura de Carpetas

### Todo tiene su lugar - NUNCA lo rompas

```
src/
├── app/                                    # 🎨 UI y Rutas (Next.js)
│   ├── (autenticacion)/
│   │   └── iniciar-sesion/                # Páginas de login
│   └── (principal)/
│       └── dashboard/
│           ├── [feature]/                 # 📍 Páginas por feature
│           │   ├── page.tsx              # Lista principal
│           │   ├── nuevo/
│           │   │   └── page.tsx          # Crear nuevo
│           │   └── [id]/
│           │       └── page.tsx          # Editar/ver detalle
│
├── caracteristicas/                        # 🧠 Lógica de Negocio (CORE)
│   └── [feature]/                         # 📍 UN FOLDER POR FEATURE
│       ├── repositorio.ts                 # 💾 CRUD + acceso a datos
│       ├── schemas.ts                     # ✅ Validaciones Zod
│       ├── acciones.ts                    # 🔧 Server Actions (casos de uso)
│       ├── tipos.ts                       # 📋 Types del dominio
│       ├── componentes/                   # 🎨 UI específicos
│       │   ├── [Feature]Lista.tsx        # Tabla/lista
│       │   ├── [Feature]Form.tsx         # Formulario
│       │   └── [Feature]Card.tsx         # Tarjeta
│       └── __tests__/                     # 🧪 Tests
│           ├── repositorio.test.ts
│           └── schemas.test.ts
│
├── compartido/                            # 🔄 Código Compartido
│   ├── lib/                              # 📦 Servicios compartidos
│   │   ├── dal.ts                        # Validación de sesión
│   │   ├── permisos.ts                   # Sistema de permisos
│   │   ├── auditoria.ts                  # Logging de acciones
│   │   └── rate-limit.ts                 # Anti-brute force
│   ├── componentes/
│   │   ├── ui/                           # shadcn/ui components
│   │   └── layout/                       # Sidebar, navbar
│   └── tipos/                            # Types globales
│
└── lib/
    └── prisma.ts                         # Cliente Prisma singleton

prisma/
├── schema.prisma                         # 🗄️ Modelos de BD
└── seed.ts                               # Datos de prueba

docs/                                     # 📚 Documentación
├── AGENTE-ARQUITECTO.md                  # Esta guía
├── arquitectura-ddd.md                   # Arquitectura detallada
├── sistema-permisos.md                   # Permisos RBAC
├── SEGURIDAD-IMPLEMENTADA.md             # Medidas de seguridad
└── testing.md                            # Guía de testing
```

---

## 🚀 Cómo Implementar una Nueva Feature (PASO A PASO)

### ✅ Ejemplo: Implementar módulo "Clientes"

#### 📍 PASO 1: Modelo de Datos (Prisma)

**Archivo:** `prisma/schema.prisma`

```prisma
model Cliente {
  id          Int      @id @default(autoincrement())
  nombre      String   @db.VarChar(100)
  rut         String   @unique @db.VarChar(12)
  email       String?  @db.VarChar(255)
  telefono    String?  @db.VarChar(20)
  direccion   String?  @db.Text
  activo      Boolean  @default(true)

  // Relaciones
  empresaId   Int
  empresa     Empresa  @relation(fields: [empresaId], references: [id])
  ventas      Venta[]

  // Timestamps
  createdAt   DateTime @default(now()) @map("creado_at")
  updatedAt   DateTime @updatedAt @map("actualizado_at")

  @@map("clientes")
  @@index([empresaId])
  @@index([rut])
}
```

**Ejecutar:**
```bash
npm run prisma:generate
npm run prisma:migrate
```

---

#### 📍 PASO 2: Repository Pattern

**Archivo:** `src/caracteristicas/clientes/repositorio.ts`

```typescript
import 'reflect-metadata'
import { injectable } from 'tsyringe'
import { prisma } from '@/lib/prisma'
import { createClienteSchema, updateClienteSchema } from './schemas'

@injectable()
export class ClienteRepository {
  // Crear
  async create(data: any) {
    const validated = createClienteSchema.parse(data)
    return await prisma.cliente.create({ data: validated })
  }

  // Buscar por ID
  async findById(id: number) {
    return await prisma.cliente.findUnique({
      where: { id },
      include: { empresa: true },
    })
  }

  // Listar todos
  async findMany(where?: any) {
    return await prisma.cliente.findMany({
      where,
      include: { empresa: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Actualizar
  async update(id: number, data: any) {
    const validated = updateClienteSchema.parse(data)
    return await prisma.cliente.update({
      where: { id },
      data: validated,
    })
  }

  // Eliminar (soft delete)
  async delete(id: number) {
    return await prisma.cliente.update({
      where: { id },
      data: { activo: false },
    })
  }

  // Buscar por RUT
  async findByRut(rut: string) {
    return await prisma.cliente.findUnique({
      where: { rut: rut.toUpperCase().trim() },
    })
  }
}
```

---

#### 📍 PASO 3: Validaciones (Schemas Zod)

**Archivo:** `src/caracteristicas/clientes/schemas.ts`

```typescript
import { z } from 'zod'

// Validador de RUT chileno
function validarRut(rut: string): boolean {
  const rutLimpio = rut.replace(/\./g, '').replace('-', '')
  const cuerpo = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1).toUpperCase()

  let suma = 0
  let multiplicador = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const dvEsperado = 11 - (suma % 11)
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : String(dvEsperado)

  return dv === dvCalculado
}

// Schemas base
export const rutSchema = z
  .string()
  .min(8, 'RUT inválido')
  .max(12, 'RUT inválido')
  .transform(val => val.toUpperCase().trim())
  .refine(validarRut, 'RUT inválido')

export const nombreSchema = z
  .string()
  .min(3, 'Mínimo 3 caracteres')
  .max(100, 'Máximo 100 caracteres')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras y espacios')
  .transform(val => val.trim())

export const emailSchema = z
  .string()
  .email('Email inválido')
  .max(255)
  .transform(val => val.toLowerCase().trim())
  .optional()

export const telefonoSchema = z
  .string()
  .regex(/^\+?[\d\s-]+$/, 'Teléfono inválido')
  .optional()

// Schema para crear
export const createClienteSchema = z.object({
  nombre: nombreSchema,
  rut: rutSchema,
  email: emailSchema,
  telefono: telefonoSchema,
  direccion: z.string().max(500).optional(),
  empresaId: z.number().int().positive(),
})

// Schema para actualizar
export const updateClienteSchema = createClienteSchema.partial()

// Types derivados
export type CreateClienteInput = z.infer<typeof createClienteSchema>
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>
```

---

#### 📍 PASO 4: Server Actions (Casos de Uso)

**Archivo:** `src/caracteristicas/clientes/acciones.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { ClienteRepository } from './repositorio'
import { requirePermission } from '@/compartido/lib/permisos'
import { getCurrentUserId } from '@/compartido/lib/dal'
import { registrarAuditoria } from '@/compartido/lib/auditoria'
import type { CreateClienteInput, UpdateClienteInput } from './schemas'

const repository = new ClienteRepository()

/**
 * Crear nuevo cliente
 */
export async function crearCliente(data: CreateClienteInput) {
  try {
    // 1. Permisos
    await requirePermission('clientes.crear')

    // 2. Usuario actual
    const userId = await getCurrentUserId()

    // 3. Validar RUT único
    const existe = await repository.findByRut(data.rut)
    if (existe) {
      return { success: false, error: 'RUT ya existe' }
    }

    // 4. Crear
    const cliente = await repository.create(data)

    // 5. Auditoría
    await registrarAuditoria({
      usuarioId: userId,
      accion: 'CREATE_CLIENTE',
      entidad: 'Cliente',
      entidadId: String(cliente.id),
      detalles: { nombre: cliente.nombre, rut: cliente.rut },
      exitoso: true,
    })

    // 6. Revalidar cache
    revalidatePath('/dashboard/clientes')

    return { success: true, cliente }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear cliente'
    }
  }
}

/**
 * Obtener clientes
 */
export async function obtenerClientes(filtros?: { activo?: boolean }) {
  try {
    await requirePermission('clientes.ver')

    const clientes = await repository.findMany(
      filtros?.activo !== undefined ? { activo: filtros.activo } : {}
    )

    return { success: true, clientes }
  } catch (error) {
    return { success: false, error: 'Error al obtener clientes' }
  }
}

/**
 * Obtener cliente por ID
 */
export async function obtenerClientePorId(id: number) {
  try {
    await requirePermission('clientes.ver')

    const cliente = await repository.findById(id)

    if (!cliente) {
      return { success: false, error: 'Cliente no encontrado' }
    }

    return { success: true, cliente }
  } catch (error) {
    return { success: false, error: 'Error al obtener cliente' }
  }
}

/**
 * Actualizar cliente
 */
export async function actualizarCliente(id: number, data: UpdateClienteInput) {
  try {
    await requirePermission('clientes.editar')

    const userId = await getCurrentUserId()

    const cliente = await repository.update(id, data)

    await registrarAuditoria({
      usuarioId: userId,
      accion: 'UPDATE_CLIENTE',
      entidad: 'Cliente',
      entidadId: String(id),
      detalles: data,
      exitoso: true,
    })

    revalidatePath('/dashboard/clientes')
    revalidatePath(`/dashboard/clientes/${id}`)

    return { success: true, cliente }
  } catch (error) {
    return { success: false, error: 'Error al actualizar cliente' }
  }
}

/**
 * Eliminar cliente
 */
export async function eliminarCliente(id: number) {
  try {
    await requirePermission('clientes.eliminar')

    const userId = await getCurrentUserId()

    await repository.delete(id)

    await registrarAuditoria({
      usuarioId: userId,
      accion: 'DELETE_CLIENTE',
      entidad: 'Cliente',
      entidadId: String(id),
      exitoso: true,
    })

    revalidatePath('/dashboard/clientes')

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al eliminar cliente' }
  }
}
```

---

#### 📍 PASO 5: Types del Dominio

**Archivo:** `src/caracteristicas/clientes/tipos.ts`

```typescript
import type { Cliente, Empresa } from '@prisma/client'

export type ClienteConRelaciones = Cliente & {
  empresa: Empresa
}

export type { CreateClienteInput, UpdateClienteInput } from './schemas'
```

---

#### 📍 PASO 6: Página Principal (Lista)

**Archivo:** `src/app/(principal)/dashboard/clientes/page.tsx`

```typescript
import { Suspense } from 'react'
import { requirePermission } from '@/compartido/lib/permisos'
import { redirect } from 'next/navigation'
import { ClientesLista } from '@/caracteristicas/clientes/componentes/ClientesLista'
import { Button } from '@/compartido/componentes/ui/button'
import Link from 'next/link'

export default async function ClientesPage() {
  try {
    await requirePermission('clientes.ver')
  } catch {
    redirect('/no-autorizado')
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestión de clientes</p>
        </div>
        <Link href="/dashboard/clientes/nuevo">
          <Button>Nuevo Cliente</Button>
        </Link>
      </div>

      <Suspense fallback={<div>Cargando clientes...</div>}>
        <ClientesLista />
      </Suspense>
    </div>
  )
}
```

---

#### 📍 PASO 7: Componente Lista

**Archivo:** `src/caracteristicas/clientes/componentes/ClientesLista.tsx`

```typescript
'use client'

import { useEffect, useState, useTransition } from 'react'
import { obtenerClientes, eliminarCliente } from '../acciones'
import { Button } from '@/compartido/componentes/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/compartido/componentes/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/compartido/componentes/ui/alert-dialog'
import { Badge } from '@/compartido/componentes/ui/badge'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import type { ClienteConRelaciones } from '../tipos'

export function ClientesLista() {
  const [clientes, setClientes] = useState<ClienteConRelaciones[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    cargarClientes()
  }, [])

  async function cargarClientes() {
    const result = await obtenerClientes()
    if (result.success && result.clientes) {
      setClientes(result.clientes)
    }
  }

  function handleEliminar(id: number) {
    startTransition(async () => {
      const result = await eliminarCliente(id)

      if (result.success) {
        toast.success('Cliente eliminado')
        cargarClientes()
      } else {
        toast.error(result.error || 'Error al eliminar')
      }
    })
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>RUT</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No hay clientes registrados
              </TableCell>
            </TableRow>
          ) : (
            clientes.map(cliente => (
              <TableRow key={cliente.id}>
                <TableCell className="font-mono">{cliente.rut}</TableCell>
                <TableCell className="font-medium">{cliente.nombre}</TableCell>
                <TableCell>{cliente.email || '-'}</TableCell>
                <TableCell>{cliente.telefono || '-'}</TableCell>
                <TableCell>
                  {cliente.activo ? (
                    <Badge>Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/clientes/${cliente.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se desactivará el cliente {cliente.nombre}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleEliminar(cliente.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

---

#### 📍 PASO 8: Página Crear

**Archivo:** `src/app/(principal)/dashboard/clientes/nuevo/page.tsx`

```typescript
import { requirePermission } from '@/compartido/lib/permisos'
import { redirect } from 'next/navigation'
import { ClienteForm } from '@/caracteristicas/clientes/componentes/ClienteForm'

export default async function NuevoClientePage() {
  try {
    await requirePermission('clientes.crear')
  } catch {
    redirect('/no-autorizado')
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Nuevo Cliente</h1>
      <ClienteForm />
    </div>
  )
}
```

---

#### 📍 PASO 9: Componente Formulario

**Archivo:** `src/caracteristicas/clientes/componentes/ClienteForm.tsx`

```typescript
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearCliente } from '../acciones'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { toast } from 'sonner'

export function ClienteForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    direccion: '',
    empresaId: 1, // TODO: Obtener de sesión
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      const result = await crearCliente(formData)

      if (result.success) {
        toast.success('Cliente creado exitosamente')
        router.push('/dashboard/clientes')
      } else {
        toast.error(result.error || 'Error al crear cliente')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input
          id="nombre"
          value={formData.nombre}
          onChange={e => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Juan Pérez"
          required
        />
      </div>

      <div>
        <Label htmlFor="rut">RUT *</Label>
        <Input
          id="rut"
          value={formData.rut}
          onChange={e => setFormData({ ...formData, rut: e.target.value })}
          placeholder="12.345.678-9"
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          placeholder="cliente@email.com"
        />
      </div>

      <div>
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          value={formData.telefono}
          onChange={e => setFormData({ ...formData, telefono: e.target.value })}
          placeholder="+56 9 1234 5678"
        />
      </div>

      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          value={formData.direccion}
          onChange={e => setFormData({ ...formData, direccion: e.target.value })}
          placeholder="Av. Principal 123"
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creando...' : 'Crear Cliente'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
```

---

#### 📍 PASO 10: Agregar Permisos a la BD

```sql
-- Ejecutar en Supabase SQL Editor
INSERT INTO permissions (codigo, nombre, descripcion, modulo)
VALUES
  ('clientes.ver', 'Ver Clientes', 'Permite ver clientes', 'clientes'),
  ('clientes.crear', 'Crear Clientes', 'Permite crear clientes', 'clientes'),
  ('clientes.editar', 'Editar Clientes', 'Permite editar clientes', 'clientes'),
  ('clientes.eliminar', 'Eliminar Clientes', 'Permite eliminar clientes', 'clientes');

-- Asignar al rol administrador
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.nombre = 'administrador'
  AND p.modulo = 'clientes';
```

---

#### 📍 PASO 11: Actualizar Sidebar

**Archivo:** `src/compartido/componentes/layout/sidebar.tsx`

```typescript
import { Users } from 'lucide-react' // Agregar icono

const menuItems = [
  // ... items existentes
  {
    label: 'Clientes',
    href: '/dashboard/clientes',
    icon: Users,
    roles: ['administrador', 'sucursal'],
  },
]
```

---

#### 📍 PASO 12: Agregar Tests

**Archivo:** `src/caracteristicas/clientes/__tests__/schemas.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { rutSchema, nombreSchema, createClienteSchema } from '../schemas'

describe('Clientes - Schemas', () => {
  describe('rutSchema', () => {
    it('debe validar RUT correcto', () => {
      expect(rutSchema.parse('12.345.678-9')).toBe('12.345.678-9')
    })

    it('debe rechazar RUT inválido', () => {
      expect(() => rutSchema.parse('12.345.678-0')).toThrow('RUT inválido')
    })
  })

  describe('createClienteSchema', () => {
    it('debe validar datos correctos', () => {
      const data = {
        nombre: 'Juan Pérez',
        rut: '12.345.678-9',
        email: 'juan@test.com',
        empresaId: 1,
      }

      const result = createClienteSchema.parse(data)
      expect(result.nombre).toBe('Juan Pérez')
    })
  })
})
```

---

## 🔒 Checklist de Seguridad (OBLIGATORIO)

Antes de entregar código, verifica:

- [ ] ✅ Validación con Zod en `schemas.ts`
- [ ] ✅ Permisos con `requirePermission()` en `acciones.ts`
- [ ] ✅ Auditoría con `registrarAuditoria()` en acciones críticas
- [ ] ✅ `revalidatePath()` después de mutaciones
- [ ] ✅ Manejo de errores con try/catch
- [ ] ✅ Respuestas con formato `{ success, error?, ...data }`
- [ ] ✅ Prevención XSS (regex en schemas)
- [ ] ✅ Prevención SQL Injection (usar Prisma, no raw queries)
- [ ] ✅ Types TypeScript correctos
- [ ] ✅ Tests escritos en `__tests__/`

---

## 📝 Convenciones de Código Limpio

### ✅ Nombres en Español
```typescript
// ✅ CORRECTO
obtenerClientes()
crearProducto()
registrarVenta()

const productos = []
const clienteActivo = true

// ❌ INCORRECTO
getClients()
createProduct()
const products = []
```

### ✅ Archivos con guiones
```
clientes-lista.tsx
productos-form.tsx
ventas-registro.tsx
```

### ✅ Componentes con PascalCase
```typescript
export function ClientesLista() {}
export function ProductoForm() {}
```

### ✅ Server Actions retornan siempre
```typescript
return { success: true, data }
return { success: false, error: 'mensaje' }
```

---

## 🎯 Resumen Visual

```
┌─────────────────────────────────────────────────────┐
│ 1. PRISMA SCHEMA → npm run prisma:generate          │
│ 2. REPOSITORY    → src/caracteristicas/[x]/repo.ts  │
│ 3. SCHEMAS       → src/caracteristicas/[x]/schemas  │
│ 4. ACCIONES      → src/caracteristicas/[x]/acciones │
│ 5. TIPOS         → src/caracteristicas/[x]/tipos    │
│ 6. COMPONENTES   → src/caracteristicas/[x]/comps/   │
│ 7. PÁGINAS       → src/app/dashboard/[x]/page.tsx   │
│ 8. PERMISOS      → SQL + requirePermission()        │
│ 9. SIDEBAR       → compartido/componentes/layout/   │
│ 10. TESTS        → __tests__/*.test.ts              │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Comandos Rápidos

```bash
# Base de datos
npm run prisma:generate      # Después de cambiar schema
npm run prisma:migrate       # Crear migración
npm run prisma:studio        # Ver datos

# Testing
npm run test:unit           # Tests unitarios
npm run test:security       # Tests de seguridad

# Dev
npm run dev                 # Servidor desarrollo
```

---

**🎯 Tu objetivo**: Código limpio, seguro y profesional que siga exactamente esta estructura.
