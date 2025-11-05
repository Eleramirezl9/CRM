'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { Select } from '@/compartido/componentes/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { registrarVenta } from '@/caracteristicas/ventas/acciones'
import { obtenerProductosDisponibles } from '@/caracteristicas/ventas/acciones'
import { useSucursales } from '@/compartido/hooks/useSucursales'
import { useDebounce } from '@/compartido/hooks/useDebounce'

export default function VentasRegistro() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { sucursales } = useSucursales()
  const [productos, setProductos] = useState<any[]>([])
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('')

  const [carrito, setCarrito] = useState<Array<{
    productoId: string
    nombre: string
    cantidad: number
    precioUnitario: number
    stockDisponible: number
  }>>([])

  const [busqueda, setBusqueda] = useState('')
  const busquedaDebounced = useDebounce(busqueda, 300)
  const [metodoPago, setMetodoPago] = useState('efectivo')

  useEffect(() => {
    if (sucursalSeleccionada) {
      obtenerProductosDisponibles(sucursalSeleccionada).then(({ productos }) => {
        setProductos(productos)
      })
    }
  }, [sucursalSeleccionada])
  
  const agregarAlCarrito = useCallback((inventario: any) => {
    setCarrito(prevCarrito => {
      const yaExiste = prevCarrito.find(item => item.productoId === inventario.producto.id)

      if (yaExiste) {
        return prevCarrito.map(item =>
          item.productoId === inventario.producto.id
            ? { ...item, cantidad: Math.min(item.cantidad + 1, item.stockDisponible) }
            : item
        )
      } else {
        return [...prevCarrito, {
          productoId: inventario.producto.id,
          nombre: inventario.producto.nombre,
          cantidad: 1,
          precioUnitario: parseFloat(inventario.producto.precioVenta.toString()),
          stockDisponible: inventario.cantidadActual,
        }]
      }
    })
  }, [])

  const actualizarCantidad = useCallback((productoId: string, cantidad: number) => {
    setCarrito(prevCarrito => {
      const item = prevCarrito.find(i => i.productoId === productoId)
      if (!item) return prevCarrito

      const nuevaCantidad = Math.max(1, Math.min(cantidad, item.stockDisponible))

      return prevCarrito.map(i =>
        i.productoId === productoId ? { ...i, cantidad: nuevaCantidad } : i
      )
    })
  }, [])

  const eliminarDelCarrito = useCallback((productoId: string) => {
    setCarrito(prevCarrito => prevCarrito.filter(item => item.productoId !== productoId))
  }, [])

  const total = useMemo(() => {
    return carrito.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0)
  }, [carrito])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sucursalSeleccionada) {
      setError('Seleccione una sucursal')
      return
    }
    
    if (carrito.length === 0) {
      setError('Agregue al menos un producto')
      return
    }
    
    setLoading(true)
    setError(null)
    
    const result = await registrarVenta({
      sucursalId: sucursalSeleccionada,
      items: carrito.map(item => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
      })),
      metodoPago: metodoPago,
    })
    
    setLoading(false)
    
    if (result.success) {
      setSuccess(true)
      setCarrito([])

      // Recargar productos de la sucursal después de registrar venta
      if (sucursalSeleccionada) {
        obtenerProductosDisponibles(sucursalSeleccionada).then(({ productos }) => {
          setProductos(productos)
        })
      }

      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error || 'Error al registrar venta')
    }
  }

  const productosFiltrados = useMemo(() => {
    return productos.filter(p =>
      p.producto.nombre.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
      p.producto.sku.toLowerCase().includes(busquedaDebounced.toLowerCase())
    )
  }, [productos, busquedaDebounced])
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Productos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sucursal</Label>
              <Select
                value={sucursalSeleccionada}
                onChange={(e) => setSucursalSeleccionada(e.target.value)}
              >
                <option value="">Seleccionar sucursal</option>
                {sucursales.map((suc) => (
                  <option key={suc.id} value={suc.id}>
                    {suc.nombre}
                  </option>
                ))}
              </Select>
            </div>
            
            {sucursalSeleccionada && (
              <>
                <div className="space-y-2">
                  <Label>Buscar Producto</Label>
                  <Input
                    placeholder="Nombre o SKU..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {productosFiltrados.map((inv, idx) => (
                    <button
                      key={inv.producto.id}
                      type="button"
                      onClick={() => agregarAlCarrito(inv)}
                      className="p-3 border rounded-lg hover:bg-accent text-left transition-colors"
                      data-testid={`agregar-producto-${idx + 1}`}
                    >
                      <div className="font-medium">{inv.producto.nombre}</div>
                      <div className="text-sm text-muted-foreground">
                        ${parseFloat(inv.producto.precioVenta.toString()).toFixed(2)}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        Stock: {inv.cantidadActual}
                      </Badge>
                    </button>
                  ))}
                  {productosFiltrados.length === 0 && (
                    <div className="col-span-2 text-center text-muted-foreground py-8">
                      No hay productos disponibles
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Carrito</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {carrito.map((item, idx) => (
                  <div
                    key={item.productoId}
                    className="flex items-center gap-2 p-2 border rounded"
                    data-testid={`item-carrito-${idx + 1}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        ${item.precioUnitario.toFixed(2)}
                      </div>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      max={item.stockDisponible}
                      value={item.cantidad}
                      onChange={(e) => actualizarCantidad(item.productoId, parseInt(e.target.value) || 1)}
                      className="w-16 h-8 text-center"
                      data-testid={`cantidad-${idx + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarDelCarrito(item.productoId)}
                      data-testid={`eliminar-item-${idx + 1}`}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                {carrito.length === 0 && (
                  <div
                    className="text-center text-muted-foreground py-8 text-sm"
                    data-testid="carrito-vacio"
                  >
                    Carrito vacío
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <div className="space-y-4 mb-4">
                  <div>
                    <Label>Método de Pago</Label>
                    <Select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      data-testid="metodo-pago"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </Select>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-2xl font-bold" data-testid="total-venta">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-2 bg-destructive/10 text-destructive rounded text-sm mb-2">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-2 bg-green-50 text-green-600 rounded text-sm mb-2">
                    ✓ Venta registrada exitosamente
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || carrito.length === 0}
                  data-testid="registrar-venta"
                >
                  {loading ? 'Procesando...' : 'Registrar Venta'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
