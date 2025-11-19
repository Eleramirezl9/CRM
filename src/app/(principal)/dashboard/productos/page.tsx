import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { PageTitle } from '@/compartido/componentes/PageTitle'
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
    <div className="space-y-6 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageTitle title="Gestión de Productos" icon="productos" />
        <Link href="/dashboard/productos/nuevo" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">+ Nuevo Producto</Button>
        </Link>
      </div>

      <ProductosLista productos={productos} />
    </div>
  )
}
