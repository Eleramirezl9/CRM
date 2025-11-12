'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    console.log('🎬 InstallButton inicializado')

    // Detectar iOS
    const userAgent = navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(ios)
    console.log('📱 iOS detectado:', ios)

    // Verificar si ya está instalada
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    // @ts-ignore
    const isIOSStandalone = window.navigator.standalone === true
    const installed = standalone || isIOSStandalone
    setIsInstalled(installed)
    console.log('📦 App instalada:', installed)

    if (installed) {
      console.log('✅ App ya instalada, no mostrar botón')
      return
    }

    // Capturar evento beforeinstallprompt (Android/Desktop)
    const handler = (e: Event) => {
      console.log('🎉 beforeinstallprompt capturado!')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      console.log('✅ deferredPrompt guardado, botón puede instalar directamente')
    }

    window.addEventListener('beforeinstallprompt', handler)
    console.log('👂 Escuchando beforeinstallprompt...')

    // Detectar instalación exitosa
    const appInstalledHandler = () => {
      console.log('✅ App instalada exitosamente')
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('appinstalled', appInstalledHandler)

    // Verificar después de 3 segundos si se capturó el evento
    setTimeout(() => {
      if (!deferredPrompt) {
        console.warn('⚠️ beforeinstallprompt NO se disparó después de 3 segundos')
        console.log('Posibles razones:')
        console.log('- Estás en desarrollo (localhost) sin HTTPS real')
        console.log('- El Service Worker no está activo')
        console.log('- La app ya fue instalada y rechazada antes')
        console.log('- No cumple criterios de instalabilidad PWA')
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', appInstalledHandler)
    }
  }, [isClient])

  const handleInstall = async () => {
    console.log('🔘 Botón clickeado', { deferredPrompt, isIOS })

    // Si tiene soporte nativo (Android/Desktop) → Instalación DIRECTA
    if (deferredPrompt) {
      try {
        console.log('✅ Mostrando prompt nativo de instalación...')
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        console.log('📊 Resultado:', outcome)
        if (outcome === 'accepted') {
          setIsInstalled(true)
          setDeferredPrompt(null)
        }
      } catch (error) {
        console.error('❌ Error al instalar:', error)
      }
    }
    // Si no hay soporte nativo, mostrar instrucciones
    else {
      console.log('📖 Mostrando instrucciones manuales')
      setShowInstructions(true)
    }
  }

  // Solo ocultar si ya está instalada
  if (isInstalled || !isClient) return null

  // SIEMPRE mostrar el botón (mientras no esté instalada)
  return (
    <>
      {/* Botón de Instalación */}
      <button
        onClick={handleInstall}
        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full text-white text-sm font-semibold shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Instalar App
      </button>

      {/* Modal de Instrucciones (solo para iOS o navegadores sin soporte) */}
      {showInstructions && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 relative">
              <button
                onClick={() => setShowInstructions(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              <h3 className="text-xl font-bold text-white">
                📱 Cómo Instalar la App
              </h3>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {isIOS ? (
                // Instrucciones para iOS
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Toca el ícono de Compartir</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Está en la parte inferior (Safari) con una flecha hacia arriba ↑
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Selecciona "Añadir a Inicio"</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Desplázate hacia abajo y busca esta opción
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Confirma con "Añadir"</p>
                        <p className="text-sm text-gray-600 mt-1">
                          ¡Listo! La app aparecerá en tu pantalla de inicio
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Instrucciones para otros navegadores
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Abre el menú del navegador</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Busca el ícono de tres puntos (⋮ o ⋯)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Busca "Instalar app"</p>
                        <p className="text-sm text-gray-600 mt-1">
                          O "Agregar a pantalla de inicio"
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Selecciona la opción</p>
                        <p className="text-sm text-gray-600 mt-1">
                          ¡La app se agregará a tu pantalla de inicio!
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full mt-4 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
