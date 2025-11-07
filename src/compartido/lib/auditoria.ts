/**
 * Servicio de Auditoría
 * Registra todas las acciones críticas del sistema
 */

import 'server-only'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'CHANGE_PASSWORD'
  | 'RESET_PASSWORD'
  | 'UPDATE_ROLE'
  | 'CREATE_VENTA'
  | 'UPDATE_VENTA'
  | 'DELETE_VENTA'
  | 'CREATE_ENVIO'
  | 'UPDATE_ENVIO'
  | 'CONFIRM_ENVIO'
  | 'UPDATE_INVENTARIO'
  | 'CREATE_PRODUCTO'
  | 'UPDATE_PRODUCTO'
  | 'DELETE_PRODUCTO'

interface AuditLogParams {
  usuarioId?: number | null
  accion: AuditAction
  entidad?: string
  entidadId?: string
  detalles?: Record<string, any>
  exitoso?: boolean
}

/**
 * Registra una acción en el log de auditoría
 */
export async function registrarAuditoria({
  usuarioId,
  accion,
  entidad,
  entidadId,
  detalles,
  exitoso = true,
}: AuditLogParams): Promise<void> {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await prisma.auditLog.create({
      data: {
        usuarioId: usuarioId ?? null,
        accion,
        entidad: entidad ?? null,
        entidadId: entidadId ?? null,
        detalles: detalles ?? null,
        ipAddress,
        userAgent,
        exitoso,
      },
    })
  } catch (error) {
    // No lanzar error para no bloquear la operación principal
    console.error('Error al registrar auditoría:', error)
  }
}

/**
 * Obtiene los logs de auditoría con filtros
 */
export async function obtenerLogsAuditoria({
  usuarioId,
  accion,
  entidad,
  desde,
  hasta,
  limit = 100,
  offset = 0,
}: {
  usuarioId?: number
  accion?: AuditAction
  entidad?: string
  desde?: Date
  hasta?: Date
  limit?: number
  offset?: number
}) {
  return await prisma.auditLog.findMany({
    where: {
      ...(usuarioId && { usuarioId }),
      ...(accion && { accion }),
      ...(entidad && { entidad }),
      ...(desde && { createdAt: { gte: desde } }),
      ...(hasta && { createdAt: { lte: hasta } }),
    },
    include: {
      usuario: {
        select: {
          id: true,
          nombre: true,
          correo: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  })
}
