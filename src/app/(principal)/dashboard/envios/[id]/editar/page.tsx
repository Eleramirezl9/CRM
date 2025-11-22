import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { obtenerEnvioPorId } from '@/caracteristicas/envios/acciones'
import { notFound } from 'next/navigation'
import EnvioEditForm from './envio-edit-form'

export default async function EditarEnvioPage({ params }: { params: { id: string } }) {
  const tienePermiso = await verificarPermiso(PERMISOS.ENVIOS_EDITAR)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const { envio, error } = await obtenerEnvioPorId(params.id)

  if (!envio) {
    notFound()
  }

  // No permitir edición si ya está en tránsito o entregado
  if (envio.estado === 'en_transito' || envio.estado === 'entregado') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">No se puede editar</h1>
        <p className="text-muted-foreground">
          Este envío ya está {envio.estado === 'entregado' ? 'entregado' : 'en tránsito'} y no puede ser modificado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Editar Envío</h1>
        <p className="text-muted-foreground mt-1">
          #{envio.id.slice(0, 8)} - {envio.sucursalOrigen.nombre} → {envio.sucursalDestino.nombre}
        </p>
      </div>

      <EnvioEditForm envio={envio} />
    </div>
  )
}
