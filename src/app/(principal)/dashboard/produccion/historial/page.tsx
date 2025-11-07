import HistorialProduccion from './historial-produccion'
import { obtenerHistorialProduccion } from '@/caracteristicas/produccion/acciones'

export const metadata = {
  title: 'Historial de Producción',
  description: 'Consulta el historial de producción',
}

export default async function HistorialPage() {
  // Obtener últimos 30 días por defecto
  const fechaInicio = new Date()
  fechaInicio.setDate(fechaInicio.getDate() - 30)

  const result = await obtenerHistorialProduccion({
    fechaInicio,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historial de Producción</h1>
        <p className="text-muted-foreground mt-2">
          Consulta y filtra el historial de producción
        </p>
      </div>

      <HistorialProduccion producciones={result.producciones || []} />
    </div>
  )
}
