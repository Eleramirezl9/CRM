'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { CheckCircle2, Package, Circle } from 'lucide-react'

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

export default function ProduccionDiaLista({ producciones }: Props) {
  if (producciones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Producción de Hoy</CardTitle>
          <CardDescription>No hay producción registrada para hoy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aún no has registrado producción para hoy</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalProducido = producciones.reduce((sum, p) => sum + p.totalUnidades, 0)
  const totalEnviado = producciones.filter(p => p.enviado).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Producción de Hoy</CardTitle>
        <CardDescription>
          {producciones.length} producto{producciones.length > 1 ? 's' : ''} registrado{producciones.length > 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Total Producido</div>
            <div className="text-2xl font-bold">{totalProducido.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Estado</div>
            <div className="text-sm font-medium">
              {totalEnviado}/{producciones.length} enviados
            </div>
          </div>
        </div>

        {/* Lista de productos */}
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

        {!producciones.every(p => p.enviado) && (
          <div className="text-xs text-muted-foreground text-center">
            Los productos marcados como "Pendiente" están disponibles para que bodega los vea
          </div>
        )}
      </CardContent>
    </Card>
  )
}
