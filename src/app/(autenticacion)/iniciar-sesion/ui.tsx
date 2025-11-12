'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LogIn, Mail, Lock } from 'lucide-react'
import InstallButton from '@/compartido/componentes/pwa/InstallButton'

export default function LoginForm() {
  const router = useRouter()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await signIn('credentials', {
      redirect: false,
      correo,
      password,
    })
    setLoading(false)
    if (res?.ok) {
      router.refresh()
      router.push('/dashboard')
    } else {
      setError('Credenciales inválidas')
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <LogIn className="text-white h-8 w-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
          <p className="text-gray-500 text-sm mt-2">Inicia sesión en tu cuenta</p>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Correo electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="tu@email.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Contraseña */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="password"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <div className="flex-shrink-0 pt-0.5">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Botón de ingreso */}
        <button
          disabled={loading}
          type="submit"
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Ingresando…
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              Ingresar
            </>
          )}
        </button>

        {/* Info adicional */}
        <p className="text-center text-xs text-gray-500 mt-6">
          ¿Olvidaste tu contraseña?{' '}
          <a href="#" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
            Recuperar
          </a>
        </p>
      </form>

      {/* Botón de Instalación PWA */}
      <div className="flex justify-center mt-4">
        <InstallButton />
      </div>
    </>
  )
}
