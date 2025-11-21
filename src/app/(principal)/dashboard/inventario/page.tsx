import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { PageTitle } from '@/compartido/componentes/PageTitle'
import { obtenerInventarioGlobal, obtenerAlertasStockCritico, obtenerMovimientosRecientes } from '@/caracteristicas/inventario/acciones'
import InventarioVista from './inventario-vista'
import AlertasStock from './alertas-stock'
import MovimientosLista from './movimientos-lista'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/compartido/componentes/ui/tabs'
import { Package, History } from 'lucide-react'

export default async function InventarioPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.INVENTARIO_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const [inventarioResult, alertasResult, movimientosResult] = await Promise.all([
    obtenerInventarioGlobal(),
    obtenerAlertasStockCritico(),
    obtenerMovimientosRecientes(7),
  ])

  const consolidado = inventarioResult.consolidado || []
  const alertas = alertasResult.alertas || []
  const movimientos = movimientosResult.movimientos || []
  const estadisticas = movimientosResult.estadisticas

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div>
        <PageTitle title="Control de Inventario" icon="inventario" />
        <p className="text-muted-foreground mt-1">Control consolidado de stock en todas las sucursales</p>
      </div>

      {alertas.length > 0 && <AlertasStock alertas={alertas} />}

      <Tabs defaultValue="consolidado" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
          <TabsTrigger value="consolidado" className="gap-2">
            <Package className="w-4 h-4 hidden sm:block" />
            Consolidado
          </TabsTrigger>
          <TabsTrigger value="movimientos" data-testid="ver-historial" className="gap-2">
            <History className="w-4 h-4 hidden sm:block" />
            Movimientos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consolidado" className="mt-6">
          <InventarioVista consolidado={consolidado as any} />
        </TabsContent>

        <TabsContent value="movimientos" className="mt-6">
          <MovimientosLista movimientos={movimientos as any} estadisticas={estadisticas} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
