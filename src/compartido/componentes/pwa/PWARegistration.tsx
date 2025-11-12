'use client'

import { useEffect } from 'react'

export default function PWARegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox

      // Escuchar actualizaciones
      const promptNewVersionAvailable = () => {
        if (
          confirm(
            '¡Hay una nueva versión disponible! ¿Quieres actualizar ahora?'
          )
        ) {
          wb.messageSkipWaiting()
          window.location.reload()
        }
      }

      wb.addEventListener('waiting', promptNewVersionAvailable)

      wb.addEventListener('controlling', () => {
        window.location.reload()
      })

      // Registrar el service worker
      wb.register()
        .then((registration) => {
          console.log('✅ Service Worker registrado exitosamente:', registration.scope)
        })
        .catch((error) => {
          console.error('❌ Error al registrar Service Worker:', error)
        })
    } else if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Fallback manual si workbox no está disponible
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
        })
        .then((registration) => {
          console.log('✅ Service Worker registrado manualmente:', registration.scope)

          // Verificar actualizaciones cada 60 segundos
          setInterval(() => {
            registration.update()
          }, 60000)

          // Escuchar mensajes del service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'CACHE_UPDATED') {
              console.log('📦 Cache actualizado')
            }
          })

          // Detectar cuando un nuevo SW está esperando
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // Hay un nuevo service worker listo
                  if (
                    confirm(
                      '¡Hay una nueva versión disponible! ¿Quieres actualizar ahora?'
                    )
                  ) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' })
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('❌ Error al registrar Service Worker:', error)
        })

      // Recargar cuando el nuevo SW tome control
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        window.location.reload()
      })
    } else {
      console.warn('⚠️ Service Workers no están soportados en este navegador')
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
