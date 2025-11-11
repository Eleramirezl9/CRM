import { requireRole } from '@/compartido/lib/dal'
import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import SucursalForm from '../sucursal-form'

export default async function NuevaSucursalPage() {
  // Verificacion de permisos del lado del servidor
  await requireRole(['administrador'])

  const tienePermiso = await verificarPermiso(PERMISOS.SUCURSALES_CREAR)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nueva Sucursal</h1>
        <p className="text-muted-foreground mt-1">
          Crear una nueva sucursal para la empresa
        </p>
      </div>

      <SucursalForm />
    </div>
  )
}
