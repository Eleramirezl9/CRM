import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { Suspense } from 'react'
import { PageTitle } from '@/compartido/componentes/PageTitle'
import ProduccionForm from './produccion-form'
import ProduccionDiaLista from './produccion-dia-lista'
import { obtenerProduccionDiaria } from '@/caracteristicas/produccion/acciones'
import PlantillasSelector from '@/caracteristicas/plantillas-produccion/componentes/PlantillasSelector'
import { Button } from '@/compartido/componentes/ui/button'
import Link from 'next/link'
import { LayoutTemplate } from 'lucide-react'

export const metadata = {
  title: 'Producción Diaria',
  description: 'Registra la producción del día',
}

export default async function ProduccionPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.PRODUCCION_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const hoy = new Date()
  const result = await obtenerProduccionDiaria(hoy)

  // Asegurar que el tipo turno sea correcto
  const producciones = (result.producciones || []).map(p => ({
    ...p,
    turno: p.turno as any // TypeScript cast para evitar error de tipo en serialización
  }))

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
        <ProduccionForm />

        <div>
          <Suspense fallback={<div>Cargando...</div>}>
            <ProduccionDiaLista producciones={producciones} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
