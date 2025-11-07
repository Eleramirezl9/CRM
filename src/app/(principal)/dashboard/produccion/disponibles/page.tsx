import { obtenerProductosDisponibles } from '@/caracteristicas/produccion/acciones'
import ProductosDisponibles from './productos-disponibles'

export const metadata = {
  title: 'Productos Disponibles - Producción',
  description: 'Productos disponibles de producción para distribuir',
}

export default async function ProductosDisponiblesPage() {
  const result = await obtenerProductosDisponibles()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Productos Disponibles de Producción</h1>
        <p className="text-muted-foreground mt-2">
          Productos producidos hoy y listos para distribución a sucursales
        </p>
      </div>

      <ProductosDisponibles productos={result.productos || []} />
    </div>
  )
}
