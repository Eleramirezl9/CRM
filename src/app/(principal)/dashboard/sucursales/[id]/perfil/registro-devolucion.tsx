'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { Select, SelectItem } from '@/compartido/componentes/ui/select'
import { Badge } from '@/compartido/componentes/ui/badge'
import { registrarDevolucion } from '@/caracteristicas/sucursales/acciones'
import { prisma } from '@/lib/prisma'
import { toast } from 'react-hot-toast'
import { AlertTriangle, Package, Trash2 } from 'lucide-react'
import { Loader2 } from 'lucide-react'

interface RegistroDevolucionProps {
  sucursalId: string
  operacionId: string | null
}

const MOTIVOS = [
  { value: 'vencido', label: 'Producto Vencido' },
  { value: 'dañado', label: 'Producto Dañado' },
  { value: 'no_vendido', label: 'No Se Vendió' },
  { value: 'otro', label: 'Otro Motivo' },
]

export default function RegistroDevolucion({ sucursalId, operacionId }: RegistroDevolucionProps) {
  const [productos, setProductos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProductos, setIsLoadingProductos] = useState(true)

  // Formulario
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')

  // Cargar productos con inventario
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await fetch(`/api/sucursales/${sucursalId}/inventario`)
        if (response.ok) {
          const data = await response.json()
          setProductos(data.productos || [])
        }
      } catch (error) {
        console.error('Error al cargar productos:', error)
      } finally {
        setIsLoadingProductos(false)
      }
    }

    cargarProductos()
  }, [sucursalId])

  const productoSeleccionado = productos.find(p => p.id === productoId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!operacionId) {
      toast.error('No hay operación activa para el día')
      return
    }

    if (!productoId || !cantidad || !motivo) {
      toast.error('Completa todos los campos')
      return
    }

    const cantidadNum = parseInt(cantidad)
    if (cantidadNum <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    if (productoSeleccionado && cantidadNum > productoSeleccionado.cantidadActual) {
      toast.error('La cantidad excede el stock disponible')
      return
    }

    setIsLoading(true)
    try {
      const result = await registrarDevolucion(
        operacionId,
        productoId,
        cantidadNum,
        motivo
      )

      if (result.success) {
        toast.success('Devolución registrada exitosamente')
        
        // Limpiar formulario
        setProductoId('')
        setCantidad('')
        setMotivo('')
        
        // Recargar productos para actualizar stock
        window.location.reload()
      } else {
        toast.error(result.error || 'Error al registrar devolución')
      }
    } catch (error) {
      console.error('Error al registrar devolución:', error)
      toast.error('Error inesperado al registrar devolución')
    } finally {
      setIsLoading(false)
    }
  }

  const calcularCostoTotal = () => {
    if (!productoSeleccionado || !cantidad) return 0
    return parseFloat(productoSeleccionado.producto.costoUnitario.toString()) * parseInt(cantidad)
  }

  return (
    <div className="space-y-6">
      {/* Información */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Registro de Devoluciones y Pérdidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700">
              <strong>Importante:</strong> Registra aquí los productos que no se pudieron vender 
              debido a vencimiento, daño u otros motivos. Esto afectará el cálculo de ganancias del día.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Nueva Devolución</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Producto */}
            <div className="space-y-2">
              <Label htmlFor="producto">Producto</Label>
              <Select id="producto" value={productoId} onValueChange={setProductoId}>
                {isLoadingProductos ? (
                  <SelectItem value="" disabled>
                    Cargando productos...
                  </SelectItem>
                ) : productos.length === 0 ? (
                  <SelectItem value="" disabled>
                    Seleccionar producto
                  </SelectItem>
                ) : (
                  <>
                    <SelectItem value="" disabled>
                      Seleccionar producto
                    </SelectItem>
                    {productos.map((item) => (
                      <SelectItem key={item.producto.id} value={item.producto.id}>
                        {item.producto.nombre} - Stock: {item.cantidadActual}
                      </SelectItem>
                    ))}
                  </>
                )}
              </Select>
            </div>

            {/* Información del producto seleccionado */}
            {productoSeleccionado && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{productoSeleccionado.producto.nombre}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">SKU:</p>
                    <p className="font-mono">{productoSeleccionado.producto.sku}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stock Disponible:</p>
                    <p className="font-semibold">{productoSeleccionado.cantidadActual} unidades</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Costo Unitario:</p>
                    <p>${parseFloat(productoSeleccionado.producto.costoUnitario.toString()).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Precio Venta:</p>
                    <p>${parseFloat(productoSeleccionado.producto.precioVenta.toString()).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cantidad */}
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad a Devolver</Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                max={productoSeleccionado?.cantidadActual || undefined}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Cantidad"
                disabled={!productoId}
              />
              {productoSeleccionado && (
                <p className="text-xs text-muted-foreground">
                  Máximo: {productoSeleccionado.cantidadActual} unidades
                </p>
              )}
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de la Devolución</Label>
              <Select id="motivo" value={motivo} onValueChange={setMotivo}>
                <SelectItem value="" disabled>
                  Seleccionar motivo
                </SelectItem>
                {MOTIVOS.map((motivo) => (
                  <SelectItem key={motivo.value} value={motivo.value}>
                    {motivo.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Resumen del costo */}
            {productoId && cantidad && motivo && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Resumen de Pérdida</h4>
                <div className="text-sm text-red-700">
                  <p><strong>Producto:</strong> {productoSeleccionado?.producto.nombre}</p>
                  <p><strong>Cantidad:</strong> {cantidad} unidades</p>
                  <p><strong>Motivo:</strong> {MOTIVOS.find(m => m.value === motivo)?.label}</p>
                  <p><strong>Costo Total de Pérdida:</strong> ${calcularCostoTotal().toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading || !productoId || !cantidad || !motivo}
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Trash2 className="mr-2 h-4 w-4" />
                Registrar Devolución
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setProductoId('')
                  setCantidad('')
                  setMotivo('')
                }}
                disabled={isLoading}
              >
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de productos en stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos en Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProductos ? (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Cargando productos...</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">No hay productos en inventario</p>
            </div>
          ) : (
            <div className="space-y-2">
              {productos.map((item) => (
                <div key={item.producto.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.producto.nombre}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.producto.sku}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={item.cantidadActual <= item.stockMinimo ? 'destructive' : 'secondary'}>
                      {item.cantidadActual} unidades
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Costo: ${parseFloat(item.producto.costoUnitario.toString()).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
