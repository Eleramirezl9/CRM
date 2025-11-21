'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Sun, Moon, User, CheckCircle2, History } from 'lucide-react'
import { getTurnoLabel, type Turno } from '@/compartido/lib/turnos'
import { NumeroFormateado } from '@/compartido/componentes/NumeroFormateado'
import { FechaFormateada } from '@/compartido/componentes/FechaFormateada'

// Función para formatear fecha UTC sin conversión de zona horaria
function formatearFechaCorta(fecha: Date): string {
  const diasSemana = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

  const d = new Date(fecha)
  const diaSemana = diasSemana[d.getUTCDay()]
  const dia = d.getUTCDate()
  const mes = meses[d.getUTCMonth()]
  const anio = d.getUTCFullYear()

  return `${diaSemana}, ${dia} ${mes} ${anio}`
}

type HistorialItem = {
  id: string
  nombre: string
  totalUnidades: number
  fecha: Date
  turno: Turno
  firmadoPor: {
    nombre: string
    correo: string
  } | null
  fechaFirma: Date | null
  confirmadoPor: {
    nombre: string
    correo: string
  } | null
  fechaConfirmacion: Date | null
}

type Props = {
  historial: HistorialItem[]
}

export default function HistorialBodega({ historial }: Props) {
  if (historial.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No hay historial de recepciones</p>
            <p className="text-sm">Aquí aparecerán los productos que has confirmado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Historial de Recepciones
        </CardTitle>
        <CardDescription>
          Productos confirmados en bodega con sus firmas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {historial.map((item) => (
            <div key={item.id} className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{item.nombre}</h3>
                  <div className="text-sm text-muted-foreground">
                    {formatearFechaCorta(new Date(item.fecha))}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Confirmado
                  </Badge>
                  <Badge
                    variant={item.turno === 'manana' ? 'default' : 'secondary'}
                    className="flex items-center gap-1"
                  >
                    {item.turno === 'manana' ? (
                      <Sun className="w-3 h-3" />
                    ) : (
                      <Moon className="w-3 h-3" />
                    )}
                    {getTurnoLabel(item.turno)}
                  </Badge>
                </div>
              </div>

              <div className="text-xl font-bold mb-3">
                <NumeroFormateado valor={item.totalUnidades} /> unidades
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Firma de producción */}
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="font-medium text-blue-700 mb-1">Firma Producción</div>
                  {item.firmadoPor ? (
                    <>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.firmadoPor.nombre}
                      </div>
                      {item.fechaFirma && (
                        <div className="text-muted-foreground">
                          <FechaFormateada fecha={item.fechaFirma} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-muted-foreground">Sin información</div>
                  )}
                </div>

                {/* Firma de bodega */}
                <div className="p-2 bg-green-50 rounded border border-green-200">
                  <div className="font-medium text-green-700 mb-1">Firma Bodega</div>
                  {item.confirmadoPor ? (
                    <>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.confirmadoPor.nombre}
                      </div>
                      {item.fechaConfirmacion && (
                        <div className="text-muted-foreground">
                          <FechaFormateada fecha={item.fechaConfirmacion} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-muted-foreground">Sin información</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
