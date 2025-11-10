/**
 * Servicio de Invalidación de Sesiones
 *
 * Este módulo gestiona la invalidación de sesiones de usuarios cuando
 * sus permisos son modificados, permitiendo que los cambios se reflejen
 * en menos de 5 segundos.
 *
 * Flujo:
 * 1. Admin modifica permisos de un usuario
 * 2. Se llama a invalidarSesionUsuario()
 * 3. Se marca en Redis que el usuario debe refrescar
 * 4. Cliente verifica cada 5s si debe refrescar
 * 5. Si debe refrescar, llama a update() de NextAuth
 * 6. JWT callback detecta invalidación y recarga permisos de BD
 *
 * @module invalidar-sesion
 */

import { redis, REDIS_KEYS, REDIS_TTL } from './redis'

/**
 * Marca la sesión de un usuario como invalidada
 *
 * Esto fuerza que el usuario recargue sus permisos en el siguiente
 * request. La marca expira automáticamente después de 5 minutos.
 *
 * @param usuarioId - ID del usuario cuya sesión debe invalidarse
 * @returns Promise que resuelve cuando la marca se guardó
 *
 * @example
 * ```typescript
 * // Después de cambiar permisos
 * await invalidarSesionUsuario(userId)
 * ```
 */
export async function invalidarSesionUsuario(
  usuarioId: number
): Promise<void> {
  const key = REDIS_KEYS.sessionInvalidation(usuarioId)

  // Guardar timestamp de invalidación con TTL de 5 minutos
  await redis.set(key, Date.now(), {
    ex: REDIS_TTL.SESSION_INVALIDATION,
  })
}

/**
 * Verifica si la sesión de un usuario fue invalidada
 *
 * @param usuarioId - ID del usuario a verificar
 * @returns Promise que resuelve a true si debe refrescar, false si no
 *
 * @example
 * ```typescript
 * const shouldRefresh = await verificarSesionInvalidada(userId)
 * if (shouldRefresh) {
 *   // Recargar permisos
 * }
 * ```
 */
export async function verificarSesionInvalidada(
  usuarioId: number
): Promise<boolean> {
  const key = REDIS_KEYS.sessionInvalidation(usuarioId)
  const timestamp = await redis.get<number>(key)

  return timestamp !== null
}

/**
 * Limpia la marca de invalidación de sesión
 *
 * Se llama después de que el usuario ha refrescado su sesión exitosamente.
 * Esto evita refrescamientos innecesarios.
 *
 * @param usuarioId - ID del usuario
 * @returns Promise que resuelve cuando la marca fue eliminada
 *
 * @example
 * ```typescript
 * // Después de refrescar permisos
 * await limpiarInvalidacion(userId)
 * ```
 */
export async function limpiarInvalidacion(usuarioId: number): Promise<void> {
  const key = REDIS_KEYS.sessionInvalidation(usuarioId)
  await redis.del(key)
}

/**
 * Obtiene el timestamp de invalidación de un usuario
 *
 * Útil para debugging y auditoría.
 *
 * @param usuarioId - ID del usuario
 * @returns Promise con el timestamp o null si no está invalidado
 */
export async function obtenerTimestampInvalidacion(
  usuarioId: number
): Promise<number | null> {
  const key = REDIS_KEYS.sessionInvalidation(usuarioId)
  return await redis.get<number>(key)
}

/**
 * Invalida las sesiones de múltiples usuarios
 *
 * Útil cuando se cambian permisos de un rol completo.
 *
 * @param usuarioIds - Array de IDs de usuarios
 * @returns Promise que resuelve cuando todas las sesiones fueron invalidadas
 *
 * @example
 * ```typescript
 * // Cuando se cambian permisos de un rol
 * const usuariosDelRol = await obtenerUsuariosPorRol(rolId)
 * await invalidarSesionesMultiples(usuariosDelRol.map(u => u.id))
 * ```
 */
export async function invalidarSesionesMultiples(
  usuarioIds: number[]
): Promise<void> {
  const promises = usuarioIds.map(id => invalidarSesionUsuario(id))
  await Promise.all(promises)
}
