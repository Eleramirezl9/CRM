import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/caracteristicas/autenticacion/auth'
import LoginForm from './ui'

export default async function IniciarSesionPage() {
  const session = await getServerSession(authOptions)
  if (session?.user) {
    redirect('/dashboard')
  }
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold text-center">Iniciar sesión</h1>
        <LoginForm />
      </div>
    </div>
  )
}
