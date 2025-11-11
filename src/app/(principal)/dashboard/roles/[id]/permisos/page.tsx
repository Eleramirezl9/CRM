/**
 * Página de Gestión de Permisos por Rol
 * ✅ Solo accesible para administradores
 */

import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { GestionPermisos } from '@/caracteristicas/roles/componentes/GestionPermisos'

export default async function PermisosRolPage({
  params
}: {
  params: { id: string }
}) {
  const tienePermiso = await verificarPermiso(PERMISOS.USUARIOS_EDITAR)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const rolId = parseInt(params.id)

  if (isNaN(rolId)) {
    notFound()
  }

  // Cargar rol con sus permisos actuales
  const [rol, todosLosPermisos] = await Promise.all([
    prisma.role.findUnique({
      where: { id: rolId },
      include: {
        permisos: {
          include: {
            permission: true,
          },
        },
      },
    }),
    prisma.permission.findMany({
      orderBy: [
        { modulo: 'asc' },
        { nombre: 'asc' },
      ],
    }),
  ])

  if (!rol) {
    notFound()
  }

  // Extraer IDs de permisos actuales
  const permisosActuales = rol.permisos.map(p => p.permissionId)

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Permisos</h1>
        <p className="text-muted-foreground mt-1">
          Asigna permisos al rol: <span className="font-semibold">{rol.nombre}</span>
        </p>
      </div>

      <GestionPermisos
        rolId={rol.id}
        permisos={todosLosPermisos}
        permisosActuales={permisosActuales}
      />
    </div>
  )
}
