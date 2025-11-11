import { requireRole } from '@/compartido/lib/dal'
import { requirePermiso, PERMISOS } from '@/compartido/lib/permisos'
import { obtenerProductoPorId } from '@/caracteristicas/productos/acciones'
import ProductoForm from '../producto-form'
import { notFound } from 'next/navigation'

export default async function EditarProductoPage({ params }: { params: { id: string } }) {
  // Verificacion de permisos del lado del servidor
  await requireRole(['administrador', 'bodega'])
  await requirePermiso(PERMISOS.PRODUCTOS_EDITAR)
  const { producto } = await obtenerProductoPorId(params.id)
  
  if (!producto) {
    notFound()
  }
  
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Editar Producto</h1>
        <p className="text-muted-foreground mt-2">SKU: {producto.sku}</p>
      </div>
      
      <ProductoForm producto={producto} />
    </div>
  )
}
