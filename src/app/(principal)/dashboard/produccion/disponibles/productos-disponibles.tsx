'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import { Package, AlertCircle, CheckCircle, Sun, Moon } from 'lucide-react'
import { getTurnoLabel, type Turno } from '@/compartido/lib/turnos'
import { firmarProduccion, actualizarTurno } from '@/caracteristicas/produccion/acciones'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/compartido/componentes/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/compartido/componentes/ui/dialog'
import { NumeroFormateado } from '@/compartido/componentes/NumeroFormateado'
import { FechaFormateada } from '@/compartido/componentes/FechaFormateada'

type ProductoDisponible = {
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
  productos: ProductoDisponible[]
  usuario: {
    nombre: string
    correo: string
  }
}

function ItemProductoDisponible({ producto, usuario }: { producto: ProductoDisponible, usuario: { nombre: string, correo: string } }) {
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [turnoEditando, setTurnoEditando] = useState(producto.turno)

  const handleFirmar = async () => {
    setLoading(true)
    const result = await firmarProduccion(producto.id)
    setLoading(false)

    if (result.success) {
      setDialogOpen(false)
      window.location.reload()
    } else {
      alert(result.error || 'Error al firmar producción')
    }
  }

  const handleActualizarTurno = async () => {
    setLoading(true)
    const result = await actualizarTurno(producto.id, turnoEditando)
    setLoading(false)

    if (result.success) {
      window.location.reload()
    } else {
      alert(result.error || 'Error al actualizar turno')
    }
  }

  return (
    <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
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
                Firmado: <FechaFormateada fecha={producto.fechaFirma} />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-col items-end">
          <Badge className="bg-green-600">
            Disponible
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
        <div className="p-3 bg-green-100 rounded border border-green-300">
          <div className="text-xs text-muted-foreground mb-1">Total Unidades</div>
          <div className="text-xl font-bold text-green-700">
            <NumeroFormateado valor={producto.totalUnidades} />
          </div>
        </div>
      </div>

      {/* Selector de turno y botón de firma */}
      <div className="mt-4 space-y-3">
        {/* Selector de turno editable */}
        <div className="flex items-center gap-2">
          <Select value={turnoEditando} onValueChange={(v: Turno) => setTurnoEditando(v)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manana">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  Mañana (4am - 4pm)
                </div>
              </SelectItem>
              <SelectItem value="noche">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  Noche (5pm - 3am)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {turnoEditando !== producto.turno && (
            <Button size="sm" onClick={handleActualizarTurno} disabled={loading} variant="outline">
              Actualizar
            </Button>
          )}
        </div>

        {/* Botón de firma */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground text-center flex-1">
            Al firmar, este producto será enviado a bodega y se registrará tu usuario como responsable
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Firmar y Enviar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Firma y Envío a Bodega</DialogTitle>
                <DialogDescription>
                  Estás a punto de firmar esta producción y enviarla a bodega para su confirmación.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Resumen de Producción</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Producto:</div>
                    <div className="font-medium">{producto.nombre}</div>

                    <div className="text-muted-foreground">Total Unidades:</div>
                    <div className="font-medium">
                      <NumeroFormateado valor={producto.totalUnidades} /> unidades
                    </div>

                    <div className="text-muted-foreground">Turno:</div>
                    <div className="font-medium flex items-center gap-1">
                      {turnoEditando === 'manana' ? (
                        <Sun className="w-3 h-3" />
                      ) : (
                        <Moon className="w-3 h-3" />
                      )}
                      {getTurnoLabel(turnoEditando)}
                    </div>

                    <div className="text-muted-foreground">Fecha:</div>
                    <div className="font-medium">
                      {new Date(producto.fecha).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Información de quien firma */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Datos de Firma</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted p-3 rounded">
                    <div className="text-muted-foreground">Firmado por:</div>
                    <div className="font-medium">{usuario.nombre}</div>

                    <div className="text-muted-foreground">Correo:</div>
                    <div className="font-medium text-xs">{usuario.correo}</div>

                    <div className="text-muted-foreground">Fecha y hora:</div>
                    <div className="font-medium">{new Date().toLocaleString()}</div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground text-center p-3 bg-amber-50 border border-amber-200 rounded">
                  ⚠️ Al confirmar la firma, esta información quedará registrada permanentemente en el sistema
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleFirmar} disabled={loading}>
                  {loading ? 'Firmando...' : 'Confirmar Firma'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

export default function ProductosDisponibles({ productos, usuario }: Props) {
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
              <div className="text-3xl font-bold text-primary"><NumeroFormateado valor={totalUnidades} /></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de productos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos del Día - Listos para Firmar</CardTitle>
          <CardDescription>
            Revisa los productos producidos hoy y fírmalos para enviarlos a bodega
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {productos.map((producto) => (
            <ItemProductoDisponible key={producto.id} producto={producto} usuario={usuario} />
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
              <h4 className="font-semibold mb-1">¿Cómo funciona el proceso?</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>1. Verifica que el turno sea correcto (Mañana o Noche)</div>
                <div>2. Presiona "Firmar y Enviar" para confirmar la producción</div>
                <div>3. Los productos firmados aparecerán en la vista de bodega para su confirmación</div>
                <div className="mt-2 font-medium">Los productos sin firmar no serán visibles para bodega</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
