/**
 * Data Access Layer (DAL)
 * Capa de seguridad para validar sesiones en Server Actions y API Routes
 * Previene CVE-2025-29927 (Bypass de Autenticación mediante Middleware)
 */

import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { getServerSession } from '@/caracteristicas/autenticacion/server'
import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'

/**
 * Verifica la sesión del usuario actual
 * ✅ USAR EN TODAS LAS SERVER ACTIONS Y API ROUTES
 */
export const verifySession = cache(async (): Promise<Session> => {
  const session = await getServerSession()

  if (!session || !session.user) {
    redirect('/iniciar-sesion')
  }

  // Verificar que el usuario esté activo (se validará en el repository)
  return session
})

/**
 * Obtiene la sesión actual sin redirección
 * Útil para casos donde necesitamos manejar manualmente la ausencia de sesión
 */
export const getCurrentSession = cache(async (): Promise<Session | null> => {
  const session = await getServerSession()
  return session
})

/**
 * Verifica si el usuario tiene un rol específico
 */
export async function requireRole(
  roles: Array<'administrador' | 'bodega' | 'sucursal' | 'produccion'>
): Promise<Session> {
  const session = await verifySession()

  if (!roles.includes(session.user.rol)) {
    throw new Error('No tienes permisos para realizar esta acción')
  }

  return session
}

/**
 * Verifica si el usuario tiene un permiso específico
 * (Se implementará después con el sistema de permisos granular)
 */
export async function requirePermission(permissionCode: string): Promise<Session> {
  const session = await verifySession()
  // TODO: Implementar verificación de permisos granulares
  return session
}

/**
 * Obtiene el ID del usuario actual
 */
export async function getCurrentUserId(): Promise<number> {
  const session = await verifySession()
  return parseInt(session.user.id)
}

/**
 * Obtiene el rol del usuario actual
 */
export async function getCurrentUserRole(): Promise<'administrador' | 'bodega' | 'sucursal' | 'produccion'> {
  const session = await verifySession()
  return session.user.rol
}

/**
 * Obtiene la sucursal del usuario actual (si aplica)
 */
export async function getCurrentUserSucursalId(): Promise<string | null> {
  const session = await verifySession()
  return session.user.sucursalId ?? null
}
