import { getServerSession } from '@/caracteristicas/autenticacion/server'
import Sidebar from '@/compartido/componentes/layout/sidebar-mejorado'
import { SessionRefresher } from '@/compartido/componentes/layout/SessionRefresher'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

export default async function PrincipalLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/iniciar-sesion')

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden" suppressHydrationWarning>
      {/* Componente que verifica cambios de permisos cada 5 segundos */}
      <SessionRefresher />

      {/* Sidebar - Responsive: drawer en móvil, fijo en desktop */}
      <Sidebar
        role={session.user.rol}
        sucursalId={session.user.sucursalId}
      />

      {/* Main content - Con scroll independiente */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pt-16 md:pt-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  )
}
