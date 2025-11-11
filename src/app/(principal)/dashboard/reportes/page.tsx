import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import ReportesCliente from './reportes-cliente'

export default async function ReportesPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.REPORTES_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  return <ReportesCliente />
}
