import { obtenerProductosFirmados, obtenerHistorialBodega } from '@/caracteristicas/produccion/acciones'
import { obtenerSucursales } from '@/caracteristicas/inventario/acciones'
import ProductosBodega from './productos-bodega'
import HistorialBodega from './historial-bodega'
import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { verifySession } from '@/compartido/lib/dal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/compartido/componentes/ui/tabs'
import { Package, History } from 'lucide-react'

export const metadata = {
  title: 'Bodega - Recepción de Producción',
  description: 'Confirmación de productos recibidos de producción',
}

export default async function BodegaPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.BODEGA_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const session = await verifySession()
  const [resultPendientes, resultHistorial, resultSucursales] = await Promise.all([
    obtenerProductosFirmados(),
    obtenerHistorialBodega(),
    obtenerSucursales()
  ])

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-3xl font-bold">Bodega - Recepción de Producción</h1>
        <p className="text-muted-foreground mt-2">
          Confirma la recepción de productos enviados por producción
        </p>
      </div>

      <Tabs defaultValue="pendientes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pendientes" className="gap-2">
            <Package className="w-4 h-4" />
            Pendientes ({resultPendientes.productos?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-2">
            <History className="w-4 h-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes">
          <ProductosBodega
            productos={resultPendientes.productos || []}
            usuario={{
              nombre: (session.user as any).nombre || 'Usuario',
              correo: (session.user as any).correo || ''
            }}
            sucursales={resultSucursales.sucursales || []}
          />
        </TabsContent>

        <TabsContent value="historial">
          <HistorialBodega historial={resultHistorial.historial || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
