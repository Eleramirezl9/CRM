'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/compartido/componentes/ui/card'
import { Textarea } from '@/compartido/componentes/ui/textarea'
import { registrarProduccion } from '@/caracteristicas/produccion/acciones'
import { obtenerProductos } from '@/caracteristicas/productos/acciones'
import { Package, Calculator } from 'lucide-react'

type Producto = {
  id: string
  nombre: string
  unidadMedida: string | null
}

export default function ProduccionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    productoId: '',
    cantidadContenedores: 0,
    unidadesPorContenedor: 0,
    observaciones: '',
  })

  // Cargar productos
  useEffect(() => {
    async function cargarProductos() {
      const result = await obtenerProductos()
      if (result.success && result.productos) {
        setProductos(result.productos)
      }
    }
    cargarProductos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Validaciones
    if (!formData.productoId) {
      setError('Debes seleccionar un producto')
      setLoading(false)
      return
    }

    if (formData.cantidadContenedores <= 0) {
      setError('La cantidad de contenedores debe ser mayor a 0')
      setLoading(false)
      return
    }

    if (formData.unidadesPorContenedor <= 0) {
      setError('Las unidades por contenedor deben ser mayor a 0')
      setLoading(false)
      return
    }

    const result = await registrarProduccion(formData)

    setLoading(false)

    if (result.success) {
      setSuccess(true)
      // Limpiar formulario
      setFormData({
        productoId: '',
        cantidadContenedores: 0,
        unidadesPorContenedor: 0,
        observaciones: '',
      })

      // Callback de éxito
      if (onSuccess) {
        onSuccess()
      }

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error || 'Error al registrar producción')
    }
  }

  const totalUnidades = formData.cantidadContenedores * formData.unidadesPorContenedor
  const productoSeleccionado = productos.find(p => p.id === formData.productoId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Registrar Producción del Día
        </CardTitle>
        <CardDescription>
          Registra de forma simple lo que produciste hoy. Ejemplo: Francés 100 latas, 24 panes por lata.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="producto">¿Qué producto hiciste? *</Label>
            <select
              id="producto"
              value={formData.productoId}
              onChange={(e) => setFormData({ ...formData, productoId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Selecciona el producto</option>
              {productos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cantidadContenedores">
                ¿Cuántos contenedores? *
              </Label>
              <div className="text-xs text-muted-foreground mb-1">
                Ej: 100 latas, 50 bandejas
              </div>
              <Input
                id="cantidadContenedores"
                type="number"
                min="1"
                value={formData.cantidadContenedores || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  cantidadContenedores: parseInt(e.target.value) || 0
                })}
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidadesPorContenedor">
                ¿Cuántas unidades por contenedor? *
              </Label>
              <div className="text-xs text-muted-foreground mb-1">
                Ej: 24 panes por lata
              </div>
              <Input
                id="unidadesPorContenedor"
                type="number"
                min="1"
                value={formData.unidadesPorContenedor || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  unidadesPorContenedor: parseInt(e.target.value) || 0
                })}
                placeholder="24"
              />
            </div>
          </div>

          {totalUnidades > 0 && (
            <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Total Calculado</span>
              </div>
              <div className="text-3xl font-bold text-primary">
                {totalUnidades.toLocaleString()} {productoSeleccionado?.unidadMedida || 'unidades'}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {formData.cantidadContenedores} contenedores × {formData.unidadesPorContenedor} unidades
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones (opcional)</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Alguna nota o comentario adicional..."
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 text-green-600 rounded-md text-sm">
              ✓ Producción registrada exitosamente! Bodega podrá ver este producto disponible.
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? 'Guardando...' : 'Registrar Producción'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
