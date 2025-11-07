# Sistema de Permisos Granular

## Introducción

El sistema implementa un modelo de permisos basado en **RBAC (Role-Based Access Control)** con permisos granulares a nivel de acción y módulo.

## Arquitectura del Sistema

### Modelo de Base de Datos

```prisma
model Role {
  id          Int              @id @default(autoincrement())
  nombre      String           @unique
  descripcion String?
  usuarios    Usuario[]
  permisos    RolePermission[]
}

model Permission {
  id          Int              @id @default(autoincrement())
  codigo      String           @unique // "usuarios.crear"
  nombre      String           // "Crear Usuarios"
  descripcion String?
  modulo      String           // "usuarios"
  roles       RolePermission[]
}

model RolePermission {
  roleId       Int
  permissionId Int
  role         Role       @relation(fields: [roleId])
  permission   Permission @relation(fields: [permissionId])

  @@id([roleId, permissionId])
}
```

## Permisos Definidos

### Módulo: Usuarios
| Código | Nombre | Descripción |
|--------|--------|-------------|
| `usuarios.ver` | Ver Usuarios | Permite ver la lista de usuarios |
| `usuarios.crear` | Crear Usuarios | Permite crear nuevos usuarios |
| `usuarios.editar` | Editar Usuarios | Permite editar usuarios existentes |
| `usuarios.eliminar` | Eliminar Usuarios | Permite eliminar usuarios |
| `usuarios.cambiar_rol` | Cambiar Rol | Permite cambiar el rol de un usuario |

### Módulo: Roles
| Código | Nombre | Descripción |
|--------|--------|-------------|
| `roles.ver` | Ver Roles | Permite ver roles y permisos |
| `roles.editar` | Editar Roles | Permite modificar permisos de roles |

### Módulo: Productos
| Código | Nombre | Descripción |
|--------|--------|-------------|
| `productos.ver` | Ver Productos | Permite ver el catálogo |
| `productos.crear` | Crear Productos | Permite crear productos |
| `productos.editar` | Editar Productos | Permite editar productos |
| `productos.eliminar` | Eliminar Productos | Permite eliminar productos |

### Módulo: Inventario
| Código | Nombre | Descripción |
|--------|--------|-------------|
| `inventario.ver` | Ver Inventario | Permite consultar stock |
| `inventario.editar` | Editar Inventario | Permite movimientos de inventario |
| `inventario.ajustar` | Ajustar Inventario | Permite ajustes manuales |

### Módulo: Ventas
| Código | Nombre | Descripción |
|--------|--------|-------------|
| `ventas.ver` | Ver Ventas | Permite ver historial de ventas |
| `ventas.crear` | Crear Ventas | Permite registrar ventas |
| `ventas.editar` | Editar Ventas | Permite modificar ventas |
| `ventas.eliminar` | Eliminar Ventas | Permite anular ventas |

### Módulo: Envíos
| Código | Nombre | Descripción |
|--------|--------|-------------|
| `envios.ver` | Ver Envíos | Permite ver envíos |
| `envios.crear` | Crear Envíos | Permite crear envíos |
| `envios.editar` | Editar Envíos | Permite modificar envíos |
| `envios.confirmar` | Confirmar Envíos | Permite confirmar recepción |

### Módulo: Producción
| Código | Nombre | Descripción |
|--------|--------|-------------|
| `produccion.ver` | Ver Producción | Permite ver producción diaria |
| `produccion.crear` | Crear Producción | Permite registrar producción |
| `produccion.editar` | Editar Producción | Permite modificar registros |

### Módulo: Sucursales
| Código | Nombre | Descripción |
|--------|--------|-------------|
| `sucursales.ver` | Ver Sucursales | Permite ver sucursales |
| `sucursales.crear` | Crear Sucursales | Permite crear sucursales |
| `sucursales.editar` | Editar Sucursales | Permite editar sucursales |
| `sucursales.eliminar` | Eliminar Sucursales | Permite eliminar sucursales |

### Módulo: Reportes
| Código | Nombre | Descripción |
|--------|--------|-------------|
| `reportes.ver` | Ver Reportes | Permite acceder a reportes |
| `reportes.exportar` | Exportar Reportes | Permite exportar datos |

### Módulo: Auditoría
| Código | Nombre | Descripción |
|--------|--------|-------------|
| `auditoria.ver` | Ver Auditoría | Permite ver logs de auditoría |

