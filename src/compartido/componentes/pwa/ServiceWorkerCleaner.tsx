'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function ServiceWorkerCleaner() {
  const [showWarning, setShowWarning] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    if (process.env.NODE_ENV === 'development') return

    // Verificar si hay Service Workers con problemas
    const checkForProblematicSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations()

          // Si hay registraciones, verificar si están causando errores
          if (registrations.length > 0) {
            // Verificar en localStorage si hubo errores recientes
            const hadErrors = localStorage.getItem('sw-had-errors')
            if (hadErrors) {
              setShowWarning(true)
            }
          }
        } catch (error) {
          console.error('Error checking SW:', error)
        }
      }
    }

    // Escuchar errores del Service Worker
    window.addEventListener('error', (event) => {
      if (event.message && event.message.includes('bad-precaching-response')) {
        localStorage.setItem('sw-had-errors', 'true')
        setShowWarning(true)
      }
    })

    checkForProblematicSW()
  }, [isClient])

  const handleClearSW = async () => {
    setIsClearing(true)

    try {
      // Desregistrar todos los Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
        }
      }

      // Limpiar todos los caches
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        for (const name of cacheNames) {
          await caches.delete(name)
        }
      }

      // Limpiar localStorage
      localStorage.removeItem('sw-had-errors')
      localStorage.removeItem('pwa-dismissed')

      // Recargar la página
      window.location.reload()
    } catch (error) {
      console.error('Error clearing SW:', error)
      setIsClearing(false)
    }
  }

  if (!showWarning || !isClient) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-500 text-yellow-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                Detectamos un problema con la versión anterior de la app
              </p>
              <p className="text-xs mt-1 opacity-90">
                Haz clic en "Actualizar" para obtener la última versión
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleClearSW}
              disabled={isClearing}
              className="bg-yellow-900 hover:bg-yellow-800 disabled:opacity-50 text-yellow-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              {isClearing ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button
              onClick={() => {
                localStorage.setItem('sw-warning-dismissed', Date.now().toString())
                setShowWarning(false)
              }}
              className="p-2 hover:bg-yellow-600/20 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
