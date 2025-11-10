/**
 * Tests Unitarios: Servicio de Invalidación de Sesiones
 *
 * Verifica el correcto funcionamiento del sistema de invalidación
 * de sesiones mediante Redis.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  invalidarSesionUsuario,
  verificarSesionInvalidada,
  limpiarInvalidacion,
  obtenerTimestampInvalidacion,
  invalidarSesionesMultiples,
} from '../invalidar-sesion'

// Mock de Redis
vi.mock('../redis', () => {
  const store = new Map<string, { value: any; expiry: number }>()

  return {
    redis: {
      set: vi.fn(async (key: string, value: any, options?: { ex: number }) => {
        const expiry = options?.ex ? Date.now() + options.ex * 1000 : Infinity
        store.set(key, { value, expiry })
        return 'OK'
      }),
      get: vi.fn(async (key: string) => {
        const item = store.get(key)
        if (!item) return null
        if (item.expiry < Date.now()) {
          store.delete(key)
          return null
        }
        return item.value
      }),
      del: vi.fn(async (key: string) => {
        store.delete(key)
        return 1
      }),
    },
    REDIS_KEYS: {
      sessionInvalidation: (usuarioId: number) => `invalidate-session:${usuarioId}`,
    },
    REDIS_TTL: {
      SESSION_INVALIDATION: 300,
    },
  }
})

describe('Sistema de Invalidación de Sesiones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('invalidarSesionUsuario', () => {
    it('debe marcar la sesión de un usuario como invalidada', async () => {
      const usuarioId = 123

      await invalidarSesionUsuario(usuarioId)

      // Verificar que se llamó a redis.set con los parámetros correctos
      const { redis } = await import('../redis')
      expect(redis.set).toHaveBeenCalledWith(
        'invalidate-session:123',
        expect.any(Number),
        { ex: 300 }
      )
    })

    it('debe guardar el timestamp actual al invalidar', async () => {
      const usuarioId = 456
      const beforeTimestamp = Date.now()

      await invalidarSesionUsuario(usuarioId)

      const timestamp = await obtenerTimestampInvalidacion(usuarioId)

      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(timestamp).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('verificarSesionInvalidada', () => {
    it('debe retornar true si la sesión fue invalidada', async () => {
      const usuarioId = 789

      await invalidarSesionUsuario(usuarioId)
      const result = await verificarSesionInvalidada(usuarioId)

      expect(result).toBe(true)
    })

    it('debe retornar false si la sesión NO fue invalidada', async () => {
      const usuarioId = 999

      const result = await verificarSesionInvalidada(usuarioId)

      expect(result).toBe(false)
    })

    it('debe retornar false si la sesión fue invalidada pero expiró', async () => {
      const usuarioId = 111

      // Simular que la key expiró
      const { redis } = await import('../redis')
      vi.mocked(redis.get).mockResolvedValueOnce(null)

      const result = await verificarSesionInvalidada(usuarioId)

      expect(result).toBe(false)
    })
  })

  describe('limpiarInvalidacion', () => {
    it('debe eliminar la marca de invalidación', async () => {
      const usuarioId = 222

      // Invalidar primero
      await invalidarSesionUsuario(usuarioId)

      // Verificar que está invalidada
      let isInvalidated = await verificarSesionInvalidada(usuarioId)
      expect(isInvalidated).toBe(true)

      // Limpiar
      await limpiarInvalidacion(usuarioId)

      // Verificar que ya NO está invalidada
      isInvalidated = await verificarSesionInvalidada(usuarioId)
      expect(isInvalidated).toBe(false)
    })

    it('debe llamar a redis.del con la key correcta', async () => {
      const usuarioId = 333

      await limpiarInvalidacion(usuarioId)

      const { redis } = await import('../redis')
      expect(redis.del).toHaveBeenCalledWith('invalidate-session:333')
    })
  })

  describe('obtenerTimestampInvalidacion', () => {
    it('debe retornar el timestamp si existe', async () => {
      const usuarioId = 444
      const beforeTimestamp = Date.now()

      await invalidarSesionUsuario(usuarioId)
      const timestamp = await obtenerTimestampInvalidacion(usuarioId)

      expect(timestamp).not.toBeNull()
      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
    })

    it('debe retornar null si no existe invalidación', async () => {
      const usuarioId = 555

      const timestamp = await obtenerTimestampInvalidacion(usuarioId)

      expect(timestamp).toBeNull()
    })
  })

  describe('invalidarSesionesMultiples', () => {
    it('debe invalidar múltiples usuarios a la vez', async () => {
      const usuarioIds = [100, 200, 300]

      await invalidarSesionesMultiples(usuarioIds)

      // Verificar que todos fueron invalidados
      for (const id of usuarioIds) {
        const isInvalidated = await verificarSesionInvalidada(id)
        expect(isInvalidated).toBe(true)
      }
    })

    it('debe funcionar con un array vacío', async () => {
      await expect(invalidarSesionesMultiples([])).resolves.not.toThrow()
    })

    it('debe funcionar con un solo usuario', async () => {
      const usuarioIds = [999]

      await invalidarSesionesMultiples(usuarioIds)

      const isInvalidated = await verificarSesionInvalidada(999)
      expect(isInvalidated).toBe(true)
    })
  })

  describe('Flujo completo de invalidación', () => {
    it('debe simular el flujo completo: invalidar → verificar → limpiar', async () => {
      const usuarioId = 777

      // 1. Estado inicial: NO invalidado
      let isInvalidated = await verificarSesionInvalidada(usuarioId)
      expect(isInvalidated).toBe(false)

      // 2. Invalidar sesión
      await invalidarSesionUsuario(usuarioId)

      // 3. Verificar que está invalidado
      isInvalidated = await verificarSesionInvalidada(usuarioId)
      expect(isInvalidated).toBe(true)

      // 4. Obtener timestamp
      const timestamp = await obtenerTimestampInvalidacion(usuarioId)
      expect(timestamp).not.toBeNull()

      // 5. Limpiar invalidación
      await limpiarInvalidacion(usuarioId)

      // 6. Verificar que ya NO está invalidado
      isInvalidated = await verificarSesionInvalidada(usuarioId)
      expect(isInvalidated).toBe(false)

      // 7. Timestamp debe ser null
      const timestampAfter = await obtenerTimestampInvalidacion(usuarioId)
      expect(timestampAfter).toBeNull()
    })
  })

  describe('Manejo de errores', () => {
    it('debe manejar errores de Redis gracefully', async () => {
      const usuarioId = 888

      const { redis } = await import('../redis')
      vi.mocked(redis.set).mockRejectedValueOnce(new Error('Redis error'))

      await expect(invalidarSesionUsuario(usuarioId)).rejects.toThrow('Redis error')
    })
  })
})
