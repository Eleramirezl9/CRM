/**
 * Repositorio de Roles y Permisos
 * Implementa Repository Pattern para gestión de roles
 */

import 'server-only'
import { prisma } from '@/lib/prisma'
import { injectable } from 'tsyringe'

@injectable()
export class RoleRepository {
  /**
   * Obtener todos los roles
   */
  async findAll() {
    return await prisma.role.findMany({
      include: {
        permisos: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { usuarios: true },
        },
      },
      orderBy: { nombre: 'asc' },
    })
  }

  /**
   * Buscar rol por ID
   */
  async findById(id: number) {
    return await prisma.role.findUnique({
      where: { id },
      include: {
        permisos: {
          include: {
            permission: true,
          },
        },
      },
    })
  }

  /**
   * Buscar rol por nombre
   */
  async findByName(nombre: string) {
    return await prisma.role.findUnique({
      where: { nombre },
      include: {
        permisos: {
          include: {
            permission: true,
          },
        },
      },
    })
  }

  /**
   * Verificar si un rol tiene un permiso específico
   */
  async hasPermission(rolId: number, permissionCode: string): Promise<boolean> {
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        roleId: rolId,
        permission: {
          codigo: permissionCode,
        },
      },
    })

    return rolePermission !== null
  }

  /**
   * Obtener todos los permisos de un rol
   */
  async getPermissions(rolId: number) {
    return await prisma.permission.findMany({
      where: {
        roles: {
          some: {
            roleId: rolId,
          },
        },
      },
    })
  }

  /**
   * Asignar permiso a rol
   */
  async assignPermission(rolId: number, permissionId: number) {
    return await prisma.rolePermission.create({
      data: {
        roleId: rolId,
        permissionId,
      },
    })
  }

  /**
   * Remover permiso de rol
   */
  async removePermission(rolId: number, permissionId: number) {
    return await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId: rolId,
          permissionId,
        },
      },
    })
  }
}

@injectable()
export class PermissionRepository {
  /**
   * Obtener todos los permisos
   */
  async findAll() {
    return await prisma.permission.findMany({
      orderBy: [{ modulo: 'asc' }, { nombre: 'asc' }],
    })
  }

  /**
   * Obtener permisos por módulo
   */
  async findByModule(modulo: string) {
    return await prisma.permission.findMany({
      where: { modulo },
      orderBy: { nombre: 'asc' },
    })
  }

  /**
   * Buscar permiso por código
   */
  async findByCode(codigo: string) {
    return await prisma.permission.findUnique({
      where: { codigo },
    })
  }

  /**
   * Crear nuevo permiso
   */
  async create(data: {
    codigo: string
    nombre: string
    descripcion?: string
    modulo: string
  }) {
    return await prisma.permission.create({
      data,
    })
  }
}
