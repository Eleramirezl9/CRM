'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { NativeSelect } from '@/compartido/componentes/ui/native-select'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { crearEnvio } from '@/caracteristicas/envios/acciones'
import { obtenerSucursales } from '@/caracteristicas/inventario/acciones'
import { obtenerProductos } from '@/caracteristicas/productos/acciones'

export default function EnvioForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sucursales, setSucursales] = useState<any[]>([])
  const [productos, setProductos] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    sucursalOrigenId: '',
    sucursalDestinoId: '',
    items: [] as Array<{ productoId: string; cantidadSolicitada: number }>,
  })
  
  const [nuevoItem, setNuevoItem] = useState({
    productoId: '',
    cantidadSolicitada: 0,
  })
  
  useEffect(() => {
    obtenerSucursales().then(({ sucursales }) => setSucursales(sucursales))
    obtenerProductos().then(({ productos }) => setProductos(productos))
  }, [])
  
  const handleAgregarItem = () => {
    if (!nuevoItem.productoId || nuevoItem.cantidadSolicitada <= 0) {
      alert('Seleccione un producto y cantidad válida')
      return
    }
    
    // Verificar que no esté duplicado
    if (formData.items.some(i => i.productoId === nuevoItem.productoId)) {
      alert('Este producto ya fue agregado')
      return
    }
    
    setFormData({
      ...formData,
      items: [...formData.items, { ...nuevoItem }],
    })
    
    setNuevoItem({ productoId: '', cantidadSolicitada: 0 })
  }
  
  const handleEliminarItem = (productoId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(i => i.productoId !== productoId),
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    if (!formData.sucursalOrigenId || !formData.sucursalDestinoId) {
      setError('Seleccione sucursal origen y destino')
      setLoading(false)
      return
    }
    
    if (formData.items.length === 0) {
      setError('Agregue al menos un producto')
      setLoading(false)
      return
    }
    
    // Obtener empresaId de la primera sucursal (asumiendo que todas pertenecen a la misma empresa)
    const sucursal = sucursales.find(s => s.id === formData.sucursalOrigenId)
    
    const result = await crearEnvio({
      empresaId: sucursal?.empresaId || 'default',
      sucursalOrigenId: formData.sucursalOrigenId,
      sucursalDestinoId: formData.sucursalDestinoId,
      items: formData.items,
    })
    
    setLoading(false)
    
    if (result.success) {
      router.push('/dashboard/envios')
      router.refresh()
    } else {
      setError(result.error || 'Error al crear envío')
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Envío</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origen">Sucursal Origen *</Label>
              <NativeSelect
                id="origen"
                value={formData.sucursalOrigenId}
                onChange={(e) => setFormData({ ...formData, sucursalOrigenId: e.target.value })}
                required
              >
                <option value="">Seleccionar origen</option>
                {sucursales.map((suc) => (
                  <option key={suc.id} value={suc.id}>
                    {suc.nombre}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destino">Sucursal Destino *</Label>
              <NativeSelect
                id="destino"
                value={formData.sucursalDestinoId}
                onChange={(e) => setFormData({ ...formData, sucursalDestinoId: e.target.value })}
                required
              >
                <option value="">Seleccionar destino</option>
                {sucursales.map((suc) => (
                  <option key={suc.id} value={suc.id}>
                    {suc.nombre}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Productos a Enviar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <NativeSelect
                value={nuevoItem.productoId}
                onChange={(e) => setNuevoItem({ ...nuevoItem, productoId: e.target.value })}
              >
                <option value="">Seleccionar producto</option>
                {productos.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.nombre} ({prod.sku})
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="w-32">
              <Input
                type="number"
                min="1"
                placeholder="Cantidad"
                value={nuevoItem.cantidadSolicitada || ''}
                onChange={(e) => setNuevoItem({ ...nuevoItem, cantidadSolicitada: parseInt(e.target.value) || 0 })}
              />
            </div>
            <Button type="button" onClick={handleAgregarItem}>
              Agregar
            </Button>
          </div>
          
          {formData.items.length > 0 && (
            <div className="border rounded-lg divide-y">
              {formData.items.map((item) => {
                const producto = productos.find(p => p.id === item.productoId)
                return (
                  <div key={item.productoId} className="flex items-center justify-between p-3">
                    <div>
                      <div className="font-medium">{producto?.nombre}</div>
                      <div className="text-sm text-muted-foreground">SKU: {producto?.sku}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold">{item.cantidadSolicitada} unidades</div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleEliminarItem(item.productoId)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {formData.items.length === 0 && (
            <div className="text-center text-muted-foreground py-8 border rounded-lg border-dashed">
              No hay productos agregados
            </div>
          )}
        </CardContent>
      </Card>
      
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Envío'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
