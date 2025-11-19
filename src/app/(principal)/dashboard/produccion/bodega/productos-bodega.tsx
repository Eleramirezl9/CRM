'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import { Package, CheckCircle, Sun, Moon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/compartido/componentes/ui/dialog'
import { getTurnoLabel, type Turno } from '@/compartido/lib/turnos'
import { confirmarRecepcionBodega } from '@/caracteristicas/produccion/acciones'
import { useState } from 'react'
import { NumeroFormateado } from '@/compartido/componentes/NumeroFormateado'
import { FechaFormateada } from '@/compartido/componentes/FechaFormateada'

type ProductoFirmado = {
  id: string
  productoId: string
  nombre: string
  cantidadContenedores: number
  unidadesPorContenedor: number
  totalUnidades: number
  fecha: Date
  turno: Turno
  firmadoPor: number | null
  fechaFirma: Date | null
}

type Props = {
  productos: ProductoFirmado[]
  usuario: {
    nombre: string
    correo: string
  }
}

function ItemProductoBodega({ producto, usuario }: { producto: ProductoFirmado, usuario: { nombre: string, correo: string } }) {
  const [loading, setLoading] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)

  const handleConfirmar = async () => {
    setLoading(true)
    const result = await confirmarRecepcionBodega(producto.id)
    setLoading(false)

    if (result.success) {
      setDialogOpen(false)
      window.location.reload()
    } else {
      alert(result.error || 'Error al confirmar recepción')
    }
  }

  return (
    <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{producto.nombre}</h3>
          <div className="text-sm text-muted-foreground mt-1 space-y-1">
            <div>
              Producido: {new Date(producto.fecha).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            {producto.fechaFirma && (
              <div className="text-xs">
                Firmado por producción: <FechaFormateada fecha={producto.fechaFirma} />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-col items-end">
          <Badge className="bg-blue-600">
            Firmado
          </Badge>
          <Badge
            variant={producto.turno === 'manana' ? 'default' : 'secondary'}
            className="flex items-center gap-1"
          >
            {producto.turno === 'manana' ? (
              <Sun className="w-3 h-3" />
            ) : (
              <Moon className="w-3 h-3" />
            )}
            {getTurnoLabel(producto.turno)}
          </Badge>
        </div>
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
        <div className="p-3 bg-blue-100 rounded border border-blue-300">
          <div className="text-xs text-muted-foreground mb-1">Total Unidades</div>
          <div className="text-xl font-bold text-blue-700">
            <NumeroFormateado valor={producto.totalUnidades} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="text-xs text-muted-foreground text-center flex-1">
          Confirma la recepción de este producto en bodega
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Recepción
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Recepción en Bodega</DialogTitle>
              <DialogDescription>
                Estás a punto de confirmar la recepción de este producto en bodega
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium">Resumen del Producto</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Producto:</div>
                  <div className="font-medium">{producto.nombre}</div>

                  <div className="text-muted-foreground">Total Unidades:</div>
                  <div className="font-medium">
                    <NumeroFormateado valor={producto.totalUnidades} /> unidades
                  </div>

                  <div className="text-muted-foreground">Turno Producción:</div>
                  <div className="font-medium flex items-center gap-1">
                    {producto.turno === 'manana' ? (
                      <Sun className="w-3 h-3" />
                    ) : (
                      <Moon className="w-3 h-3" />
                    )}
                    {getTurnoLabel(producto.turno)}
                  </div>

                  {producto.fechaFirma && (
                    <>
                      <div className="text-muted-foreground">Firmado:</div>
                      <div className="font-medium text-xs">
                        <FechaFormateada fecha={producto.fechaFirma} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Información de quien confirma */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Datos de Confirmación</h4>
                <div className="grid grid-cols-2 gap-2 text-sm bg-muted p-3 rounded">
                  <div className="text-muted-foreground">Confirmado por:</div>
                  <div className="font-medium">{usuario.nombre}</div>

                  <div className="text-muted-foreground">Correo:</div>
                  <div className="font-medium text-xs">{usuario.correo}</div>

                  <div className="text-muted-foreground">Fecha y hora:</div>
                  <div className="font-medium">{new Date().toLocaleString()}</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center p-3 bg-amber-50 border border-amber-200 rounded">
                ⚠️ Al confirmar, esta información quedará registrada permanentemente en el sistema
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmar} disabled={loading}>
                {loading ? 'Confirmando...' : 'Confirmar Recepción'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function ProductosBodega({ productos, usuario }: Props) {
  if (productos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No hay productos pendientes de confirmación</p>
            <p className="text-sm">Cuando producción firme productos, aparecerán aquí para tu confirmación</p>
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
            Productos Pendientes de Confirmación
          </CardTitle>
          <CardDescription>Productos firmados por producción esperando tu confirmación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Productos Pendientes</div>
              <div className="text-3xl font-bold">{productos.length}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Unidades</div>
              <div className="text-3xl font-bold text-blue-700"><NumeroFormateado valor={totalUnidades} /></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de productos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Firmados</CardTitle>
          <CardDescription>
            Revisa y confirma la recepción de estos productos en bodega
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {productos.map((producto) => (
            <ItemProductoBodega key={producto.id} producto={producto} usuario={usuario} />
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
              <h4 className="font-semibold mb-1">Proceso de confirmación</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>1. Verifica que la cantidad sea correcta</div>
                <div>2. Confirma el turno de producción</div>
                <div>3. Presiona "Confirmar Recepción" para registrar el producto en bodega</div>
                <div className="mt-2 font-medium">Una vez confirmado, el producto estará listo para distribuir a sucursales</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
