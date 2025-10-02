'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { Select } from '@/compartido/componentes/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { registrarVenta } from '@/caracteristicas/ventas/acciones'
import { obtenerProductosDisponibles } from '@/caracteristicas/ventas/acciones'
import { obtenerSucursales } from '@/caracteristicas/inventario/acciones'

export default function VentasRegistro() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sucursales, setSucursales] = useState<any[]>([])
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
  
  useEffect(() => {
    obtenerSucursales().then(({ sucursales }) => setSucursales(sucursales))
  }, [])
  
  useEffect(() => {
    if (sucursalSeleccionada) {
      obtenerProductosDisponibles(sucursalSeleccionada).then(({ productos }) => {
        setProductos(productos)
      })
    }
  }, [sucursalSeleccionada])
  
  const agregarAlCarrito = (inventario: any) => {
    const yaExiste = carrito.find(item => item.productoId === inventario.producto.id)
    
    if (yaExiste) {
      setCarrito(carrito.map(item =>
        item.productoId === inventario.producto.id
          ? { ...item, cantidad: Math.min(item.cantidad + 1, item.stockDisponible) }
          : item
      ))
    } else {
      setCarrito([...carrito, {
        productoId: inventario.producto.id,
        nombre: inventario.producto.nombre,
        cantidad: 1,
        precioUnitario: parseFloat(inventario.producto.precioVenta.toString()),
        stockDisponible: inventario.cantidadActual,
      }])
    }
  }
  
  const actualizarCantidad = (productoId: string, cantidad: number) => {
    const item = carrito.find(i => i.productoId === productoId)
    if (!item) return
    
    const nuevaCantidad = Math.max(1, Math.min(cantidad, item.stockDisponible))
    
    setCarrito(carrito.map(i =>
      i.productoId === productoId ? { ...i, cantidad: nuevaCantidad } : i
    ))
  }
  
  const eliminarDelCarrito = (productoId: string) => {
    setCarrito(carrito.filter(item => item.productoId !== productoId))
  }
  
  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0)
  }
  
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
      metodoPago: 'efectivo',
    })
    
    setLoading(false)
    
    if (result.success) {
      setSuccess(true)
      setCarrito([])
      router.refresh()
      
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error || 'Error al registrar venta')
    }
  }
  
  const productosFiltrados = productos.filter(p =>
    p.producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.producto.sku.toLowerCase().includes(busqueda.toLowerCase())
  )
  
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
                  {productosFiltrados.map((inv) => (
                    <button
                      key={inv.producto.id}
                      type="button"
                      onClick={() => agregarAlCarrito(inv)}
                      className="p-3 border rounded-lg hover:bg-accent text-left transition-colors"
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
                {carrito.map((item) => (
                  <div key={item.productoId} className="flex items-center gap-2 p-2 border rounded">
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
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarDelCarrito(item.productoId)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                {carrito.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    Carrito vacío
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="text-2xl font-bold">${calcularTotal().toFixed(2)}</span>
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
