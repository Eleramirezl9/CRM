'use client'

import { useEffect, useState } from 'react'
import { Download, X, Smartphone, Zap, Lock } from 'lucide-react'
import Image from 'next/image'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPWAProps {
  variant?: 'floating' | 'inline'
}

export default function InstallPWA({ variant = 'floating' }: InstallPWAProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [animateIcon, setAnimateIcon] = useState(true)

  useEffect(() => {
    // Verificar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Capturar el evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detectar si se instaló
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstall(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setShowInstall(false)
        setDeferredPrompt(null)
      }
    } catch (error) {
      console.error('Error al instalar:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstall(false)
    // Volver a mostrar después de 7 días
    localStorage.setItem('pwa-dismissed', Date.now().toString())
  }

  // No mostrar si ya está instalada o si fue descartada recientemente
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-dismissed')
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) {
        setShowInstall(false)
      }
    }
  }, [])

  if (!showInstall || isInstalled) return null

  // Variante flotante (bottom-right)
  if (variant === 'floating') {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 backdrop-blur-sm max-w-sm">
          {/* Encabezado con gradiente */}
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] bg-[length:20px_20px]" />
            </div>
            
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl p-2 border border-white/30 flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Instala nuestra app</h3>
                <p className="text-white/80 text-sm">Acceso rápido y sin límites</p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-4">
            {/* Beneficios */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-gray-700">Acceso instantáneo desde tu pantalla</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-gray-700">Funciona sin conexión a internet</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Download className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-gray-700">Sin descargas en tiendas</span>
              </div>
            </div>

            {/* Botón de instalación */}
            <button
              onClick={handleInstall}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group mt-2"
            >
              <Download className="h-5 w-5 group-hover:scale-110 transition-transform" />
              Instalar ahora
            </button>

            <button
              onClick={handleDismiss}
              className="w-full text-gray-600 hover:text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Recordarme después
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Variante inline para insertar en páginas
  return (
    <div className="w-full bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200 p-6 my-6 shadow-lg">
      <div className="flex items-center gap-6">
        <div className="flex-shrink-0 w-20 h-20 bg-white rounded-2xl shadow-md p-3 border border-orange-100 flex items-center justify-center">
          <Smartphone className="h-10 w-10 text-orange-600 animate-pulse" />
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-xl mb-2">
            Instala nuestra app en tu dispositivo
          </h3>
          <p className="text-gray-600 mb-4">
            Acceso rápido desde tu pantalla de inicio. Funciona incluso sin conexión a internet.
          </p>

          <button
            onClick={handleInstall}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group"
          >
            <Download className="h-5 w-5 group-hover:scale-110 transition-transform" />
            Instalar aplicación
          </button>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-2"
          aria-label="Cerrar"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
