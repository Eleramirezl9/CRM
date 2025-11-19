/**
 * Página de Gestión de Roles
 * ✅ Solo accesible para administradores
 */

import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { PageTitle } from '@/compartido/componentes/PageTitle'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/compartido/componentes/ui/button'
import { Shield, Settings } from 'lucide-react'

export default async function RolesPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.USUARIOS_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const roles = await prisma.role.findMany({
    include: {
      permisos: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: {
          usuarios: true,
        },
      },
    },
    orderBy: { nombre: 'asc' },
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <PageTitle title="Gestión de Roles" icon="roles" />
        <p className="text-muted-foreground mt-1">Administra los roles y sus permisos asignados</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((rol) => (
          <div key={rol.id} className="bg-white p-6 rounded-lg border space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold capitalize">{rol.nombre}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {rol.descripcion}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Usuarios con este rol:</span>
                <span className="font-semibold">{rol._count.usuarios}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Permisos asignados:</span>
                <span className="font-semibold">{rol.permisos.length}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Link href={`/dashboard/roles/${rol.id}/permisos`}>
                <Button variant="outline" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Gestionar Permisos
                </Button>
              </Link>
            </div>

            {rol.permisos.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Ver permisos ({rol.permisos.length})
                </summary>
                <ul className="mt-2 space-y-1 ml-4 list-disc text-muted-foreground">
                  {rol.permisos.slice(0, 10).map((rp) => (
                    <li key={rp.permissionId}>{rp.permission.nombre}</li>
                  ))}
                  {rol.permisos.length > 10 && (
                    <li className="italic">... y {rol.permisos.length - 10} más</li>
                  )}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
