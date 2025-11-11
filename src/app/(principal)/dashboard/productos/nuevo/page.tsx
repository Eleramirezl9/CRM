import { requireRole } from '@/compartido/lib/dal'
import { requirePermiso, PERMISOS } from '@/compartido/lib/permisos'
import ProductoForm from '../producto-form'

export default async function NuevoProductoPage() {
  // Verificacion de permisos del lado del servidor
  await requireRole(['administrador', 'bodega'])
  await requirePermiso(PERMISOS.PRODUCTOS_CREAR)
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Producto</h1>
        <p className="text-muted-foreground mt-2">El SKU se generará automáticamente</p>
      </div>
      
      <ProductoForm />
    </div>
  )
}
