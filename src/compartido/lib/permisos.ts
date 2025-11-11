/**
 * Sistema de Permisos Granular
 * Verifica permisos específicos más allá de roles
 */

import 'server-only'
import { verifySession } from './dal'
import { RoleRepository } from '@/caracteristicas/roles/repositorio'
import { redirect } from 'next/navigation'
import { registrarAuditoria } from './auditoria'

const roleRepo = new RoleRepository()

/**
 * Códigos de permisos del sistema
 */
export const PERMISOS = {
  // Usuarios
  USUARIOS_VER: 'usuarios.ver',
  USUARIOS_CREAR: 'usuarios.crear',
  USUARIOS_EDITAR: 'usuarios.editar',
  USUARIOS_ELIMINAR: 'usuarios.eliminar',
  USUARIOS_CAMBIAR_ROL: 'usuarios.cambiar_rol',

  // Roles
  ROLES_VER: 'roles.ver',
  ROLES_EDITAR: 'roles.editar',

  // Productos
  PRODUCTOS_VER: 'productos.ver',
  PRODUCTOS_CREAR: 'productos.crear',
  PRODUCTOS_EDITAR: 'productos.editar',
  PRODUCTOS_ELIMINAR: 'productos.eliminar',

  // Inventario
  INVENTARIO_VER: 'inventario.ver',
  INVENTARIO_EDITAR: 'inventario.editar',
  INVENTARIO_AJUSTAR: 'inventario.ajustar',

  // Ventas
  VENTAS_VER: 'ventas.ver',
  VENTAS_CREAR: 'ventas.crear',
  VENTAS_EDITAR: 'ventas.editar',
  VENTAS_ELIMINAR: 'ventas.eliminar',

  // Envíos
  ENVIOS_VER: 'envios.ver',
  ENVIOS_CREAR: 'envios.crear',
  ENVIOS_EDITAR: 'envios.editar',
  ENVIOS_CONFIRMAR: 'envios.confirmar',

  // Producción
  PRODUCCION_VER: 'produccion.ver',
  PRODUCCION_CREAR: 'produccion.crear',
  PRODUCCION_EDITAR: 'produccion.editar',

  // Sucursales
  SUCURSALES_VER: 'sucursales.ver',
  SUCURSALES_CREAR: 'sucursales.crear',
  SUCURSALES_EDITAR: 'sucursales.editar',
  SUCURSALES_ELIMINAR: 'sucursales.eliminar',

  // Reportes
  REPORTES_VER: 'reportes.ver',
  REPORTES_EXPORTAR: 'reportes.exportar',

  // Auditoría
  AUDITORIA_VER: 'auditoria.ver',
} as const

export type PermisoCode = typeof PERMISOS[keyof typeof PERMISOS]

/**
 * Verifica si el usuario actual tiene un permiso específico
 */
export async function tienePermiso(permissionCode: PermisoCode): Promise<boolean> {
  const session = await verifySession()

  // Administrador tiene todos los permisos
  if (session.user.rol === 'administrador') {
    return true
  }

  // ✅ NUEVO: Verificar en los permisos del token (rol + individuales)
  if (session.user.permisos && session.user.permisos.length > 0) {
    return session.user.permisos.includes(permissionCode)
  }

  // Fallback: Buscar en la base de datos si no hay permisos en el token
  const userId = parseInt(session.user.id)
  const rolId = await getRolIdByUserId(userId)
  if (!rolId) return false

  return await roleRepo.hasPermission(rolId, permissionCode)
}

/**
 * Requiere un permiso específico (usa en PÁGINAS)
 * Redirige a /no-autorizado si no tiene el permiso
 */
export async function requirePermiso(permissionCode: PermisoCode): Promise<void> {
  const hasPermission = await tienePermiso(permissionCode)

  if (!hasPermission) {
    const session = await verifySession()

    // Registrar intento de acceso no autorizado
    try {
      await registrarAuditoria({
        usuarioId: parseInt(session.user.id),
        accion: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        entidad: 'Permission',
        entidadId: permissionCode,
        exitoso: false,
        detalles: {
          permiso: permissionCode,
          rol: session.user.rol,
          permisos: session.user.permisos || []
        }
      })
    } catch (error) {
      console.error('Error al registrar auditoría:', error)
    }

    // Redirigir a página de no autorizado
    redirect('/no-autorizado')
  }
}

/**
 * Verifica si el usuario tiene un permiso (usa en SERVER ACTIONS)
 * Retorna un objeto con success/error en lugar de redirigir
 */
export async function checkPermiso(permissionCode: PermisoCode): Promise<{
  authorized: boolean
  error?: string
}> {
  try {
    const hasPermission = await tienePermiso(permissionCode)

    if (!hasPermission) {
      const session = await verifySession()

      // Registrar intento de acceso no autorizado
      try {
        await registrarAuditoria({
          usuarioId: parseInt(session.user.id),
          accion: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          entidad: 'Permission',
          entidadId: permissionCode,
          exitoso: false,
          detalles: {
            permiso: permissionCode,
            rol: session.user.rol,
            permisos: session.user.permisos || []
          }
        })
      } catch (error) {
        console.error('Error al registrar auditoría:', error)
      }

      return {
        authorized: false,
        error: `No tienes el permiso necesario: ${permissionCode}`
      }
    }

    return { authorized: true }
  } catch (error) {
    return {
      authorized: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Helper para obtener el rolId del usuario
 */
async function getRolIdByUserId(userId: number): Promise<number | null> {
  const { prisma } = await import('@/lib/prisma')
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { rolId: true },
  })
  return usuario?.rolId ?? null
}

/**
 * Obtiene todos los permisos del usuario actual
 */
export async function getPermisosUsuario(): Promise<string[]> {
  const session = await verifySession()
  const userId = parseInt(session.user.id)

  // Administrador tiene todos los permisos
  if (session.user.rol === 'administrador') {
    return Object.values(PERMISOS)
  }

  const rolId = await getRolIdByUserId(userId)
  if (!rolId) return []

  const permisos = await roleRepo.getPermissions(rolId)
  return permisos.map((p) => p.codigo)
}
