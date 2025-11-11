import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventario Global</h1>
          <p className="text-muted-foreground mt-1">Control consolidado de stock en todas las sucursales</p>
        </div>
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
