'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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
      router.refresh() // Actualizar la sesión del servidor
      router.push('/dashboard') // Redirigir al dashboard
    } else {
      setError('Credenciales inválidas')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm">Correo</label>
        <input className="w-full border rounded px-3 py-2" value={correo} onChange={(e) => setCorreo(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-sm">Contraseña</label>
        <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="w-full bg-blue-600 text-white rounded px-3 py-2 disabled:opacity-50">
        {loading ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  )
}
