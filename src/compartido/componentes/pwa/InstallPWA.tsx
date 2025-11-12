'use client'

import { useEffect, useState } from 'react'
import { Download, X, Smartphone, Zap, Lock } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPWAProps {
  variant?: 'floating' | 'inline'
  showManualPrompt?: boolean
}

export default function InstallPWA({ variant = 'floating', showManualPrompt = true }: InstallPWAProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [hasNativeSupport, setHasNativeSupport] = useState(false)

  useEffect(() => {
    // Detectar si es dispositivo móvil
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)
      const ios = /iphone|ipad|ipod/.test(userAgent)
      
      setIsMobile(mobile)
      setIsIOS(ios)
    }

    checkMobile()

    // Verificar si ya está instalada
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return true
      }
      return false
    }

    if (checkIfInstalled()) return

    // Capturar el evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setHasNativeSupport(true)
      
      // Registrar en console para debug
      console.log('✅ beforeinstallprompt event capturado correctamente')
      
      // Mostrar después de 2 segundos
      setTimeout(() => setShowInstall(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Si pasaron 3 segundos y no hay nativeSupport pero es móvil, mostrar fallback
    const fallbackTimer = setTimeout(() => {
      if (!hasNativeSupport && isMobile && !isInstalled) {
        console.log('⚠️ No se capturó beforeinstallprompt, mostrando instrucciones manuales')
        setShowInstall(true)
      }
    }, 3000)

    // Detectar si se instaló
    window.addEventListener('appinstalled', () => {
      console.log('✅ App instalada exitosamente')
      setIsInstalled(true)
      setShowInstall(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(fallbackTimer)
    }
  }, [isMobile, isInstalled, hasNativeSupport])

  const handleInstall = async () => {
    // Si tiene soporte nativo del navegador
    if (deferredPrompt) {
      try {
        console.log('📱 Inicializando instalación nativa...')
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
          console.log('✅ Usuario aceptó la instalación')
          setShowInstall(false)
          setDeferredPrompt(null)
        }
      } catch (error) {
        console.error('Error al instalar:', error)
      }
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
        return
      }
    }
  }, [])

  if (!showInstall || isInstalled) return null

  // Variante flotante (bottom-right)
  if (variant === 'floating') {
    // Para iOS: mostrar instrucciones manuales
    if (isIOS) {
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
                  <p className="text-white/80 text-sm">En 2 simples pasos</p>
                </div>
              </div>
            </div>

            {/* Contenido iOS */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Toca el menú (↑ arriba)</p>
                    <p className="text-xs text-gray-600 mt-1">En la parte inferior de la pantalla</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Selecciona "Añadir a Inicio"</p>
                    <p className="text-xs text-gray-600 mt-1">La app aparecerá en tu pantalla de inicio</p>
                  </div>
                </div>
              </div>

              {/* Beneficios */}
              <div className="space-y-3 pt-2">
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
              </div>

              <button
                onClick={handleDismiss}
                className="w-full text-gray-600 hover:text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Para Android/otros: mostrar botón de instalación normal
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
            {deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group mt-2"
              >
                <Download className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Instalar ahora
              </button>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 text-center">
                  ℹ️ Tu navegador aún no está listo para instalar. Intenta más tarde.
                </p>
              </div>
            )}

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
