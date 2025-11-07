import { redirect } from 'next/navigation'
import { getServerSession } from '@/caracteristicas/autenticacion/server'

export default async function HomePage() {
  const session = await getServerSession()

  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/iniciar-sesion')
  }
}
