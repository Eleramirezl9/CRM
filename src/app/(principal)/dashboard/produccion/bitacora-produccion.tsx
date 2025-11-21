'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Package,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon
} from 'lucide-react'
import { getTurnoLabel, type Turno } from '@/compartido/lib/turnos'
import { NumeroFormateado } from '@/compartido/componentes/NumeroFormateado'

type Produccion = {
  id: string
  fecha: Date
  cantidadContenedores: number
  unidadesPorContenedor: number
  totalUnidades: number
  enviado: boolean
  observaciones: string | null
  turno: Turno
  firmadoPor: number | null
  fechaFirma: Date | null
  producto: {
    id: string
    nombre: string
    unidadMedida: string | null
  }
}

type Props = {
  producciones: Produccion[]
}

// Nombres de días y meses en español
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function formatearFechaUTC(fecha: Date): string {
  const dia = fecha.getUTCDate()
  const mes = fecha.getUTCMonth() + 1
  const anio = fecha.getUTCFullYear()
  return `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${anio}`
}

function formatearFechaLarga(fecha: Date): string {
  const d = new Date(fecha)
  const diaSemana = DIAS_SEMANA[d.getUTCDay()]
  const dia = d.getUTCDate()
  const mes = MESES[d.getUTCMonth()]
  return `${diaSemana}, ${dia} de ${mes}`
}

