import { requireRole } from '@/compartido/lib/dal'
import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import ReportesCliente from './reportes-cliente'

export default async function ReportesPage() {
  // Verificacion de permisos del lado del servidor
  await requireRole(['administrador'])

  const tienePermiso = await verificarPermiso(PERMISOS.REPORTES_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  return <ReportesCliente />
}
