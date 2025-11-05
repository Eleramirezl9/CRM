import { getServerSession } from 'next-auth'
import { authOptions } from '@/caracteristicas/autenticacion/auth'
import Sidebar from '@/compartido/componentes/layout/sidebar'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export default async function PrincipalLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/iniciar-sesion')

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]" suppressHydrationWarning>
      <Sidebar
        role={session.user.rol}
        sucursalId={session.user.sucursalId}
      />
      <main className="p-6">{children}</main>
    </div>
  )
}
