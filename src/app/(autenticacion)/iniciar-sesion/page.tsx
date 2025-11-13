import { redirect } from 'next/navigation'
import { getServerSession } from '@/caracteristicas/autenticacion/server'
import LoginForm from './ui'

export default async function IniciarSesionPage() {
  const session = await getServerSession()
  if (session?.user) {
    redirect('/dashboard')
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Contenido */}
      <div className="relative min-h-screen grid place-items-center p-6 z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Logo/Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <div className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full text-white text-sm font-semibold shadow-lg">
                ✨Sistema
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              Bienvenido
            </h1>
            <p className="text-gray-400 text-base">Gestiona tu negocio desde cualquier lugar</p>
          </div>

          {/* Formulario */}
          <LoginForm />

          {/* Footer */}
          <div className="text-center">
            <p className="text-gray-500 text-xs">
              © 2025 Sistema. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
