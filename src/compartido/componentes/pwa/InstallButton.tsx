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
    console.log('🌍 URL actual:', window.location.href)
    console.log('🔒 Protocolo:', window.location.protocol)

    // Detectar iOS
    const userAgent = navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(ios)
    console.log('📱 iOS detectado:', ios)
    console.log('🌐 User Agent:', userAgent)

    // Verificar si ya está instalada
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    // @ts-ignore
    const isIOSStandalone = window.navigator.standalone === true
    const installed = standalone || isIOSStandalone
    setIsInstalled(installed)
    console.log('📦 App instalada:', installed)
    console.log('📺 Display mode standalone:', standalone)
    console.log('🍎 iOS standalone:', isIOSStandalone)

    if (installed) {
      console.log('✅ App ya instalada, no mostrar botón')
      return
    }

    // Verificar Service Worker
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations()
          console.log('🔧 Service Workers registrados:', registrations.length)

          if (registrations.length > 0) {
            registrations.forEach((reg, index) => {
              console.log(`📝 SW ${index + 1}:`, {
                scope: reg.scope,
                active: !!reg.active,
                installing: !!reg.installing,
                waiting: !!reg.waiting,
                state: reg.active?.state
              })
            })
          } else {
            console.warn('⚠️ No hay Service Workers registrados')
          }

          const controller = navigator.serviceWorker.controller
          console.log('🎮 SW Controller activo:', !!controller)
          if (controller) {
            console.log('📍 SW Controller scope:', controller.scriptURL)
          }
        } catch (error) {
          console.error('❌ Error verificando SW:', error)
        }
      } else {
        console.warn('⚠️ Service Worker NO soportado en este navegador')
      }
    }

    // Verificar manifest
    const checkManifest = async () => {
      try {
        const response = await fetch('/manifest.json')
        if (response.ok) {
          const manifest = await response.json()
          console.log('📄 Manifest cargado correctamente:', {
            name: manifest.name,
            start_url: manifest.start_url,
            display: manifest.display,
            icons: manifest.icons?.length
          })
        } else {
          console.error('❌ Error cargando manifest:', response.status)
        }
      } catch (error) {
        console.error('❌ Error verificando manifest:', error)
      }
    }

    checkServiceWorker()
    checkManifest()

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

    // Verificar después de 5 segundos si se capturó el evento
    const timeoutId = setTimeout(async () => {
      // Verificar el estado actual del deferredPrompt desde el estado
      const currentPrompt = deferredPrompt

      if (!currentPrompt) {
        console.warn('⚠️ beforeinstallprompt NO se disparó después de 5 segundos')
        console.log('📋 Diagnóstico:')

        // Re-verificar SW después del timeout
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          const controller = navigator.serviceWorker.controller
          console.log('  - Service Worker activo:', !!controller)
          console.log('  - Registraciones:', registrations.length)
        }

        console.log('  - Protocolo HTTPS:', window.location.protocol === 'https:')
        console.log('  - Es localhost:', window.location.hostname === 'localhost')
        console.log('  - Display mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser')

        console.log('\n💡 Posibles causas:')
        console.log('  1. Service Worker no está activo (requiere build de producción)')
        console.log('  2. No estás en HTTPS (excepto localhost)')
        console.log('  3. Ya instalaste y rechazaste la app antes (Chrome recuerda ~3 meses)')
        console.log('  4. Falta algún criterio de PWA (manifest, icons, etc.)')
        console.log('  5. Navegador no soporta beforeinstallprompt (solo Chrome/Edge/Samsung)')

        console.log('\n🔍 Para resetear el estado de instalación en Chrome:')
        console.log('  - chrome://apps/ → Right click → Remove')
        console.log('  - DevTools → Application → Storage → Clear site data')
      }
    }, 5000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', appInstalledHandler)
      clearTimeout(timeoutId)
    }
  }, [isClient, deferredPrompt])

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
