import { obtenerVentas, obtenerEstadisticasVentas } from '@/caracteristicas/ventas/acciones'
import VentasRegistro from './ventas-registro'
import VentasLista from './ventas-lista'
import EstadisticasVentas from './estadisticas-ventas'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/compartido/componentes/ui/tabs'

export default async function VentasPage() {
  const { ventas } = await obtenerVentas()
  const { estadisticas } = await obtenerEstadisticasVentas()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ventas</h1>
        <p className="text-muted-foreground mt-1">Registro rápido y seguimiento de ventas</p>
      </div>
      
      <EstadisticasVentas estadisticas={estadisticas} />
      
      <Tabs defaultValue="registro" className="w-full">
        <TabsList>
          <TabsTrigger value="registro">Registrar Venta</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        
        <TabsContent value="registro" className="mt-6">
          <VentasRegistro />
        </TabsContent>
        
        <TabsContent value="historial" className="mt-6">
          <VentasLista ventas={ventas} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
