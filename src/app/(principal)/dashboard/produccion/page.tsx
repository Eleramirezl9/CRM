import { requireRole } from '@/compartido/lib/dal'
import { requirePermiso, PERMISOS } from '@/compartido/lib/permisos'
import { Suspense } from 'react'
import ProduccionForm from './produccion-form'
import ProduccionDiaLista from './produccion-dia-lista'
import { obtenerProduccionDiaria } from '@/caracteristicas/produccion/acciones'

export const metadata = {
  title: 'Producción Diaria',
  description: 'Registra la producción del día',
}

export default async function ProduccionPage() {
  // Verificacion de permisos del lado del servidor
  await requireRole(['administrador', 'produccion'])
  await requirePermiso(PERMISOS.PRODUCCION_VER)
  const hoy = new Date()
  const result = await obtenerProduccionDiaria(hoy)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Producción del Día</h1>
        <p className="text-muted-foreground mt-2">
          Registra de forma simple lo que produjiste hoy
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProduccionForm />

        <div>
          <Suspense fallback={<div>Cargando...</div>}>
            <ProduccionDiaLista producciones={result.producciones || []} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