export default function BitacoraProduccion({ producciones }: Props) {
  const [mesActual, setMesActual] = useState(() => {
    const hoy = new Date()
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  })
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null)
  const [turnoMananaExpandido, setTurnoMananaExpandido] = useState(true)
  const [turnoNocheExpandido, setTurnoNocheExpandido] = useState(true)

  // Agrupar producciones por fecha
  const produccionesPorFecha = useMemo(() => {
    const grupos: Record<string, Produccion[]> = {}
    producciones.forEach(p => {
      const fecha = new Date(p.fecha)
      const key = `${fecha.getUTCFullYear()}-${fecha.getUTCMonth()}-${fecha.getUTCDate()}`
      if (!grupos[key]) {
        grupos[key] = []
      }
      grupos[key].push(p)
    })
    return grupos
  }, [producciones])

  // Generar días del mes (usando hora local para el calendario UI)
  const diasDelMes = useMemo(() => {
    const anio = mesActual.getFullYear()
    const mes = mesActual.getMonth()

    const primerDia = new Date(anio, mes, 1)
    const ultimoDia = new Date(anio, mes + 1, 0)

    const dias: (Date | null)[] = []

    // Agregar días vacíos al inicio
    const diaSemanaInicio = primerDia.getDay()
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(null)
    }

    // Agregar días del mes
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      dias.push(new Date(anio, mes, d))
    }

    return dias
  }, [mesActual])

  // Verificar si un día tiene producción
  const tieneProduccion = (fecha: Date): boolean => {
    const key = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`
    return !!produccionesPorFecha[key]
  }

  // Obtener producciones de un día
  const obtenerProduccionesDia = (fecha: Date): Produccion[] => {
    const key = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`
    return produccionesPorFecha[key] || []
  }

  // Es hoy
  const esHoy = (fecha: Date): boolean => {
    const hoy = new Date()
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear()
  }

  // Cambiar mes
  const mesAnterior = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1))
  }

  const mesSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1))
  }

  // Producciones del día seleccionado
  const produccionesDiaSeleccionado = diaSeleccionado
    ? obtenerProduccionesDia(diaSeleccionado)
    : []

  // Agrupar por turno
  const produccionesPorTurno = useMemo(() => {
    const manana = produccionesDiaSeleccionado.filter(p => p.turno === 'manana')
    const noche = produccionesDiaSeleccionado.filter(p => p.turno === 'noche')
    return { manana, noche }
  }, [produccionesDiaSeleccionado])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarIcon className="w-5 h-5" />
          Bitácora de Producción
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Navegación del mes */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
          </h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={mesAnterior}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={mesSiguiente}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendario */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Encabezados de días */}
          {DIAS_SEMANA.map(dia => (
            <div key={dia} className="text-xs font-medium text-muted-foreground py-2">
              {dia}
            </div>
          ))}

          {/* Días del mes */}
          {diasDelMes.map((fecha, idx) => (
            <div key={idx} className="aspect-square">
              {fecha ? (
                <button
                  onClick={() => setDiaSeleccionado(fecha)}
                  className={`
                    w-full h-full flex flex-col items-center justify-center rounded-lg text-sm
                    transition-colors relative
                    ${esHoy(fecha) ? 'bg-primary text-primary-foreground font-bold' : ''}
                    ${diaSeleccionado && fecha.getTime() === diaSeleccionado.getTime() && !esHoy(fecha)
                      ? 'bg-primary/20 font-semibold'
                      : ''}
                    ${!esHoy(fecha) && !(diaSeleccionado && fecha.getTime() === diaSeleccionado.getTime())
                      ? 'hover:bg-muted'
                      : ''}
                  `}
                >
                  {fecha.getDate()}
                  {tieneProduccion(fecha) && (
                    <div className={`
                      absolute bottom-1 w-1.5 h-1.5 rounded-full
                      ${esHoy(fecha) ? 'bg-primary-foreground' : 'bg-green-500'}
                    `} />
                  )}
                </button>
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          ))}
        </div>

        {/* Detalle del día seleccionado */}
        {diaSeleccionado && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              {formatearFechaLarga(diaSeleccionado)}
            </h4>

            {produccionesDiaSeleccionado.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Sin producción registrada
              </div>
            ) : (
              <div className="space-y-2">
                {/* Turno Mañana */}
                {produccionesPorTurno.manana.length > 0 && (
                  <div>
                    <button
                      onClick={() => setTurnoMananaExpandido(!turnoMananaExpandido)}
                      className="w-full flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-sm">Turno Mañana</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {produccionesPorTurno.manana.length} producto{produccionesPorTurno.manana.length > 1 ? 's' : ''}
                        </Badge>
                        <ChevronDown className={`w-4 h-4 transition-transform ${turnoMananaExpandido ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {turnoMananaExpandido && (
                      <div className="pt-2 space-y-2">
                        {produccionesPorTurno.manana.map(prod => (
                          <ItemProduccionBitacora key={prod.id} produccion={prod} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Turno Noche */}
                {produccionesPorTurno.noche.length > 0 && (
                  <div>
                    <button
                      onClick={() => setTurnoNocheExpandido(!turnoNocheExpandido)}
                      className="w-full flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-indigo-600" />
                        <span className="font-medium text-sm">Turno Noche</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {produccionesPorTurno.noche.length} producto{produccionesPorTurno.noche.length > 1 ? 's' : ''}
                        </Badge>
                        <ChevronDown className={`w-4 h-4 transition-transform ${turnoNocheExpandido ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {turnoNocheExpandido && (
                      <div className="pt-2 space-y-2">
                        {produccionesPorTurno.noche.map(prod => (
                          <ItemProduccionBitacora key={prod.id} produccion={prod} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ItemProduccionBitacora({ produccion }: { produccion: Produccion }) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <h5 className="font-medium text-sm">{produccion.producto.nombre}</h5>
          <div className="text-xs text-muted-foreground mt-1">
            {produccion.cantidadContenedores} × {produccion.unidadesPorContenedor}
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-sm text-primary">
            <NumeroFormateado valor={produccion.totalUnidades} />
          </div>
          <div className="flex items-center gap-1 mt-1">
            {produccion.enviado ? (
              <Badge variant="default" className="text-xs px-1.5 py-0">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Firmado
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                <Circle className="w-3 h-3 mr-1" />
                Pendiente
              </Badge>
            )}
          </div>
        </div>
      </div>
      {produccion.observaciones && (
        <p className="text-xs text-muted-foreground mt-2 italic">
          {produccion.observaciones}
        </p>
      )}
    </div>
  )
}
