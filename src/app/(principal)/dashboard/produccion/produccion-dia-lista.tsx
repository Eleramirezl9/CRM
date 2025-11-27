'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import { CheckCircle2, Package, Circle, Sun, Moon, Send, Edit2, User, Mail, Calendar, FileSignature } from 'lucide-react'
import { getTurnoLabel, type Turno } from '@/compartido/lib/turnos'
import { firmarProduccion, actualizarTurno } from '@/caracteristicas/produccion/acciones'
import { useState } from 'react'
import { NumeroFormateado } from '@/compartido/componentes/NumeroFormateado'
import { FechaFormateada } from '@/compartido/componentes/FechaFormateada'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/compartido/componentes/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/compartido/componentes/ui/select'

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
  usuario: {
    nombre: string
    correo: string
  }
}

// Función para formatear fecha UTC sin conversión de zona horaria
function formatearFechaUTC(fecha: Date): string {
  const dia = fecha.getUTCDate()
  const mes = fecha.getUTCMonth() + 1
  const anio = fecha.getUTCFullYear()
  return `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${anio}`
}

// Función para calcular la fecha según el turno (usando UTC para consistencia)
function calcularFechaSegunTurno(turno: Turno): Date {
  const ahora = new Date()
  const hora = ahora.getHours()

  // Crear fecha en UTC
  const hoy = new Date(Date.UTC(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
    0, 0, 0, 0
  ))

  if (turno === 'noche') {
    // Turno noche: la producción es para el día siguiente
    // Excepto si estamos en la madrugada (0:00 - 3:59), ya estamos en el día siguiente
    if (hora >= 4) {
      const manana = new Date(hoy)
      manana.setUTCDate(manana.getUTCDate() + 1)
      return manana
    }
    // Si hora < 4 (madrugada), ya estamos en el día del turno noche
    return hoy
  }
  // Turno mañana: fecha es hoy
  return hoy
}

function ItemProduccion({ produccion, usuario }: { produccion: Produccion, usuario: { nombre: string, correo: string } }) {
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [turnoEditando, setTurnoEditando] = useState(produccion.turno)

  // Calcular la fecha que se mostrará según el turno seleccionado
  const fechaMostrar = turnoEditando !== produccion.turno
    ? calcularFechaSegunTurno(turnoEditando)
    : new Date(produccion.fecha)

  const handleFirmar = async () => {
    setLoading(true)

    // Si el turno fue cambiado, actualizarlo primero
    if (turnoEditando !== produccion.turno) {
      const updateResult = await actualizarTurno(produccion.id, turnoEditando)
      if (!updateResult.success) {
        setLoading(false)
        alert(updateResult.error || 'Error al actualizar turno')
        return
      }
    }

    const result = await firmarProduccion(produccion.id)
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
    const result = await actualizarTurno(produccion.id, turnoEditando)
    setLoading(false)

    if (result.success) {
      window.location.reload()
    } else {
      alert(result.error || 'Error al actualizar turno')
    }
  }

  // Extraer el sufijo de las observaciones si existe (ej: "#2")
  const sufijo = produccion.observaciones?.match(/^#(\d+)/)
  const productoNombre = sufijo
    ? `${produccion.producto.nombre} ${sufijo[0]}`
    : produccion.producto.nombre

  return (
    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold flex items-center gap-2">
            {productoNombre}
            {sufijo && (
              <Badge variant="outline" className="text-xs">
                Adicional
              </Badge>
            )}
          </h3>
          <div className="text-sm text-muted-foreground mt-1">
            {produccion.cantidadContenedores} contenedores × {produccion.unidadesPorContenedor} unidades
          </div>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={produccion.turno === 'manana' ? 'default' : 'secondary'}
            className="flex items-center gap-1"
          >
            {produccion.turno === 'manana' ? (
              <Sun className="w-3 h-3" />
            ) : (
              <Moon className="w-3 h-3" />
            )}
            {getTurnoLabel(produccion.turno)}
          </Badge>
          <Badge variant={produccion.enviado ? 'default' : 'secondary'}>
            {produccion.enviado ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Firmado
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Circle className="w-3 h-3" />
                Pendiente
              </span>
            )}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="font-semibold text-lg text-primary">
          <NumeroFormateado valor={produccion.totalUnidades} /> {produccion.producto.unidadMedida || 'unidades'}
        </div>
      </div>

      {produccion.observaciones && (
        <div className="mt-2 text-sm text-muted-foreground italic border-l-2 pl-2">
          {produccion.observaciones}
        </div>
      )}

      {!produccion.enviado ? (
        <div className="mt-3 space-y-3">
          {/* Selector de turno editable */}
          <div className="flex items-center gap-2">
            <Select value={turnoEditando} onValueChange={(v: Turno) => setTurnoEditando(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manana">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    Mañana
                  </div>
                </SelectItem>
                <SelectItem value="noche">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Noche
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {turnoEditando !== produccion.turno && (
              <Button size="sm" onClick={handleActualizarTurno} disabled={loading}>
                <Edit2 className="w-3 h-3 mr-1" />
                Actualizar
              </Button>
            )}
          </div>

          {/* Botón de firma */}
          <Button
            onClick={() => setDialogOpen(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <FileSignature className="w-5 h-5 mr-2" />
            FIRMAR Y ENVIAR A BODEGA
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <span className="hidden" />
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
                    <div className="font-medium">{produccion.producto.nombre}</div>

                    <div className="text-muted-foreground">Total Unidades:</div>
                    <div className="font-medium">
                      <NumeroFormateado valor={produccion.totalUnidades} /> {produccion.producto.unidadMedida || 'unidades'}
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
                      {formatearFechaUTC(fechaMostrar)}
                      {turnoEditando !== produccion.turno && (
                        <span className="text-xs text-amber-600 ml-1">(nueva)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información de quien firma */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileSignature className="w-4 h-4" />
                    Tu Firma
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-green-50 p-3 rounded border border-green-200">
                    <div className="text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Firmado por:
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
                  Al firmar, esta producción será enviada a bodega y tus datos quedarán registrados como responsable
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleFirmar} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  {loading ? 'Firmando...' : 'Confirmar Firma'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        produccion.fechaFirma && (
          <div className="mt-3 text-xs text-muted-foreground border-t pt-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Firmado y enviado a bodega el <FechaFormateada fecha={produccion.fechaFirma} /></span>
          </div>
        )
      )}
    </div>
  )
}

export default function ProduccionDiaLista({ producciones, usuario }: Props) {

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
            <div className="text-2xl font-bold"><NumeroFormateado valor={totalProducido} /></div>
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
            <ItemProduccion key={produccion.id} produccion={produccion} usuario={usuario} />
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
