/**
 * Cliente de Redis usando Upstash
 *
 * Este módulo configura el cliente de Redis para operaciones de caché
 * y gestión de sesiones en tiempo real.
 *
 * Upstash Redis es serverless y compatible con Vercel Edge Functions,
 * proporcionando acceso via API REST además del protocolo Redis.
 */

import { Redis } from '@upstash/redis'

/**
 * Validar que las credenciales de Redis estén configuradas
 */
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN


if (!redisUrl || !redisToken) {
  throw new Error(
    '❌ Redis configuration missing. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment variables.'
  )
}

/**
 * Singleton del cliente Redis
 *
 * Configurado con las credenciales de Upstash desde variables de entorno.
 * Utiliza la API REST para compatibilidad con funciones serverless.
 */
export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
})

/**
 * Constantes para TTL (Time To Live) en segundos
 */
export const REDIS_TTL = {
  /** Invalidación de sesión: 5 minutos */
  SESSION_INVALIDATION: 300,
  /** Caché de permisos: 30 segundos */
  PERMISSIONS_CACHE: 30,
  /** Rate limiting: 15 minutos */
  RATE_LIMIT: 900,
} as const

/**
 * Prefijos para keys de Redis
 * Ayudan a organizar y identificar diferentes tipos de datos
 */
export const REDIS_KEYS = {
  /** Invalidación de sesión: invalidate-session:{usuarioId} */
  sessionInvalidation: (usuarioId: number) => `invalidate-session:${usuarioId}`,
  /** Permisos cacheados: permissions:{usuarioId} */
  permissionsCache: (usuarioId: number) => `permissions:${usuarioId}`,
  /** Rate limiting por IP: rate-limit:{ip}:{action} */
  rateLimit: (ip: string, action: string) => `rate-limit:${ip}:${action}`,
} as const
