'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { CheckCircle2, Circle, Calendar, Package } from 'lucide-react'

type Produccion = {
  id: string
  fecha: Date
  cantidadContenedores: number
  unidadesPorContenedor: number
  totalUnidades: number
  enviado: boolean
  observaciones: string | null
  producto: {
    id: string
    nombre: string
    unidadMedida: string | null
  }
}

type Props = {
  producciones: Produccion[]
}

export default function HistorialProduccion({ producciones: produccionesIniciales }: Props) {
  const [filtroProducto, setFiltroProducto] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'enviado' | 'pendiente'>('todos')

  // Filtrar producciones
  const produccionesFiltradas = produccionesIniciales.filter(p => {
    const coincideProducto = p.producto.nombre.toLowerCase().includes(filtroProducto.toLowerCase())
    const coincideEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'enviado' && p.enviado) ||
      (filtroEstado === 'pendiente' && !p.enviado)

    return coincideProducto && coincideEstado
  })

  // Agrupar por fecha
  const produccionesPorFecha = produccionesFiltradas.reduce((acc, p) => {
    const fecha = new Date(p.fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!acc[fecha]) {
      acc[fecha] = []
    }
    acc[fecha].push(p)
    return acc
  }, {} as Record<string, Produccion[]>)

  // Estadísticas
  const totalUnidades = produccionesFiltradas.reduce((sum, p) => sum + p.totalUnidades, 0)
  const totalEnviado = produccionesFiltradas.filter(p => p.enviado).length

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtroProducto">Buscar producto</Label>
              <Input
                id="filtroProducto"
                placeholder="Francés, Dulce..."
                value={filtroProducto}
                onChange={(e) => setFiltroProducto(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtroEstado">Estado</Label>
              <select
                id="filtroEstado"
                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as any)}
              >
                <option value="todos">Todos</option>
                <option value="enviado">Enviados</option>
                <option value="pendiente">Pendientes</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Registros</div>
              <div className="text-2xl font-bold">{produccionesFiltradas.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Unidades</div>
              <div className="text-2xl font-bold">{totalUnidades.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Enviados</div>
              <div className="text-2xl font-bold">{totalEnviado}/{produccionesFiltradas.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de producciones agrupadas por fecha */}
      {Object.keys(produccionesPorFecha).length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron registros con los filtros aplicados</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(produccionesPorFecha).map(([fecha, producciones]) => {
            const totalDia = producciones.reduce((sum, p) => sum + p.totalUnidades, 0)

            return (
              <Card key={fecha}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {fecha}
                    </CardTitle>
                    <Badge variant="outline">
                      {totalDia.toLocaleString()} unidades
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {producciones.map((produccion) => (
                      <div
                        key={produccion.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold">{produccion.producto.nombre}</h3>
                            <div className="text-sm text-muted-foreground mt-1">
                              {produccion.cantidadContenedores} contenedores × {produccion.unidadesPorContenedor} unidades
                            </div>
                          </div>
                          <Badge variant={produccion.enviado ? 'default' : 'secondary'}>
                            {produccion.enviado ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Enviado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Circle className="w-3 h-3" />
                                Pendiente
                              </span>
                            )}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="font-semibold text-lg text-primary">
                            {produccion.totalUnidades.toLocaleString()} {produccion.producto.unidadMedida || 'unidades'}
                          </div>
                        </div>

                        {produccion.observaciones && (
                          <div className="mt-2 text-sm text-muted-foreground italic border-l-2 pl-2">
                            {produccion.observaciones}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
