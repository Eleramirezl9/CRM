'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import { Package, CheckCircle, Sun, Moon, User, Mail, Calendar, Warehouse } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/compartido/componentes/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/compartido/componentes/ui/select'
import { getTurnoLabel, type Turno } from '@/compartido/lib/turnos'
import { confirmarRecepcionBodega } from '@/caracteristicas/produccion/acciones'
import { useState } from 'react'
import { NumeroFormateado } from '@/compartido/componentes/NumeroFormateado'
import { FechaFormateada } from '@/compartido/componentes/FechaFormateada'

type Sucursal = {
  id: string
  nombre: string
}

// Función para formatear fecha UTC sin conversión de zona horaria
function formatearFechaLargaUTC(fecha: Date): string {
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

  const d = new Date(fecha)
  const diaSemana = diasSemana[d.getUTCDay()]
  const dia = d.getUTCDate()
  const mes = meses[d.getUTCMonth()]
  const anio = d.getUTCFullYear()

  return `${diaSemana}, ${dia} de ${mes} de ${anio}`
}

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
  usuarioFirma?: {
    nombre: string
    correo: string
  } | null
}

type Props = {
  productos: ProductoFirmado[]
  usuario: {
    nombre: string
    correo: string
  }
  sucursales: Sucursal[]
}

function ItemProductoBodega({ producto, usuario, sucursales }: { producto: ProductoFirmado, usuario: { nombre: string, correo: string }, sucursales: Sucursal[] }) {
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sucursalId, setSucursalId] = useState<string>(sucursales[0]?.id || '')

  const handleConfirmar = async () => {
    if (!sucursalId) {
      alert('Selecciona una sucursal destino')
      return
    }

    setLoading(true)
    const result = await confirmarRecepcionBodega(producto.id, sucursalId)
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
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Producido: {formatearFechaLargaUTC(new Date(producto.fecha))}
            </div>
            {producto.fechaFirma && (
              <div className="text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                Firmado: <FechaFormateada fecha={producto.fechaFirma} />
              </div>
            )}
            {producto.usuarioFirma && (
              <div className="text-xs flex items-center gap-1 text-green-700">
                <User className="w-3 h-3" />
                Por: {producto.usuarioFirma.nombre}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-col items-end">
          <Badge className="bg-blue-600">
            Firmado por Producción
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

      <div className="mt-4 space-y-3">
        <div className="text-xs text-muted-foreground text-center">
          Confirma la recepción de este producto en bodega
        </div>

        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
          onClick={() => setDialogOpen(true)}
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          CONFIRMAR Y FIRMAR RECEPCIÓN
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                      <div className="text-muted-foreground">Firmado por producción:</div>
                      <div className="font-medium text-xs">
                        <FechaFormateada fecha={producto.fechaFirma} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Selección de sucursal destino */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Warehouse className="w-4 h-4" />
                  Sucursal Destino (Inventario)
                </h4>
                <Select value={sucursalId} onValueChange={setSucursalId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map((sucursal) => (
                      <SelectItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  El producto se agregará al inventario de esta sucursal
                </p>
              </div>

              {/* Información de quien confirma */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Tu Firma de Confirmación</h4>
                <div className="grid grid-cols-2 gap-2 text-sm bg-green-50 p-3 rounded border border-green-200">
                  <div className="text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Confirmado por:
                  </div>
                  <div className="font-medium">{usuario.nombre}</div>

                  <div className="text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Correo:
                  </div>
                  <div className="font-medium text-xs">{usuario.correo}</div>

                  <div className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Fecha y hora:
                  </div>
                  <div className="font-medium">{new Date().toLocaleString()}</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center p-3 bg-amber-50 border border-amber-200 rounded">
                Al confirmar, esta información quedará registrada permanentemente en el sistema como evidencia de recepción
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmar} disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? 'Confirmando...' : 'Confirmar Recepción'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function ProductosBodega({ productos, usuario, sucursales }: Props) {
  if (productos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No hay productos pendientes de confirmación</p>
            <p className="text-sm">Cuando producción firme y envíe productos, aparecerán aquí para tu confirmación</p>
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
          <CardTitle>Productos Firmados por Producción</CardTitle>
          <CardDescription>
            Revisa y confirma la recepción de estos productos en bodega
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {productos.map((producto) => (
            <ItemProductoBodega key={producto.id} producto={producto} usuario={usuario} sucursales={sucursales} />
          ))}
        </CardContent>
      </Card>

      {/* Información del proceso */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Proceso de confirmación</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>1. Verifica físicamente que la cantidad sea correcta</div>
                <div>2. Confirma el turno de producción</div>
                <div>3. Presiona "Confirmar y Firmar" para registrar la recepción</div>
                <div className="mt-2 font-medium text-green-700">Tu firma quedará registrada como evidencia de recepción</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
