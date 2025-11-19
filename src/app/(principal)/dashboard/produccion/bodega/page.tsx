import { obtenerProductosFirmados } from '@/caracteristicas/produccion/acciones'
import ProductosBodega from './productos-bodega'
import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { verifySession } from '@/compartido/lib/dal'

export const metadata = {
  title: 'Bodega - Producción',
  description: 'Productos firmados por producción esperando confirmación',
}

export default async function BodegaPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.PRODUCCION_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const session = await verifySession()
  const result = await obtenerProductosFirmados()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bodega - Confirmación de Producción</h1>
        <p className="text-muted-foreground mt-2">
          Productos firmados por producción esperando tu confirmación de recepción
        </p>
      </div>

      <ProductosBodega
        productos={result.productos || []}
        usuario={{
          nombre: (session.user as any).nombre || 'Usuario',
          correo: (session.user as any).correo || ''
        }}
      />
    </div>
  )
}
