/**
 * Tests Unitarios para UsuarioRepository
 * ✅ Prueba creación de usuarios
 * ✅ Prueba validaciones
 * ✅ Prueba bloqueos por intentos fallidos
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UsuarioRepository } from '../repositorio'

// Mock de Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    usuario: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findByEmail: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

// Mock de Argon2
vi.mock('@node-rs/argon2', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  verify: vi.fn().mockResolvedValue(true),
}))

describe('UsuarioRepository', () => {
  let repository: UsuarioRepository

  beforeEach(() => {
    repository = new UsuarioRepository()
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('debe crear un usuario con contraseña hasheada', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockPrismaCreate = prisma.usuario.create as any

      mockPrismaCreate.mockResolvedValueOnce({
        id: 1,
        nombre: 'Test User',
        correo: 'test@example.com',
        rolId: 1,
        activo: true,
      })

      const usuario = await repository.create({
        nombre: 'Test User',
        correo: 'test@example.com',
        password: 'SecurePassword123!',
        rolId: 1,
      })

      expect(usuario).toBeDefined()
      expect(usuario.nombre).toBe('Test User')
      expect(mockPrismaCreate).toHaveBeenCalled()
    })

    it('debe validar el formato de email', async () => {
      await expect(
        repository.create({
          nombre: 'Test User',
          correo: 'invalid-email',
          password: 'SecurePassword123!',
          rolId: 1,
        })
      ).rejects.toThrow()
    })

    it('debe validar la complejidad de la contraseña', async () => {
      await expect(
        repository.create({
          nombre: 'Test User',
          correo: 'test@example.com',
          password: 'weak',
          rolId: 1,
        })
      ).rejects.toThrow()
    })
  })

  describe('findByEmail', () => {
    it('debe encontrar un usuario por email', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockPrismaFindUnique = prisma.usuario.findUnique as any

      mockPrismaFindUnique.mockResolvedValueOnce({
        id: 1,
        correo: 'test@example.com',
        nombre: 'Test User',
        activo: true,
      })

      const usuario = await repository.findByEmail('test@example.com')
      expect(usuario).toBeDefined()
      expect(usuario?.correo).toBe('test@example.com')
    })

    it('debe normalizar el email (lowercase)', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockPrismaFindUnique = prisma.usuario.findUnique as any

      await repository.findByEmail('TEST@EXAMPLE.COM')

      expect(mockPrismaFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { correo: 'test@example.com' },
        })
      )
    })
  })

  describe('incrementFailedAttempts', () => {
    it('debe incrementar intentos fallidos', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockPrismaFindUnique = prisma.usuario.findUnique as any
      const mockPrismaUpdate = prisma.usuario.update as any

      mockPrismaFindUnique.mockResolvedValueOnce({
        id: 1,
        intentosFallidos: 0,
      })

      await repository.incrementFailedAttempts(1)

      expect(mockPrismaUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            intentosFallidos: 1,
          }),
        })
      )
    })

    it('debe bloquear usuario después de 5 intentos', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockPrismaFindUnique = prisma.usuario.findUnique as any
      const mockPrismaUpdate = prisma.usuario.update as any

      mockPrismaFindUnique.mockResolvedValueOnce({
        id: 1,
        intentosFallidos: 4,
      })

      await repository.incrementFailedAttempts(1)

      expect(mockPrismaUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            intentosFallidos: 5,
            bloqueadoHasta: expect.any(Date),
          }),
        })
      )
    })
  })

  describe('isBlocked', () => {
    it('debe retornar true si el usuario está bloqueado', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockPrismaFindUnique = prisma.usuario.findUnique as any

      const futureDate = new Date()
      futureDate.setMinutes(futureDate.getMinutes() + 10)

      mockPrismaFindUnique.mockResolvedValueOnce({
        id: 1,
        bloqueadoHasta: futureDate,
      })

      const isBlocked = await repository.isBlocked(1)
      expect(isBlocked).toBe(true)
    })

    it('debe retornar false si el bloqueo expiró', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockPrismaFindUnique = prisma.usuario.findUnique as any

      const pastDate = new Date()
      pastDate.setMinutes(pastDate.getMinutes() - 10)

      mockPrismaFindUnique.mockResolvedValueOnce({
        id: 1,
        bloqueadoHasta: pastDate,
      })

      const isBlocked = await repository.isBlocked(1)
      expect(isBlocked).toBe(false)
    })
  })
})
