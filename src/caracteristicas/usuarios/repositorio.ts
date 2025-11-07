/**
 * Repositorio de Usuarios
 * Implementa Repository Pattern con validaciones de seguridad
 */

import 'server-only'
import { prisma } from '@/lib/prisma'
import { hash } from '@node-rs/argon2'
import type { CreateUsuarioInput, UpdateUsuarioInput } from './schemas'
import { injectable } from 'tsyringe'

@injectable()
export class UsuarioRepository {
  /**
   * Buscar usuario por email (usado en autenticación)
   */
  async findByEmail(email: string) {
    return await prisma.usuario.findUnique({
      where: { correo: email.toLowerCase().trim() },
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
        sucursalGerente: true,
      },
    })
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id: number) {
    return await prisma.usuario.findUnique({
      where: { id },
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
        sucursalGerente: true,
      },
    })
  }

  /**
   * Listar todos los usuarios (solo para admin)
   */
  async findAll({
    activo,
    rolId,
    limit = 50,
    offset = 0,
  }: {
    activo?: boolean
    rolId?: number
    limit?: number
    offset?: number
  } = {}) {
    return await prisma.usuario.findMany({
      where: {
        ...(activo !== undefined && { activo }),
        ...(rolId && { rolId }),
      },
      include: {
        rol: true,
        sucursalGerente: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })
  }

  /**
   * Crear nuevo usuario
   */
  async create(data: CreateUsuarioInput) {
    // Hash de contraseña con Argon2 (más seguro que bcrypt)
    const hashedPassword = await hash(data.password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    })

    return await prisma.usuario.create({
      data: {
        correo: data.correo.toLowerCase().trim(),
        nombre: data.nombre.trim(),
        contrasenaHash: hashedPassword,
        rolId: data.rolId,
        activo: data.activo ?? true,
        debeActualizarClave: data.debeActualizarClave ?? false,
        ...(data.sucursalId && {
          sucursalGerente: {
            connect: { id: data.sucursalId },
          },
        }),
      },
      include: {
        rol: true,
        sucursalGerente: true,
      },
    })
  }

  /**
   * Actualizar usuario existente
   */
  async update(id: number, data: UpdateUsuarioInput) {
    return await prisma.usuario.update({
      where: { id },
      data: {
        ...(data.correo && { correo: data.correo.toLowerCase().trim() }),
        ...(data.nombre && { nombre: data.nombre.trim() }),
        ...(data.rolId && { rolId: data.rolId }),
        ...(data.activo !== undefined && { activo: data.activo }),
        ...(data.debeActualizarClave !== undefined && { debeActualizarClave: data.debeActualizarClave }),
        ...(data.sucursalId !== undefined && {
          sucursalGerente: data.sucursalId
            ? { connect: { id: data.sucursalId } }
            : { disconnect: true },
        }),
      },
      include: {
        rol: true,
        sucursalGerente: true,
      },
    })
  }

  /**
   * Cambiar contraseña de usuario
   */
  async changePassword(id: number, newPassword: string) {
    const hashedPassword = await hash(newPassword, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    })

    return await prisma.usuario.update({
      where: { id },
      data: {
        contrasenaHash: hashedPassword,
        debeActualizarClave: false,
      },
    })
  }

  /**
   * Incrementar intentos fallidos de login
   */
  async incrementFailedAttempts(id: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { intentosFallidos: true },
    })

    const intentos = (usuario?.intentosFallidos ?? 0) + 1
    const bloqueadoHasta = intentos >= 5
      ? new Date(Date.now() + 15 * 60 * 1000) // Bloquear por 15 minutos
      : null

    return await prisma.usuario.update({
      where: { id },
      data: {
        intentosFallidos: intentos,
        ...(bloqueadoHasta && { bloqueadoHasta }),
      },
    })
  }

  /**
   * Resetear intentos fallidos (después de login exitoso)
   */
  async resetFailedAttempts(id: number) {
    return await prisma.usuario.update({
      where: { id },
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null,
        ultimoAcceso: new Date(),
      },
    })
  }

  /**
   * Verificar si usuario está bloqueado
   */
  async isBlocked(id: number): Promise<boolean> {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { bloqueadoHasta: true },
    })

    if (!usuario?.bloqueadoHasta) return false

    const now = new Date()
    if (now < usuario.bloqueadoHasta) {
      return true
    }

    // Desbloquear automáticamente si el tiempo expiró
    await prisma.usuario.update({
      where: { id },
      data: {
        bloqueadoHasta: null,
        intentosFallidos: 0,
      },
    })

    return false
  }

  /**
   * Desactivar usuario (soft delete)
   */
  async deactivate(id: number) {
    return await prisma.usuario.update({
      where: { id },
      data: { activo: false },
    })
  }

  /**
   * Activar usuario
   */
  async activate(id: number) {
    return await prisma.usuario.update({
      where: { id },
      data: { activo: true },
    })
  }

  /**
   * Contar usuarios
   */
  async count(where?: { activo?: boolean; rolId?: number }) {
    return await prisma.usuario.count({ where })
  }
}
