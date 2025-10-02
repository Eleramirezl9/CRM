'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { crearProducto, actualizarProducto } from '@/caracteristicas/productos/acciones'

type ProductoFormProps = {
  producto?: {
    id: string
    nombre: string
    descripcion: string | null
    costoUnitario: any
    precioVenta: any
    unidadMedida: string | null
  }
}

export default function ProductoForm({ producto }: ProductoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    costoUnitario: producto ? parseFloat(producto.costoUnitario.toString()) : 0,
    precioVenta: producto ? parseFloat(producto.precioVenta.toString()) : 0,
    unidadMedida: producto?.unidadMedida || 'unidad',
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido')
      setLoading(false)
      return
    }
    
    if (formData.costoUnitario <= 0) {
      setError('El costo debe ser mayor a 0')
      setLoading(false)
      return
    }
    
    if (formData.precioVenta <= 0) {
      setError('El precio de venta debe ser mayor a 0')
      setLoading(false)
      return
    }
    
    if (formData.precioVenta <= formData.costoUnitario) {
      setError('El precio de venta debe ser mayor al costo')
      setLoading(false)
      return
    }
    
    const result = producto
      ? await actualizarProducto(producto.id, formData)
      : await crearProducto(formData)
    
    setLoading(false)
    
    if (result.success) {
      router.push('/dashboard/productos')
      router.refresh()
    } else {
      setError(result.error || 'Error al guardar producto')
    }
  }
  
  const margen = formData.costoUnitario > 0
    ? (((formData.precioVenta - formData.costoUnitario) / formData.costoUnitario) * 100).toFixed(1)
    : '0'
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{producto ? 'Editar' : 'Crear'} Producto</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Producto *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Pan Francés"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción opcional"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costoUnitario">Costo Unitario *</Label>
              <Input
                id="costoUnitario"
                type="number"
                step="0.01"
                min="0"
                value={formData.costoUnitario}
                onChange={(e) => setFormData({ ...formData, costoUnitario: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="precioVenta">Precio de Venta *</Label>
              <Input
                id="precioVenta"
                type="number"
                step="0.01"
                min="0"
                value={formData.precioVenta}
                onChange={(e) => setFormData({ ...formData, precioVenta: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="unidadMedida">Unidad de Medida</Label>
            <Input
              id="unidadMedida"
              value={formData.unidadMedida}
              onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
              placeholder="Ej: unidad, kg, litro"
            />
          </div>
          
          {formData.costoUnitario > 0 && formData.precioVenta > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Margen de Ganancia</div>
              <div className="text-2xl font-bold">{margen}%</div>
              <div className="text-sm text-muted-foreground mt-1">
                Ganancia por unidad: ${(formData.precioVenta - formData.costoUnitario).toFixed(2)}
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : producto ? 'Actualizar' : 'Crear Producto'}
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
      </CardContent>
    </Card>
  )
}
