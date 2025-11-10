/**
 * Layout de Reportes
 * ✅ Valida que solo usuarios con permiso puedan acceder
 */

import { redirect } from 'next/navigation'
import { requireRole } from '@/compartido/lib/dal'
import { requirePermiso, PERMISOS } from '@/compartido/lib/permisos'

export default async function ReportesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    // ✅ CRÍTICO: Solo admin puede acceder a reportes
    await requireRole(['administrador'])
    await requirePermiso(PERMISOS.REPORTES_VER)
  } catch (error) {
    // Si no tiene permisos, redirigir a no autorizado
    redirect('/no-autorizado')
  }

  return <>{children}</>
}
