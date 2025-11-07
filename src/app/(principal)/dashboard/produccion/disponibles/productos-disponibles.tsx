'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Package, AlertCircle } from 'lucide-react'

type ProductoDisponible = {
  productoId: string
  nombre: string
  cantidadContenedores: number
  unidadesPorContenedor: number
  totalUnidades: number
  fecha: Date
}

type Props = {
  productos: ProductoDisponible[]
}

export default function ProductosDisponibles({ productos }: Props) {
  if (productos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No hay productos disponibles</p>
            <p className="text-sm">Cuando producción registre productos, aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalUnidades = productos.reduce((sum, p) => sum + p.totalUnidades, 0)

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Resumen de Disponibilidad
          </CardTitle>
          <CardDescription>Productos listos para distribuir a sucursales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Productos Diferentes</div>
              <div className="text-3xl font-bold">{productos.length}</div>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Unidades</div>
              <div className="text-3xl font-bold text-primary">{totalUnidades.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de productos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Disponibles</CardTitle>
          <CardDescription>
            Estos productos fueron producidos hoy y están listos para enviar a las sucursales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {productos.map((producto) => (
            <div
              key={producto.productoId}
              className="p-4 border-2 border-green-200 bg-green-50 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{producto.nombre}</h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    Producido: {new Date(producto.fecha).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <Badge className="bg-green-600">
                  Disponible
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-3 bg-white rounded border">
                  <div className="text-xs text-muted-foreground mb-1">Contenedores</div>
                  <div className="text-xl font-bold">{producto.cantidadContenedores}</div>
                </div>
                <div className="p-3 bg-white rounded border">
                  <div className="text-xs text-muted-foreground mb-1">Por Contenedor</div>
                  <div className="text-xl font-bold">{producto.unidadesPorContenedor}</div>
                </div>
                <div className="p-3 bg-green-100 rounded border border-green-300">
                  <div className="text-xs text-muted-foreground mb-1">Total Unidades</div>
                  <div className="text-xl font-bold text-green-700">
                    {producto.totalUnidades.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>Listo para crear envío a sucursales</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                ℹ️
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-1">¿Cómo usar esta información?</h4>
              <p className="text-sm text-muted-foreground">
                Estos productos están disponibles en producción y listos para distribuir.
                Puedes crear envíos a las sucursales usando estos productos.
                Los números mostrados reflejan la producción del día.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