## Asignación de Permisos por Rol

### Administrador
✅ **Todos los permisos** del sistema

```typescript
// Se otorgan automáticamente todos los permisos
if (rol === 'administrador') {
  return true // Acceso total
}
```

### Bodega
Permisos enfocados en gestión de inventario y envíos:

| Módulo | Permisos |
|--------|----------|
| Inventario | `ver`, `editar`, `ajustar` |
| Envíos | `ver`, `crear`, `editar`, `confirmar` |
| Productos | `ver` (solo lectura) |

```typescript
const permisosBodega = [
  'inventario.ver',
  'inventario.editar',
  'inventario.ajustar',
  'envios.ver',
  'envios.crear',
  'envios.editar',
  'envios.confirmar',
  'productos.ver',
]
```

### Sucursal
Permisos enfocados en ventas:

| Módulo | Permisos |
|--------|----------|
| Ventas | `ver`, `crear`, `editar`, `eliminar` |
| Inventario | `ver` (solo lectura) |

```typescript
const permisosSucursal = [
  'ventas.ver',
  'ventas.crear',
  'ventas.editar',
  'ventas.eliminar',
  'inventario.ver',
]
```

### Producción
Permisos enfocados en producción:

| Módulo | Permisos |
|--------|----------|
| Producción | `ver`, `crear`, `editar` |
| Inventario | `ver` (solo lectura) |

```typescript
const permisosProduccion = [
  'produccion.ver',
  'produccion.crear',
  'produccion.editar',
  'inventario.ver',
]
```

## Implementación

### 1. Repository de Roles

```typescript
// src/caracteristicas/roles/repositorio.ts
@injectable()
export class RoleRepository {
  /**
   * Obtiene todos los permisos de un rol
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        rol: {
          include: {
            permisos: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    if (!usuario) return []

    return usuario.rol.permisos.map(rp => rp.permission.codigo)
  }

  /**
   * Verifica si un rol tiene un permiso específico
   */
  async hasPermission(roleName: string, permissionCode: string): Promise<boolean> {
    const role = await prisma.role.findUnique({
      where: { nombre: roleName },
      include: {
        permisos: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!role) return false

    return role.permisos.some(rp => rp.permission.codigo === permissionCode)
  }

  /**
   * Obtiene permisos agrupados por módulo
   */
  async getPermissionsByModule() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ modulo: 'asc' }, { codigo: 'asc' }],
    })

    // Agrupar por módulo
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.modulo]) {
        acc[perm.modulo] = []
      }
      acc[perm.modulo].push(perm)
      return acc
    }, {} as Record<string, Permission[]>)
  }
}
```

### 2. Sistema de Validación

```typescript
// src/compartido/lib/permisos.ts
import { verifySession, getCurrentUserId } from './dal'
import { RoleRepository } from '@/caracteristicas/roles/repositorio'

const roleRepo = new RoleRepository()

/**
 * Verifica si el usuario actual tiene un permiso
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const session = await verifySession()

  // Administrador tiene todos los permisos
  if (session.user.roleName === 'administrador') {
    return true
  }

  return roleRepo.hasPermission(session.user.roleName, permission)
}

/**
 * Requiere que el usuario tenga un permiso (lanza error si no)
 */
export async function requirePermission(permission: string) {
  const has = await hasPermission(permission)

  if (!has) {
    throw new Error(`Permiso requerido: ${permission}`)
  }

  return true
}

/**
 * Verifica múltiples permisos (requiere todos)
 */
export async function requireAllPermissions(permissions: string[]) {
  for (const permission of permissions) {
    await requirePermission(permission)
  }
}

/**
 * Verifica múltiples permisos (requiere al menos uno)
 */
export async function requireAnyPermission(permissions: string[]) {
  for (const permission of permissions) {
    if (await hasPermission(permission)) {
      return true
    }
  }

  throw new Error(`Se requiere al menos uno de estos permisos: ${permissions.join(', ')}`)
}
```

### 3. Uso en Server Actions

