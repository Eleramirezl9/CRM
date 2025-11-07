/**
 * Rate Limiting para prevenir fuerza bruta
 * Implementación in-memory (para producción usar Redis)
 */

import 'server-only'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /**
   * Ventana de tiempo en milisegundos
   */
  windowMs: number
  /**
   * Número máximo de intentos en la ventana
   */
  max: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Verifica rate limit para un identificador
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos
  }
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  // No hay entrada o ya expiró
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs
    rateLimitMap.set(identifier, { count: 1, resetTime })
    return {
      success: true,
      limit: config.max,
      remaining: config.max - 1,
      resetTime,
    }
  }

  // Incrementar contador
  entry.count++

  // Verificar si excedió el límite
  if (entry.count > config.max) {
    return {
      success: false,
      limit: config.max,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  return {
    success: true,
    limit: config.max,
    remaining: config.max - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Resetea el rate limit para un identificador
 */
export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier)
}

/**
 * Obtiene el tiempo restante hasta el reset en minutos
 */
export function getRateLimitResetMinutes(resetTime: number): number {
  const now = Date.now()
  const diff = resetTime - now
  return Math.ceil(diff / 60000)
}
