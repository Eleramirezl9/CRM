import { obtenerProductos } from '@/caracteristicas/productos/acciones'
import ProductosLista from './productos-lista'
import { Button } from '@/compartido/componentes/ui/button'
import Link from 'next/link'

export default async function ProductosPage() {
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
