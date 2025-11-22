import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { PageTitle } from '@/compartido/componentes/PageTitle'
import { obtenerInventarioGlobal, obtenerAlertasStockCritico } from '@/caracteristicas/inventario/acciones'
import InventarioVista from './inventario-vista'
import AlertasStock from './alertas-stock'

export default async function InventarioPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.INVENTARIO_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const [inventarioResult, alertasResult] = await Promise.all([
    obtenerInventarioGlobal(),
    obtenerAlertasStockCritico(),
  ])

  const consolidado = inventarioResult.consolidado || []
  const alertas = alertasResult.alertas || []

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div>
        <PageTitle title="Inventario" icon="inventario" />
        <p className="text-muted-foreground mt-1">Stock disponible en Bodega Central</p>
      </div>

      {alertas.length > 0 && <AlertasStock alertas={alertas} />}

      <InventarioVista consolidado={consolidado as any} />
    </div>
  )
}
