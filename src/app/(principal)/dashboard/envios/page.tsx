import { obtenerEnvios, sugerirEnvios } from '@/caracteristicas/envios/acciones'
import EnviosLista from './envios-lista'
import SugerenciasEnvios from './sugerencias-envios'
import { Button } from '@/compartido/componentes/ui/button'
import Link from 'next/link'
import { requireRole } from '@/compartido/lib/dal'
import { requirePermiso, PERMISOS } from '@/compartido/lib/permisos'

export default async function EnviosPage() {
  // ✅ Verificación de permisos del lado del servidor
  await requireRole(['administrador', 'bodega'])
  await requirePermiso(PERMISOS.ENVIOS_VER)

  const { envios } = await obtenerEnvios()
  const { sugerencias } = await sugerirEnvios()
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Envíos</h1>
          <p className="text-muted-foreground mt-1">Gestión de traslados entre sucursales</p>
        </div>
        <Link href="/dashboard/envios/nuevo">
          <Button>+ Nuevo Envío</Button>
        </Link>
      </div>
      
      {sugerencias.length > 0 && <SugerenciasEnvios sugerencias={sugerencias} />}
      
      <EnviosLista envios={envios} />
    </div>
  )
}
