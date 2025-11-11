import { requireRole } from '@/compartido/lib/dal'
import { requirePermiso, PERMISOS } from '@/compartido/lib/permisos'
import ReportesCliente from './reportes-cliente'

export default async function ReportesPage() {
  // Verificacion de permisos del lado del servidor
  await requireRole(['administrador'])
  await requirePermiso(PERMISOS.REPORTES_VER)

  return <ReportesCliente />
}
