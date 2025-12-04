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
  Pen,
  Printer,
  Download
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
  const [observacionesProducto, setObservacionesProducto] = useState<Record<string, string>>({})
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
    // Limitar a máximo 999,999 unidades
    const cantidadLimitada = Math.min(Math.max(0, cantidad), 999999)
    setCantidades(prev => ({
      ...prev,
      [productoId]: cantidadLimitada
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
      cantidadRecibida: cantidades[item.productoId] ?? item.cantidadSolicitada,
      observaciones: observacionesProducto[item.productoId] || undefined
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
        setObservacionesProducto({})
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
    setObservacionesProducto({})
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

  const imprimirDocumento = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      {/* Lista de envios pendientes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Envíos Pendientes</span>
              <Badge variant="destructive" className="ml-1">
                {enviosPendientes.length}
              </Badge>
            </div>
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Selecciona un envío para confirmar su recepción
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {enviosPendientes.map((env) => (
              <div
                key={env.id}
                className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
                  envioSeleccionado === env.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 active:bg-gray-100'
                }`}
                onClick={() => seleccionarEnvio(env.id)}
              >
                {/* Vista móvil */}
                <div className="sm:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        envioSeleccionado === env.id ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Package className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm">#{env.id.slice(-6).toUpperCase()}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{env.sucursalOrigen.nombre}</span>
                        </p>
                      </div>
                    </div>
                    {envioSeleccionado === env.id && (
                      <div className="flex-shrink-0">
                        <div className="bg-blue-500 rounded-full p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(env.fechaEnvio || env.createdAt).toLocaleDateString('es', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {env.items.length} producto{env.items.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                {/* Vista desktop */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      envioSeleccionado === env.id ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Package className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Envío #{env.id.slice(-6).toUpperCase()}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {env.sucursalOrigen.nombre}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
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
                    {envioSeleccionado === env.id && (
                      <div className="bg-blue-500 rounded-full p-1.5">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documento de Recepcion tipo Factura */}
      {envio && (
        <Card className="border-2" id="documento-recepcion">
          <CardHeader className="bg-gray-50 border-b print:bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Documento de Recepción</span>
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Envío #{envio.id.slice(-6).toUpperCase()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-left sm:text-right flex-1 sm:flex-initial">
                  <p className="text-xs sm:text-sm font-medium">Fecha</p>
                  <p className="text-base sm:text-lg font-bold">
                    {new Date().toLocaleDateString('es', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date().toLocaleTimeString('es', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={imprimirDocumento}
                  className="print:hidden flex-shrink-0"
                >
                  <Printer className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Imprimir</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 print:p-6 print:font-mono">
            {/* Header del documento - Estilo factura estándar */}
            <div className="text-center border-b-2 border-black pb-4 mb-4">
              <h1 className="text-lg sm:text-xl font-bold mb-1">DOCUMENTO DE ENVIO</h1>
              <div className="text-xs sm:text-sm">#{envio.id.slice(0, 8).toUpperCase()}</div>
            </div>

            {/* Info del envío - Estilo factura */}
            <div className="space-y-2 mb-4 text-xs sm:text-sm">
              <div className="flex justify-between py-1">
                <span className="font-bold">Fecha:</span>
                <span>{new Date().toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-bold">Hora:</span>
                <span>{new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="border-t border-dashed pt-2 mt-2">
                <div className="flex justify-between py-1">
                  <span className="font-bold">Origen:</span>
                  <span className="text-right">{envio.sucursalOrigen.nombre}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-bold">Destino:</span>
                  <span className="text-right">{sucursalNombre}</span>
                </div>
              </div>
            </div>

            {/* Tabla de productos - Estilo factura */}
            <div className="border-t-2 border-b-2 border-black py-3 mb-4">
              <div className="grid grid-cols-[1fr_auto] gap-2 font-bold text-xs sm:text-sm mb-2 pb-2 border-b border-dashed">
                <div>PRODUCTO</div>
                <div className="text-center min-w-[60px]">CANT</div>
              </div>

              {/* Lista de productos con inputs - Interactivo */}
              <div className="space-y-2 print:hidden">
                {envio.items.map((item: any, idx: number) => {
                  const cantidadRecibida = cantidades[item.productoId] ?? item.cantidadSolicitada
                  const diferencia = cantidadRecibida - item.cantidadSolicitada
                  const tieneDiferencia = diferencia !== 0

                  return (
                    <div
                      key={item.productoId}
                      className={`py-3 px-2 rounded-lg border ${
                        tieneDiferencia
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {/* Nombre del producto */}
                      <div className="mb-2">
                        <div className="font-medium text-sm sm:text-base">{item.producto.nombre}</div>
                        {item.producto.sku && (
                          <div className="text-xs text-muted-foreground">SKU: {item.producto.sku}</div>
                        )}
                      </div>

                      {/* Grid: Enviado | Recibido */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Cantidad Enviada */}
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Enviado</label>
                          <div className="text-lg sm:text-xl font-bold text-gray-700">
                            {item.cantidadSolicitada}
                          </div>
                        </div>

                        {/* Cantidad Recibida - Input */}
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Recibido</label>
                          <Input
                            type="number"
                            min="0"
                            max="999999"
                            value={cantidadRecibida}
                            onChange={(e) => handleCantidadChange(
                              item.productoId,
                              parseInt(e.target.value) || 0
                            )}
                            className={`text-center text-base sm:text-lg font-bold h-10 w-full ${
                              tieneDiferencia ? 'border-amber-400 bg-white' : ''
                            }`}
                          />
                          {/* Botones rápidos */}
                          <div className="flex gap-1 mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleCantidadChange(item.productoId, item.cantidadSolicitada)}
                              className="flex-1 h-7 text-xs"
                            >
                              ✓ OK
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleCantidadChange(
                                item.productoId,
                                Math.max(0, cantidadRecibida - 1)
                              )}
                              className="h-7 w-8 text-xs p-0"
                            >
                              -1
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleCantidadChange(
                                item.productoId,
                                Math.min(999999, cantidadRecibida + 1)
                              )}
                              className="h-7 w-8 text-xs p-0"
                            >
                              +1
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleCantidadChange(item.productoId, 0)}
                              className="h-7 w-8 text-xs p-0"
                            >
                              0
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Indicador de diferencia */}
                      {tieneDiferencia && (
                        <div className="mt-2 pt-2 border-t border-amber-200">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-amber-700 font-medium">
                              {diferencia > 0 ? 'Sobrante' : 'Faltante'}
                            </span>
                            <Badge
                              variant={diferencia < 0 ? 'destructive' : 'default'}
                              className="text-xs"
                            >
                              {diferencia > 0 ? '+' : ''}{diferencia}
                            </Badge>
                          </div>

                          {/* Botones rápidos para observaciones comunes */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setObservacionesProducto(prev => ({
                                ...prev,
                                [item.productoId]: 'Producto dañado'
                              }))}
                              className="h-6 text-xs px-2"
                            >
                              Dañado
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setObservacionesProducto(prev => ({
                                ...prev,
                                [item.productoId]: 'No llegó completo'
                              }))}
                              className="h-6 text-xs px-2"
                            >
                              Incompleto
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setObservacionesProducto(prev => ({
                                ...prev,
                                [item.productoId]: 'Producto vencido'
                              }))}
                              className="h-6 text-xs px-2"
                            >
                              Vencido
                            </Button>
                          </div>

                          {/* Campo de observaciones */}
                          <Input
                            type="text"
                            placeholder="Escribe una observación..."
                            value={observacionesProducto[item.productoId] || ''}
                            onChange={(e) => setObservacionesProducto(prev => ({
                              ...prev,
                              [item.productoId]: e.target.value
                            }))}
                            className="text-xs h-8"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Lista para imprimir */}
              <div className="hidden print:block space-y-1">
                {envio.items.map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-[1fr_60px] gap-2 text-xs py-1">
                    <div className="truncate">{item.producto.nombre}</div>
                    <div className="text-center font-bold">{item.cantidadSolicitada}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales estilo ticket */}
            <div className="border-t-2 border-black pt-3 mt-3">
              <div className="text-xs sm:text-sm space-y-1">
                <div className="flex justify-between font-bold py-1">
                  <span>TOTAL PRODUCTOS:</span>
                  <span>{envio.items.length}</span>
                </div>
                <div className="flex justify-between font-bold py-1 print:hidden">
                  <span>TOTAL RECIBIDO:</span>
                  <span className="text-green-600">
                    {Object.keys(cantidades).length > 0
                      ? envio.items.reduce((sum: number, item: any) => {
                          const cantidadRecibida = cantidades[item.productoId] ?? item.cantidadSolicitada
                          return sum + cantidadRecibida
                        }, 0)
                      : envio.items.reduce((sum: number, item: any) => sum + item.cantidadSolicitada, 0)
                    }
                  </span>
                </div>
                <div className="hidden print:flex justify-between font-bold py-1">
                  <span>TOTAL UNIDADES:</span>
                  <span>{envio.items.reduce((sum: number, item: any) => sum + item.cantidadSolicitada, 0)}</span>
                </div>
              </div>
            </div>

            {/* Firmas estilo ticket - Solo para imprimir */}
            <div className="hidden print:block border-t border-dashed pt-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="border-b border-black mb-1 h-12"></div>
                  <div className="text-xs">Entrega</div>
                </div>
                <div className="text-center">
                  <div className="border-b border-black mb-1 h-12"></div>
                  <div className="text-xs">Recibe</div>
                </div>
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

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #documento-recepcion,
          #documento-recepcion * {
            visibility: visible;
          }
          #documento-recepcion {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  )
}
