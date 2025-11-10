/**
 * Componente: SessionRefresher
 *
 * Este componente verifica periódicamente si la sesión del usuario
 * ha sido invalidada (permisos modificados) y fuerza un refresh automático.
 *
 * Funcionalidad:
 * - Verifica cada 5 segundos si debe refrescar
 * - Llama a /api/check-session-validity
 * - Si detecta invalidación, llama a update() de useSession
 * - El update() ejecuta el JWT callback que recarga permisos
 *
 * @module SessionRefresher
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Intervalo de verificación en milisegundos (5 segundos)
 */
const CHECK_INTERVAL_MS = 5000

export function SessionRefresher() {
  const { data: session, update, status } = useSession()
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Solo verificar si el usuario está autenticado
    if (status !== 'authenticated' || !session?.user?.id) {
      return
    }

    /**
     * Verifica si la sesión debe refrescarse
     */
    const checkSessionValidity = async () => {
      // No verificar si ya está refrescando
      if (isRefreshing) return

      try {
        const response = await fetch('/api/check-session-validity', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          // Si no está autorizado, probablemente la sesión expiró
          if (response.status === 401) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Sesión expirada, redirigiendo a login...')
            }
            return
          }
          throw new Error('Error al verificar sesión')
        }

        const data = await response.json()

        // Si debe refrescar, forzar actualización de sesión
        if (data.shouldRefresh) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Permisos modificados, refrescando sesión...')
          }
          setIsRefreshing(true)

          // Forzar recarga de permisos desde BD
          await update()

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Sesión refrescada exitosamente')
          }
          setIsRefreshing(false)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error al verificar validez de sesión:', error)
        }
        setIsRefreshing(false)
      }
    }

    // Ejecutar verificación inicial
    checkSessionValidity()

    // Configurar intervalo de verificación
    const interval = setInterval(checkSessionValidity, CHECK_INTERVAL_MS)

    // Cleanup: limpiar intervalo al desmontar
    return () => clearInterval(interval)
  }, [session, update, status, isRefreshing])

  // Este componente no renderiza nada visible
  return null
}
