import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { PageTitle } from '@/compartido/componentes/PageTitle'
import { obtenerInventarioGlobal, obtenerAlertasStockCritico } from '@/caracteristicas/inventario/acciones'
import InventarioVista from './inventario-vista'
import AlertasStock from './alertas-stock'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/compartido/componentes/ui/tabs'

export default async function InventarioPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.INVENTARIO_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const { consolidado = [] } = await obtenerInventarioGlobal()
  const { alertas = [] } = await obtenerAlertasStockCritico()

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div>
        <PageTitle title="Control de Inventario" icon="inventario" />
        <p className="text-muted-foreground mt-1">Control consolidado de stock en todas las sucursales</p>
      </div>

      {alertas.length > 0 && <AlertasStock alertas={alertas} />}

      <Tabs defaultValue="consolidado" className="w-full">
        <TabsList>
          <TabsTrigger value="consolidado">Vista Consolidada</TabsTrigger>
          <TabsTrigger value="movimientos" data-testid="ver-historial">Movimientos Recientes</TabsTrigger>
        </TabsList>

        <TabsContent value="consolidado" className="mt-6">
          <InventarioVista consolidado={consolidado as any} />
        </TabsContent>

        <TabsContent value="movimientos" className="mt-6">
          <div className="text-muted-foreground">Movimientos recientes se mostrarán aquí</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