```typescript
// src/caracteristicas/usuarios/acciones.ts
'use server'

import { requirePermission } from '@/compartido/lib/permisos'
import { registrarAuditoria } from '@/compartido/lib/auditoria'

export async function crearUsuario(data: CreateUsuarioInput) {
  try {
    // ✅ Validar permiso
    await requirePermission('usuarios.crear')

    const userId = await getCurrentUserId()
    const repository = new UsuarioRepository()

    // Crear usuario
    const usuario = await repository.create(data)

    // Auditoría
    await registrarAuditoria({
      usuarioId: userId,
      accion: 'CREATE_USER',
      entidad: 'Usuario',
      entidadId: String(usuario.id),
      exitoso: true,
    })

    return { success: true, usuario }
  } catch (error) {
    return { success: false, error: 'Error al crear usuario' }
  }
}

export async function editarUsuario(id: number, data: UpdateUsuarioInput) {
  // ✅ Validar permiso
  await requirePermission('usuarios.editar')

  // Lógica...
}

export async function eliminarUsuario(id: number) {
  // ✅ Validar permiso
  await requirePermission('usuarios.eliminar')

  // Lógica...
}
```

### 4. Uso en API Routes

```typescript
// src/app/api/usuarios/route.ts
import { NextRequest } from 'next/server'
import { requirePermission } from '@/compartido/lib/permisos'

export async function GET(request: NextRequest) {
  try {
    await requirePermission('usuarios.ver')

    const usuarios = await prisma.usuario.findMany()

    return Response.json({ success: true, usuarios })
  } catch (error) {
    return Response.json(
      { success: false, error: 'No autorizado' },
      { status: 403 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('usuarios.crear')

    const data = await request.json()
    // Lógica...

    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      { success: false, error: 'No autorizado' },
      { status: 403 }
    )
  }
}
```

### 5. Uso en Page Components

```typescript
// src/app/(principal)/dashboard/usuarios/page.tsx
import { requirePermission } from '@/compartido/lib/permisos'
import { redirect } from 'next/navigation'

export default async function UsuariosPage() {
  try {
    // ✅ Validar permiso en el servidor
    await requirePermission('usuarios.ver')
  } catch {
    redirect('/no-autorizado')
  }

  return (
    <div>
      <h1>Gestión de Usuarios</h1>
      <UsuariosLista />
    </div>
  )
}
```

### 6. Componentes Condicionales

```typescript
// Componente que muestra/oculta según permisos
'use client'

import { usePermission } from '@/compartido/hooks/usePermission'

export function AccionesUsuario({ usuario }: Props) {
  const puedeEditar = usePermission('usuarios.editar')
  const puedeEliminar = usePermission('usuarios.eliminar')

  return (
    <div>
      {puedeEditar && (
        <Button onClick={() => editarUsuario(usuario.id)}>
          Editar
        </Button>
      )}

      {puedeEliminar && (
        <Button onClick={() => eliminarUsuario(usuario.id)} variant="destructive">
          Eliminar
        </Button>
      )}
    </div>
  )
}
```

```typescript
// src/compartido/hooks/usePermission.ts
'use client'

import { useSession } from 'next-auth/react'

export function usePermission(permission: string): boolean {
  const { data: session } = useSession()

  if (!session?.user) return false

  // Administrador tiene todos los permisos
  if (session.user.roleName === 'administrador') return true

  // Verificar en permisos del usuario (del token)
  const permissions = (session.user as any).permissions || []
  return permissions.includes(permission)
}
```

## Gestión de Permisos

### Agregar Nuevo Permiso

1. **Crear el permiso en la base de datos**:

```sql
INSERT INTO permissions (codigo, nombre, descripcion, modulo)
VALUES ('reportes.avanzados', 'Ver Reportes Avanzados', 'Acceso a reportes con métricas detalladas', 'reportes');
```

2. **Asignar a roles**:

```sql
-- Asignar al rol administrador
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.nombre = 'administrador'
  AND p.codigo = 'reportes.avanzados';
```

3. **Usar en código**:

```typescript
export async function generarReporteAvanzado() {
  await requirePermission('reportes.avanzados')

  // Lógica...
}
```

### Modificar Permisos de un Rol

```typescript
// src/caracteristicas/roles/acciones.ts
export async function asignarPermisos(
  rolId: number,
  permissionIds: number[]
) {
  await requirePermission('roles.editar')

  // Eliminar permisos actuales
  await prisma.rolePermission.deleteMany({
    where: { roleId: rolId },
  })

  // Crear nuevos permisos
  await prisma.rolePermission.createMany({
    data: permissionIds.map(permissionId => ({
      roleId,
      permissionId,
    })),
  })

  await registrarAuditoria({
    accion: 'UPDATE_ROLE_PERMISSIONS',
    entidad: 'Role',
    entidadId: String(rolId),
    detalles: { permissionIds },
  })
}
```

