/**
 * Server Actions para gestión de roles y permisos
 * ✅ Protegidas con DAL y validación de permisos
 */

'use server'

import { requireRole, getCurrentUserId } from '@/compartido/lib/dal'
import { PERMISOS } from '@/compartido/lib/permisos'
import { registrarAuditoria } from '@/compartido/lib/auditoria'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Asignar permisos a un rol
 * Solo administrador
 */
export async function asignarPermisosRol(
  rolId: number,
  permisosIds: number[]
): Promise<ActionResult> {
  try {
    await requireRole(['administrador'])

    // Verificar que el rol existe
    const rol = await prisma.role.findUnique({
      where: { id: rolId },
    })

    if (!rol) {
      return { success: false, error: 'Rol no encontrado' }
    }

    // Eliminar permisos actuales y agregar los nuevos en una transacción
    await prisma.$transaction([
      // Eliminar permisos actuales
      prisma.rolePermission.deleteMany({
        where: { roleId: rolId },
      }),
      // Agregar nuevos permisos
      ...permisosIds.map(permisoId =>
        prisma.rolePermission.create({
          data: {
            roleId: rolId,
            permissionId: permisoId,
          },
        })
      ),
    ])

    // Auditoría
    const currentUserId = await getCurrentUserId()
    await registrarAuditoria({
      usuarioId: currentUserId,
      accion: 'UPDATE_ROLE_PERMISSIONS',
      entidad: 'Role',
      entidadId: String(rolId),
      detalles: {
        rol: rol.nombre,
        permisosCount: permisosIds.length,
      },
    })

    revalidatePath('/dashboard/roles')
    revalidatePath(`/dashboard/roles/${rolId}/permisos`)

    return { success: true }
  } catch (error) {
    console.error('Error al asignar permisos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al asignar permisos',
    }
  }
}

/**
 * Listar todos los roles con sus permisos
 */
export async function listarRoles(): Promise<ActionResult> {
  try {
    await requireRole(['administrador'])

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

    return { success: true, data: roles }
  } catch (error) {
    console.error('Error al listar roles:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al listar roles',
    }
  }
}
