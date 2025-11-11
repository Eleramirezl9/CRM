/**
 * Página de Gestión de Permisos de Usuario
 * Permite al administrador asignar permisos individuales a un usuario
 */

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/compartido/lib/dal'
import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { GestionarPermisosUsuario } from '@/caracteristicas/usuarios/componentes/GestionarPermisosUsuario'

interface PageProps {
  params: {
    id: string
  }
}

export default async function PermisosUsuarioPage({ params }: PageProps) {
  // Validar que el usuario actual tenga permisos
  await requireRole(['administrador'])

  const tienePermiso = await verificarPermiso(PERMISOS.USUARIOS_EDITAR)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const usuarioId = parseInt(params.id)

  if (isNaN(usuarioId)) {
    notFound()
  }

  // Obtener usuario con su rol y permisos
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
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
      permisosIndividuales: {
        include: {
          permission: true,
        },
      },
    },
  })

  if (!usuario) {
    notFound()
  }

  // Obtener todos los permisos disponibles
  const todosPermisos = await prisma.permission.findMany({
    orderBy: [{ modulo: 'asc' }, { nombre: 'asc' }],
  })

  // Obtener IDs de permisos del rol
  const permisosRol = usuario.rol.permisos.map((rp) => rp.permission.id)

  // Obtener IDs de permisos individuales del usuario
  const permisosUsuario = usuario.permisosIndividuales.map((up) => up.permission.id)

  return (
    <div className="container mx-auto py-6">
      <GestionarPermisosUsuario
        usuario={{
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: {
            id: usuario.rol.id,
            nombre: usuario.rol.nombre,
          },
        }}
        todosPermisos={todosPermisos}
        permisosRol={permisosRol}
        permisosUsuario={permisosUsuario}
      />
    </div>
  )
}
