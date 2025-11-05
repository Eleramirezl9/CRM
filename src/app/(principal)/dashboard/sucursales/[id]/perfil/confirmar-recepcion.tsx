'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { Badge } from '@/compartido/componentes/ui/badge'
import { confirmarRecepcionEnvio } from '@/caracteristicas/sucursales/acciones'
import { toast } from 'react-hot-toast'
import { CheckCircle, Package, Truck } from 'lucide-react'
import { Loader2 } from 'lucide-react'

interface ConfirmarRecepcionProps {
  sucursalId: string
  enviosPendientes: any[]
}

export default function ConfirmarRecepcion({ sucursalId, enviosPendientes }: ConfirmarRecepcionProps) {
  const [envioSeleccionado, setEnvioSeleccionado] = useState<string | null>(null)
  const [ajustes, setAjustes] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)

  const envio = enviosPendientes.find(e => e.id === envioSeleccionado)

  const handleCantidadChange = (productoId: string, cantidad: number) => {
    setAjustes(prev => ({
      ...prev,
      [productoId]: cantidad
    }))
  }

  const handleConfirmar = async () => {
    if (!envioSeleccionado || !envio) {
      toast.error('Selecciona un envío para confirmar')
      return
    }

    // Validar que todos los productos tengan cantidad
    const ajustesArray = envio.items.map((item: any) => ({
      productoId: item.productoId,
      cantidadRecibida: ajustes[item.productoId] || item.cantidadSolicitada
    }))

    setIsLoading(true)
    try {
      const result = await confirmarRecepcionEnvio(envioSeleccionado, ajustesArray)
      
      if (result.success) {
        toast.success('Recepción confirmada exitosamente')
        setEnvioSeleccionado(null)
        setAjustes({})
        // Recargar la página para actualizar datos
        window.location.reload()
      } else {
        toast.error(result.error || 'Error al confirmar recepción')
      }
    } catch (error) {
      console.error('Error al confirmar recepción:', error)
      toast.error('Error inesperado al confirmar recepción')
    } finally {
      setIsLoading(false)
    }
  }

  if (enviosPendientes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold mb-2">No hay envíos pendientes</h3>
          <p className="text-muted-foreground">
            Todos los envíos hacia esta sucursal han sido confirmados
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Lista de envíos pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Envíos Pendientes de Confirmación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {enviosPendientes.map((envio) => (
              <div
                key={envio.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  envioSeleccionado === envio.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setEnvioSeleccionado(envio.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-gray-500" />
                    <div>
                      <h4 className="font-semibold">Envío #{envio.id.slice(-6)}</h4>
                      <p className="text-sm text-muted-foreground">
                        Desde: {envio.sucursalOrigen.nombre}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {envio.items.length} producto{envio.items.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Creado: {new Date(envio.createdAt).toLocaleDateString()}</p>
                  {envio.fechaEnvio && (
                    <p>Enviado: {new Date(envio.fechaEnvio).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Formulario de confirmación */}
      {envio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Confirmar Recepción - Envío #{envio.id.slice(-6)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Desde:</strong> {envio.sucursalOrigen.nombre}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Enviado:</strong> {new Date(envio.fechaEnvio || envio.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Productos Enviados</h4>
                {envio.items.map((item: any) => (
                  <div key={item.productoId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="font-medium">{item.producto.nombre}</h5>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.producto.sku}
                        </p>
                      </div>
                      <Badge variant="outline">
                        Enviado: {item.cantidadSolicitada}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label htmlFor={`cantidad-${item.productoId}`}>
                          Cantidad Recibida
                        </Label>
                        <Input
                          id={`cantidad-${item.productoId}`}
                          type="number"
                          min="0"
                          max={item.cantidadSolicitada * 2} // Permitir hasta el doble por si hay extras
                          defaultValue={item.cantidadSolicitada}
                          onChange={(e) => handleCantidadChange(item.productoId, parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Precio: ${parseFloat(item.producto.precioVenta.toString()).toLocaleString()}</p>
                        <p>Valor: ${(parseFloat(item.producto.precioVenta.toString()) * (ajustes[item.productoId] || item.cantidadSolicitada)).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleConfirmar}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Recepción
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setEnvioSeleccionado(null)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