## Interfaz de Gestión de Permisos

### Página de Configuración de Roles

```typescript
// src/app/(principal)/dashboard/roles/[id]/page.tsx
export default async function EditarRolPage({ params }: { params: { id: string } }) {
  await requirePermission('roles.editar')

  const [rol, permisosPorModulo] = await Promise.all([
    prisma.role.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        permisos: {
          include: { permission: true },
        },
      },
    }),
    roleRepo.getPermissionsByModule(),
  ])

  const permisosActuales = rol?.permisos.map(rp => rp.permission.id) || []

  return (
    <div>
      <h1>Editar Permisos: {rol?.nombre}</h1>

      <FormularioPermisos
        rol={rol}
        permisosPorModulo={permisosPorModulo}
        permisosActuales={permisosActuales}
      />
    </div>
  )
}
```

### Componente de Formulario

```typescript
'use client'

export function FormularioPermisos({
  permisosPorModulo,
  permisosActuales,
}: Props) {
  const [selected, setSelected] = useState<number[]>(permisosActuales)

  const handleToggle = (permissionId: number) => {
    setSelected(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  return (
    <form>
      {Object.entries(permisosPorModulo).map(([modulo, permisos]) => (
        <div key={modulo}>
          <h3>{modulo}</h3>
          {permisos.map(permiso => (
            <label key={permiso.id}>
              <input
                type="checkbox"
                checked={selected.includes(permiso.id)}
                onChange={() => handleToggle(permiso.id)}
              />
              {permiso.nombre}
              <span className="text-muted">{permiso.descripcion}</span>
            </label>
          ))}
        </div>
      ))}

      <Button type="submit">Guardar Cambios</Button>
    </form>
  )
}
```

## Mejores Prácticas

### 1. Validar en Múltiples Capas

```typescript
// ✅ Validar en:
// 1. Middleware (rutas)
// 2. Page Component (UI)
// 3. Server Action (lógica)
// 4. API Route (endpoints)
```

### 2. Permisos Granulares

```typescript
// ✅ Bueno: Permisos específicos
await requirePermission('ventas.crear')
await requirePermission('ventas.editar')

// ❌ Malo: Permisos muy amplios
await requirePermission('ventas')
```

### 3. Auditar Cambios de Permisos

```typescript
await registrarAuditoria({
  accion: 'UPDATE_ROLE_PERMISSIONS',
  entidad: 'Role',
  entidadId: String(rolId),
  detalles: {
    permisosAnteriores: oldPermissions,
    permisosNuevos: newPermissions,
  },
})
```

### 4. Cache de Permisos

```typescript
// Cache en el token JWT
const token = {
  ...user,
  permissions: await roleRepo.getUserPermissions(user.id),
}
```

### 5. Mensajes de Error Claros

```typescript
if (!await hasPermission('usuarios.crear')) {
  throw new Error(
    'No tienes permiso para crear usuarios. Contacta al administrador.'
  )
}
```

## Testing

### Test de Permisos

```typescript
describe('Sistema de Permisos', () => {
  it('administrador debe tener todos los permisos', async () => {
    const has = await hasPermission('cualquier.permiso')
    expect(has).toBe(true)
  })

  it('bodega debe poder ver inventario', async () => {
    const has = await hasPermission('inventario.ver')
    expect(has).toBe(true)
  })

  it('bodega NO debe poder crear usuarios', async () => {
    const has = await hasPermission('usuarios.crear')
    expect(has).toBe(false)
  })
})
```

## Roadmap

### Futuras Mejoras

1. **Permisos Contextuales**
   - Permisos basados en datos específicos
   - Ejemplo: "Editar solo ventas de mi sucursal"

2. **Permisos Temporales**
   - Permisos con fecha de expiración
   - Útil para accesos temporales

3. **Herencia de Permisos**
   - Roles que heredan de otros roles
   - Ejemplo: "SuperAdmin" hereda de "Admin"

4. **Permisos Dinámicos**
   - Permisos calculados en tiempo de ejecución
   - Basados en reglas complejas

---

**Última actualización**: 2025-11-06
