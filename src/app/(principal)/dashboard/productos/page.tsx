import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { obtenerProductos } from '@/caracteristicas/productos/acciones'
import ProductosLista from './productos-lista'
import { Button } from '@/compartido/componentes/ui/button'
import Link from 'next/link'

export default async function ProductosPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.PRODUCTOS_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const { productos } = await obtenerProductos()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Productos</h1>
        <Link href="/dashboard/productos/nuevo">
          <Button>+ Nuevo Producto</Button>
        </Link>
      </div>

      <ProductosLista productos={productos} />
    </div>
  )
}
