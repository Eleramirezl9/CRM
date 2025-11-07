/**
 * Tipos del Dominio de Usuarios
 * ✅ Separados de Prisma y validaciones Zod
 */

import type { Usuario as PrismaUsuario, Role, Sucursal } from '@prisma/client'

/**
 * Usuario básico (campos principales)
 */
export type Usuario = {
  id: number
  nombre: string
  correo: string
  rolId: number
  activo: boolean
  intentosFallidos: number
  bloqueadoHasta: Date | null
  ultimoAcceso: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Usuario con relaciones completas
 */
export type UsuarioConRelaciones = PrismaUsuario & {
  rol: Role
  sucursalGerente?: Sucursal | null
}

/**
 * Usuario para listas (datos mínimos)
 */
export type UsuarioListaItem = {
  id: number
  nombre: string
  correo: string
  activo: boolean
  rol: {
    id: number
    nombre: string
  }
  ultimoAcceso: Date | null
}

/**
 * Datos para formulario de usuario
 */
export type UsuarioFormData = {
  id?: number
  nombre: string
  correo: string
  rolId: number
  sucursalId?: string | null
  password?: string
}

/**
 * Resultado de operaciones de usuario
 */
export interface UsuarioActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}
