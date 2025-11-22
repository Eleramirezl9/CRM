'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Textarea } from '@/compartido/componentes/ui/textarea'
import { confirmarRecepcionEnvio, reportarDiferenciaEnvio } from '@/caracteristicas/sucursales/acciones'
import { toast } from 'react-hot-toast'
import {
  CheckCircle,
  Package,
  Truck,
  AlertTriangle,
  FileText,
  Calendar,
  MapPin,
  User,
  Loader2,
  Check,
  X,
  Pen
} from 'lucide-react'

interface DocumentoRecepcionProps {
  sucursalId: string
  sucursalNombre: string
  enviosPendientes: any[]
}

interface Diferencia {
  productoId: string
  productoNombre: string
  cantidadEsperada: number
  cantidadRecibida: number
  diferencia: number
  tipo: 'faltante' | 'sobrante'
}

export default function DocumentoRecepcion({
  sucursalId,
  sucursalNombre,
  enviosPendientes
}: DocumentoRecepcionProps) {
  const [envioSeleccionado, setEnvioSeleccionado] = useState<string | null>(null)
  const [cantidades, setCantidades] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [firmado, setFirmado] = useState(false)
  const [observaciones, setObservaciones] = useState('')
  const [mostrarDiferencias, setMostrarDiferencias] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const envio = enviosPendientes.find(e => e.id === envioSeleccionado)

  // Calcular diferencias
  const calcularDiferencias = (): Diferencia[] => {
    if (!envio) return []

    const diferencias: Diferencia[] = []

    for (const item of envio.items) {
      const cantidadEsperada = item.cantidadSolicitada
      const cantidadRecibida = cantidades[item.productoId] ?? cantidadEsperada
      const dif = cantidadRecibida - cantidadEsperada

      if (dif !== 0) {
        diferencias.push({
          productoId: item.productoId,
          productoNombre: item.producto.nombre,
          cantidadEsperada,
          cantidadRecibida,
          diferencia: Math.abs(dif),
          tipo: dif < 0 ? 'faltante' : 'sobrante'
        })
      }
    }

    return diferencias
  }

  const diferencias = calcularDiferencias()
  const hayDiferencias = diferencias.length > 0

  // Funciones del canvas para firma
  const iniciarDibujo = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const dibujar = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y

    if ('touches' in e) {
      e.preventDefault()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const finalizarDibujo = () => {
    setIsDrawing(false)
  }

  const limpiarFirma = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setFirmado(false)
  }

  const confirmarFirma = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Verificar si hay algo dibujado
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    let isEmpty = true

    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        isEmpty = false
        break
      }
    }

    if (isEmpty) {
      toast.error('Por favor, dibuje su firma')
      return
    }

    setFirmado(true)
    toast.success('Firma registrada')
  }

  const handleCantidadChange = (productoId: string, cantidad: number) => {
    setCantidades(prev => ({
      ...prev,
      [productoId]: cantidad
    }))
  }

  const handleConfirmarRecepcion = async () => {
    if (!envioSeleccionado || !envio) {
      toast.error('Selecciona un envio para confirmar')
      return
    }

    if (!firmado) {
      toast.error('Debe firmar el documento antes de confirmar')
      return
    }

    const ajustesArray = envio.items.map((item: any) => ({
      productoId: item.productoId,
      cantidadRecibida: cantidades[item.productoId] ?? item.cantidadSolicitada
    }))

    setIsLoading(true)
    try {
      // Si hay diferencias, reportarlas primero
      if (hayDiferencias) {
        const resultDiferencias = await reportarDiferenciaEnvio(
          envioSeleccionado,
          diferencias,
          observaciones
        )

        if (!resultDiferencias.success) {
          toast.error(resultDiferencias.error || 'Error al reportar diferencias')
          setIsLoading(false)
          return
        }
      }

      const result = await confirmarRecepcionEnvio(envioSeleccionado, ajustesArray)

      if (result.success) {
        toast.success('Recepcion confirmada exitosamente')
        setEnvioSeleccionado(null)
        setCantidades({})
        setFirmado(false)
        setObservaciones('')
        limpiarFirma()
        window.location.reload()
      } else {
        toast.error(result.error || 'Error al confirmar recepcion')
      }
    } catch (error) {
      console.error('Error al confirmar recepcion:', error)
      toast.error('Error inesperado al confirmar recepcion')
    } finally {
      setIsLoading(false)
    }
  }

  const seleccionarEnvio = (envioId: string) => {
    setEnvioSeleccionado(envioId)
    setCantidades({})
    setFirmado(false)
    setObservaciones('')
    setMostrarDiferencias(false)
    limpiarFirma()
  }

  if (enviosPendientes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Sin envios pendientes</h3>
          <p className="text-muted-foreground">
            Todos los envios hacia esta sucursal han sido confirmados
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calcular totales del envio seleccionado
  const calcularTotales = () => {
    if (!envio) return { unidades: 0, valor: 0 }

    let unidades = 0
    let valor = 0

    for (const item of envio.items) {
      const cantidad = cantidades[item.productoId] ?? item.cantidadSolicitada
      unidades += cantidad
      valor += parseFloat(item.producto.precioVenta.toString()) * cantidad
    }

    return { unidades, valor }
  }

  const totales = calcularTotales()

  return (
    <div className="space-y-4">
      {/* Lista de envios pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Envios Pendientes de Confirmacion
            <Badge variant="secondary" className="ml-2">
              {enviosPendientes.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {enviosPendientes.map((env) => (
              <div
                key={env.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  envioSeleccionado === env.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
                onClick={() => seleccionarEnvio(env.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      envioSeleccionado === env.id ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Package className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Envio #{env.id.slice(-6).toUpperCase()}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {env.sucursalOrigen.nombre}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {env.items.length} producto{env.items.length > 1 ? 's' : ''}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(env.fechaEnvio || env.createdAt).toLocaleDateString('es', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documento de Recepcion tipo Factura */}
      {envio && (
        <Card className="border-2">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-6 w-6" />
                  Documento de Recepcion
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Envio #{envio.id.slice(-6).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Fecha</p>
                <p className="text-lg font-bold">
                  {new Date().toLocaleDateString('es', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Informacion del envio */}
            <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm text-blue-700 mb-2">ORIGEN</h4>
                <p className="font-medium">{envio.sucursalOrigen.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {envio.sucursalOrigen.direccion || 'Sin direccion'}
                </p>
                {envio.creador && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {envio.creador.nombre}
                  </p>
                )}
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm text-green-700 mb-2">DESTINO</h4>
                <p className="font-medium">{sucursalNombre}</p>
                <p className="text-sm text-muted-foreground">Sucursal receptora</p>
              </div>
            </div>

            {/* Tabla de productos */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Detalle de Productos
              </h4>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Producto</th>
                      <th className="text-center p-3 text-sm font-medium w-24">Enviado</th>
                      <th className="text-center p-3 text-sm font-medium w-32">Recibido</th>
                      <th className="text-right p-3 text-sm font-medium w-28">P. Unit</th>
                      <th className="text-right p-3 text-sm font-medium w-28">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {envio.items.map((item: any, index: number) => {
                      const cantidadRecibida = cantidades[item.productoId] ?? item.cantidadSolicitada
                      const diferencia = cantidadRecibida - item.cantidadSolicitada
                      const subtotal = parseFloat(item.producto.precioVenta.toString()) * cantidadRecibida

                      return (
                        <tr
                          key={item.productoId}
                          className={`border-t ${
                            diferencia !== 0 ? 'bg-yellow-50' : ''
                          }`}
                        >
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{item.producto.nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                SKU: {item.producto.sku}
                              </p>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-medium">{item.cantidadSolicitada}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                className="w-20 text-center"
                                value={cantidadRecibida}
                                onChange={(e) => handleCantidadChange(
                                  item.productoId,
                                  parseInt(e.target.value) || 0
                                )}
                              />
                              {diferencia !== 0 && (
                                <Badge
                                  variant={diferencia < 0 ? 'destructive' : 'default'}
                                  className="text-xs"
                                >
                                  {diferencia > 0 ? '+' : ''}{diferencia}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            ${parseFloat(item.producto.precioVenta.toString()).toLocaleString('es')}
                          </td>
                          <td className="p-3 text-right font-medium">
                            ${subtotal.toLocaleString('es')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2">
                    <tr>
                      <td colSpan={2} className="p-3 text-right font-semibold">
                        TOTALES:
                      </td>
                      <td className="p-3 text-center font-bold">
                        {totales.unidades} uds
                      </td>
                      <td className="p-3"></td>
                      <td className="p-3 text-right font-bold text-lg">
                        ${totales.valor.toLocaleString('es')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Alerta de diferencias */}
            {hayDiferencias && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-800">
                      Diferencias Detectadas
                    </h4>
                    <p className="text-sm text-amber-700 mb-3">
                      Se notificara a bodega y al repartidor sobre las siguientes diferencias:
                    </p>
                    <div className="space-y-2">
                      {diferencias.map((dif) => (
                        <div
                          key={dif.productoId}
                          className="flex items-center justify-between text-sm bg-white p-2 rounded"
                        >
                          <span>{dif.productoNombre}</span>
                          <Badge variant={dif.tipo === 'faltante' ? 'destructive' : 'secondary'}>
                            {dif.tipo === 'faltante' ? '-' : '+'}{dif.diferencia} ({dif.tipo})
                          </Badge>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3">
                      <Label htmlFor="observaciones" className="text-amber-800">
                        Observaciones (opcional)
                      </Label>
                      <Textarea
                        id="observaciones"
                        placeholder="Agregue notas adicionales sobre las diferencias..."
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="mt-1 bg-white"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Seccion de firma */}
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Pen className="h-4 w-4" />
                Firma de Conformidad
              </h4>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Firme en el recuadro para confirmar la recepcion
                  </p>
                  <div className="border-2 border-dashed rounded-lg p-1 bg-white">
                    <canvas
                      ref={canvasRef}
                      width={300}
                      height={150}
                      className="w-full cursor-crosshair touch-none"
                      onMouseDown={iniciarDibujo}
                      onMouseMove={dibujar}
                      onMouseUp={finalizarDibujo}
                      onMouseLeave={finalizarDibujo}
                      onTouchStart={iniciarDibujo}
                      onTouchMove={dibujar}
                      onTouchEnd={finalizarDibujo}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={limpiarFirma}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Limpiar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={confirmarFirma}
                      disabled={firmado}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {firmado ? 'Firmado' : 'Confirmar Firma'}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">Al firmar, confirmo que:</p>
                    <ul className="space-y-1 list-disc pl-4">
                      <li>He revisado todos los productos recibidos</li>
                      <li>Las cantidades indicadas son correctas</li>
                      {hayDiferencias && (
                        <li className="text-amber-600">
                          Las diferencias seran reportadas automaticamente
                        </li>
                      )}
                    </ul>
                  </div>

                  {firmado && (
                    <div className="flex items-center gap-2 text-green-600 mt-4">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Documento firmado</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de accion */}
            <div className="flex gap-3 pt-6 border-t mt-6">
              <Button
                onClick={handleConfirmarRecepcion}
                disabled={isLoading || !firmado}
                className="flex-1"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar Recepcion
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setEnvioSeleccionado(null)
                  setCantidades({})
                  setFirmado(false)
                  limpiarFirma()
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
