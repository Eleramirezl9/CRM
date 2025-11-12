'use client'

import { useEffect } from 'react'

export default function PWARegistration() {
  useEffect(() => {
    // Solo registrar Service Worker en producción
    const isProduction = process.env.NODE_ENV === 'production'

    console.log('🏁 PWARegistration inicializado')
    console.log('🌍 Entorno:', isProduction ? 'PRODUCCIÓN' : 'DESARROLLO')
    console.log('🌐 URL:', typeof window !== 'undefined' ? window.location.href : 'N/A')

    if (!isProduction) {
      console.log('🔧 PWA: Service Worker deshabilitado en desarrollo')
      console.log('💡 Para probar PWA, ejecuta: npm run build && npm start')
      return
    }

    console.log('✅ Modo producción activado, iniciando registro de SW...')

    // Función para limpiar Service Workers viejos
    const cleanupOldServiceWorkers = async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        console.log('🧹 Limpiando', registrations.length, 'Service Workers viejos...')
        for (const registration of registrations) {
          await registration.unregister()
          console.log('🧹 Service Worker desregistrado:', registration.scope)
        }
      }
    }

    // Verificar soporte
    if (typeof window === 'undefined') {
      console.error('❌ Window no está definido (SSR)')
      return
    }

    if (!('serviceWorker' in navigator)) {
      console.error('❌ Service Worker NO soportado en este navegador')
      return
    }

    console.log('✅ Service Worker soportado')
    console.log('🔍 Verificando disponibilidad de Workbox...')

    if (window.workbox !== undefined) {
      console.log('✅ Workbox disponible, usando registro automático')
      const wb = window.workbox

      // Escuchar actualizaciones
      const promptNewVersionAvailable = () => {
        console.log('🆕 Nueva versión detectada en espera')
        if (
          confirm(
            '¡Hay una nueva versión disponible! ¿Quieres actualizar ahora?'
          )
        ) {
          console.log('✅ Usuario aceptó actualizar')
          wb.messageSkipWaiting()
          window.location.reload()
        } else {
          console.log('⏭️ Usuario rechazó actualizar')
        }
      }

      wb.addEventListener('waiting', promptNewVersionAvailable)

      wb.addEventListener('controlling', () => {
        console.log('🎮 Nuevo SW tomó control, recargando...')
        window.location.reload()
      })

      // Registrar el service worker con manejo de errores
      console.log('📝 Iniciando registro de SW con Workbox...')
      wb.register()
        .then((registration) => {
          console.log('✅ Service Worker registrado exitosamente!')
          console.log('📍 Scope:', registration.scope)
          console.log('🔧 State:', registration.active?.state)

          // Verificar si está activo
          if (registration.active) {
            console.log('✅ SW activo inmediatamente')
          } else if (registration.installing) {
            console.log('⏳ SW instalándose...')
          } else if (registration.waiting) {
            console.log('⏸️ SW esperando...')
          }
        })
        .catch((error) => {
          console.error('❌ Error al registrar Service Worker:', error)
          console.error('📋 Detalles del error:', error.message, error.stack)
          // Si falla, limpiar SWs viejos e intentar de nuevo
          console.log('🔄 Intentando limpiar y reintentar...')
          cleanupOldServiceWorkers().then(() => {
            console.log('🔄 Recargando en 1 segundo...')
            setTimeout(() => location.reload(), 1000)
          })
        })
    } else {
      console.log('⚠️ Workbox NO disponible, usando registro manual')
      console.log('📝 Buscando /sw.js...')

      // Fallback manual si workbox no está disponible
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
        })
        .then((registration) => {
          console.log('✅ Service Worker registrado manualmente!')
          console.log('📍 Scope:', registration.scope)
          console.log('🔧 State:', registration.active?.state)

          // Verificar estado inicial
          if (registration.active) {
            console.log('✅ SW activo inmediatamente')
          } else if (registration.installing) {
            console.log('⏳ SW instalándose...')
            const installing = registration.installing
            installing.addEventListener('statechange', () => {
              console.log('🔄 SW cambió a:', installing.state)
            })
          } else if (registration.waiting) {
            console.log('⏸️ SW esperando...')
          }

          // Verificar actualizaciones cada 60 segundos
          setInterval(() => {
            console.log('🔄 Verificando actualizaciones del SW...')
            registration.update()
          }, 60000)

          // Escuchar mensajes del service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('📨 Mensaje del SW:', event.data)
            if (event.data && event.data.type === 'CACHE_UPDATED') {
              console.log('📦 Cache actualizado')
            }
          })

          // Detectar cuando un nuevo SW está esperando
          registration.addEventListener('updatefound', () => {
            console.log('🔍 Actualización detectada')
            const newWorker = registration.installing
            if (newWorker) {
              console.log('⏳ Nuevo SW instalándose...')
              newWorker.addEventListener('statechange', () => {
                console.log('🔄 Nuevo SW cambió a:', newWorker.state)
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // Hay un nuevo service worker listo
                  console.log('🆕 Nuevo SW instalado y listo')
                  if (
                    confirm(
                      '¡Hay una nueva versión disponible! ¿Quieres actualizar ahora?'
                    )
                  ) {
                    console.log('✅ Usuario aceptó actualizar')
                    newWorker.postMessage({ type: 'SKIP_WAITING' })
                    window.location.reload()
                  } else {
                    console.log('⏭️ Usuario rechazó actualizar')
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('❌ Error al registrar Service Worker:', error)
          console.error('📋 Detalles del error:', error.message, error.stack)
          console.log('💡 Posibles causas:')
          console.log('  - Archivo /sw.js no existe')
          console.log('  - No estás en HTTPS (excepto localhost)')
          console.log('  - Error en el código del SW')
        })

      // Recargar cuando el nuevo SW tome control
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🎮 Nuevo SW tomó control')
        if (refreshing) {
          console.log('⏭️ Ya se está recargando, ignorando')
          return
        }
        refreshing = true
        console.log('🔄 Recargando página...')
        window.location.reload()
      })
    }
  }, [])

  return null
}

// Extender la interfaz Window para incluir workbox
declare global {
  interface Window {
    workbox?: {
      register: () => Promise<ServiceWorkerRegistration>
      messageSkipWaiting: () => void
      addEventListener: (event: string, callback: () => void) => void
    }
  }
}
