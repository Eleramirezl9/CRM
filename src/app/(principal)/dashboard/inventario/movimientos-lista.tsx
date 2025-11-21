'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { ArrowUpCircle, ArrowDownCircle, Calendar, User, Package, MapPin } from 'lucide-react'
import { NumeroFormateado } from '@/compartido/componentes/NumeroFormateado'

type Movimiento = {
  id: string
  tipo: string
  cantidad: number
  motivo: string | null
  creado_at: string
  producto: {
    id: string
    nombre: string
    sku: string
  }
  sucursal: {
    id: string
    nombre: string
  }
  creador: {
    id: number
    nombre: string
  }
}

type Estadisticas = {
  totalMovimientos: number
  totalEntradas: number
  totalSalidas: number
  productosUnicos: number
}

type Props = {
  movimientos: Movimiento[]
  estadisticas: Estadisticas | null
}

// Agrupar movimientos por día
function agruparPorDia(movimientos: Movimiento[]) {
  const grupos: Record<string, Movimiento[]> = {}

  movimientos.forEach(mov => {
    const fecha = new Date(mov.creado_at)
    const key = fecha.toISOString().split('T')[0]

    if (!grupos[key]) {
      grupos[key] = []
    }
    grupos[key].push(mov)
  })

  return Object.entries(grupos)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([fecha, items]) => ({
      fecha,
      movimientos: items,
    }))
}

function formatearFecha(fechaStr: string): string {
  const fecha = new Date(fechaStr + 'T12:00:00')
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)

  const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }

  if (fecha.toDateString() === hoy.toDateString()) {
    return 'Hoy'
  } else if (fecha.toDateString() === ayer.toDateString()) {
    return 'Ayer'
  }

  return fecha.toLocaleDateString('es-HN', opciones)
}

function formatearHora(fechaStr: string): string {
  return new Date(fechaStr).toLocaleTimeString('es-HN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MovimientosLista({ movimientos, estadisticas }: Props) {
  const movimientosPorDia = agruparPorDia(movimientos)

  if (movimientos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No hay movimientos recientes</p>
            <p className="text-sm">Los movimientos de inventario aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Movimientos</div>
              <div className="text-2xl font-bold">
                <NumeroFormateado valor={estadisticas.totalMovimientos} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <ArrowUpCircle className="w-3 h-3 text-green-600" />
                Entradas
              </div>
              <div className="text-2xl font-bold text-green-600">
                +<NumeroFormateado valor={estadisticas.totalEntradas} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <ArrowDownCircle className="w-3 h-3 text-red-600" />
                Salidas
              </div>
              <div className="text-2xl font-bold text-red-600">
                -<NumeroFormateado valor={estadisticas.totalSalidas} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Productos</div>
              <div className="text-2xl font-bold">
                <NumeroFormateado valor={estadisticas.productosUnicos} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Movimientos agrupados por día */}
      {movimientosPorDia.map(({ fecha, movimientos: movsDia }) => (
        <Card key={fecha}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatearFecha(fecha)}
              <Badge variant="secondary" className="ml-auto">
                {movsDia.length} {movsDia.length === 1 ? 'movimiento' : 'movimientos'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {movsDia.map((mov) => (
                <div key={mov.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Icono de tipo */}
                    <div className={`flex-shrink-0 p-2 rounded-full ${
                      mov.tipo === 'entrada'
                        ? 'bg-green-100 text-green-600'
                        : mov.tipo === 'salida'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {mov.tipo === 'entrada' ? (
                        <ArrowUpCircle className="w-4 h-4" />
                      ) : (
                        <ArrowDownCircle className="w-4 h-4" />
                      )}
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <h4 className="font-medium truncate">{mov.producto.nombre}</h4>
                        <div className={`text-lg font-bold ${
                          mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {mov.tipo === 'entrada' ? '+' : '-'}
                          <NumeroFormateado valor={mov.cantidad} />
                        </div>
                      </div>

                      {/* Info secundaria */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-mono">{mov.producto.sku}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {mov.sucursal.nombre}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {mov.creador.nombre}
                        </span>
                        <span>{formatearHora(mov.creado_at)}</span>
                      </div>

                      {/* Motivo */}
                      {mov.motivo && (
                        <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {mov.motivo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
