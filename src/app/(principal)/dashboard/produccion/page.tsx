import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { Suspense } from 'react'
import { PageTitle } from '@/compartido/componentes/PageTitle'
import ProduccionForm from './produccion-form'
import ProduccionDiaLista from './produccion-dia-lista'
import BitacoraProduccion from './bitacora-produccion'
import { obtenerProduccionDiaria, obtenerHistorialProduccion } from '@/caracteristicas/produccion/acciones'
import PlantillasSelector from '@/caracteristicas/plantillas-produccion/componentes/PlantillasSelector'
import { Button } from '@/compartido/componentes/ui/button'
import Link from 'next/link'
import { LayoutTemplate } from 'lucide-react'
import { verifySession } from '@/compartido/lib/dal'

export const metadata = {
  title: 'Producción Diaria',
  description: 'Registra la producción del día',
}

export default async function ProduccionPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.PRODUCCION_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const session = await verifySession()
  const hoy = new Date()

  // Obtener producción de hoy (ayer, hoy, mañana para turnos)
  const result = await obtenerProduccionDiaria(hoy)

  // Obtener historial completo para la bitácora
  const historialResult = await obtenerHistorialProduccion()

  // Filtrar solo producción de hoy para la lista principal
  const hoyUTC = new Date(Date.UTC(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    0, 0, 0, 0
  ))

  // Mañana UTC (para turno noche que registra producción del día siguiente)
  const mananaUTC = new Date(hoyUTC)
  mananaUTC.setUTCDate(mananaUTC.getUTCDate() + 1)

  // Filtrar solo las producciones de hoy y mañana (para turno noche actual)
  const produccionesHoy = (result.producciones || []).filter(p => {
    const fechaProd = new Date(p.fecha)
    const fechaProdUTC = new Date(Date.UTC(
      fechaProd.getUTCFullYear(),
      fechaProd.getUTCMonth(),
      fechaProd.getUTCDate(),
      0, 0, 0, 0
    ))
    return fechaProdUTC.getTime() === hoyUTC.getTime() || fechaProdUTC.getTime() === mananaUTC.getTime()
  }).map(p => ({
    ...p,
    turno: p.turno as any
  }))

  // Historial completo para bitácora
  const historialCompleto = (historialResult.producciones || []).map(p => ({
    ...p,
    turno: p.turno as any
  }))

  const usuario = {
    nombre: (session.user as any).nombre || 'Usuario',
    correo: (session.user as any).correo || ''
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
        <div>
          <PageTitle title="Producción del Día" icon="produccion" />
          <p className="text-muted-foreground mt-1">
            Registra de forma simple lo que produjiste hoy
          </p>
        </div>
        <Link href="/dashboard/produccion/plantillas">
          <Button variant="outline" className="gap-2">
            <LayoutTemplate className="w-4 h-4" />
            Crear Plantilla
          </Button>
        </Link>
      </div>

      {/* Selector de Plantillas Rápidas */}
      <PlantillasSelector />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ProduccionForm />
        </div>

        <div className="space-y-6">
          <Suspense fallback={<div>Cargando...</div>}>
            <ProduccionDiaLista producciones={produccionesHoy} usuario={usuario} />
          </Suspense>

          <Suspense fallback={<div>Cargando bitácora...</div>}>
            <BitacoraProduccion producciones={historialCompleto} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
