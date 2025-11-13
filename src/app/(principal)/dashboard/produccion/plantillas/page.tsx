import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import PlantillaForm from '@/caracteristicas/plantillas-produccion/componentes/PlantillaForm'
import { Button } from '@/compartido/componentes/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Crear Plantilla de Producción',
  description: 'Crea una nueva plantilla de producción',
}

export default async function NuevaPlantillaPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.PRODUCCION_CREAR)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/produccion">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Crear Plantilla de Producción</h1>
          <p className="text-muted-foreground mt-2">
            Define una plantilla para aplicar rápidamente en futuros registros
          </p>
        </div>
      </div>

      <PlantillaForm />
    </div>
  )
}
