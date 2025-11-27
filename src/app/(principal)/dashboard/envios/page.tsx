import { obtenerEnvios, sugerirEnvios } from '@/caracteristicas/envios/acciones'
import CalendarioEnvios from './calendario-envios'
import SugerenciasEnvios from './sugerencias-envios'
import { Button } from '@/compartido/componentes/ui/button'
import { PageTitle } from '@/compartido/componentes/PageTitle'
import Link from 'next/link'
import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'

export default async function EnviosPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.ENVIOS_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const { envios } = await obtenerEnvios()
  const { sugerencias } = await sugerirEnvios()

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
        <div>
          <PageTitle title="Gestión de Envíos" icon="envios" />
          <p className="text-muted-foreground mt-1">Gestión de traslados entre sucursales</p>
        </div>
        <Link href="/dashboard/envios/nuevo">
          <Button className="w-full sm:w-auto">+ Nuevo Envío</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sugerencias - Ocupa 1 columna */}
        {sugerencias.length > 0 && (
          <div className="lg:col-span-1">
            <SugerenciasEnvios sugerencias={sugerencias} />
          </div>
        )}

        {/* Calendario - Ocupa 2 columnas o todo el espacio si no hay sugerencias */}
        <div className={sugerencias.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <CalendarioEnvios envios={envios} />
        </div>
      </div>
    </div>
  )
}
