/**
 * Página de Edición de Usuario
 * ✅ Solo accesible para administradores
 */

import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { FormularioUsuario } from '@/caracteristicas/usuarios/componentes/FormularioUsuario'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function EditarUsuarioPage({
  params
}: {
  params: { id: string }
}) {
  const tienePermiso = await verificarPermiso(PERMISOS.USUARIOS_EDITAR)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const usuarioId = parseInt(params.id)

  if (isNaN(usuarioId)) {
    notFound()
  }

  // Cargar usuario, roles y sucursales
  const [usuario, roles, sucursales] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        rol: true,
        sucursalGerente: {
          select: { id: true, nombre: true },
        },
      },
    }),
    prisma.role.findMany({
      orderBy: { nombre: 'asc' },
    }),
    prisma.sucursal.findMany({
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    }),
  ])

  if (!usuario) {
    notFound()
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Usuario</h1>
        <p className="text-muted-foreground mt-1">
          Actualiza la información de {usuario.nombre}
        </p>
      </div>

      <FormularioUsuario
        roles={roles}
        sucursales={sucursales}
        usuario={{
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rolId: usuario.rolId,
          sucursalId: usuario.sucursalGerente?.id || null,
        }}
      />
    </div>
  )
}
