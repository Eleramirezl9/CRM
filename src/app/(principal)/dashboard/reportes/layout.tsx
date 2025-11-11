/**
 * Layout de Reportes
 * ✅ Valida que solo usuarios con permiso puedan acceder
 */

import { requireRole } from '@/compartido/lib/dal'
import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'

export default async function ReportesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ CRÍTICO: Solo admin puede acceder a reportes
  await requireRole(['administrador'])

  const tienePermiso = await verificarPermiso(PERMISOS.REPORTES_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  return <>{children}</>
}
