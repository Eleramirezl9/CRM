import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { obtenerSucursalPorId } from '@/caracteristicas/sucursales/acciones'
import { notFound } from 'next/navigation'
import SucursalForm from '../sucursal-form'

interface EditarSucursalPageProps {
  params: {
    id: string
  }
}

export default async function EditarSucursalPage({ params }: EditarSucursalPageProps) {
  const tienePermiso = await verificarPermiso(PERMISOS.SUCURSALES_EDITAR)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const { success, sucursal, error } = await obtenerSucursalPorId(params.id)

  if (!success || !sucursal) {
    if (error === 'Sucursal no encontrada') {
      notFound()
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Editar Sucursal</h1>
          <p className="text-muted-foreground mt-1">
            Error al cargar la sucursal: {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Sucursal</h1>
        <p className="text-muted-foreground mt-1">
          Modificar información de {sucursal.nombre}
        </p>
      </div>

      <SucursalForm sucursal={sucursal} />
    </div>
  )
}
