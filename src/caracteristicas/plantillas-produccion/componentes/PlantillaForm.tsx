'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { Textarea } from '@/compartido/componentes/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/compartido/componentes/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/compartido/componentes/ui/dialog'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Plus, X, Save, Package } from 'lucide-react'
import { crearPlantilla, editarPlantilla } from '../acciones'
import { obtenerProductos } from '@/caracteristicas/productos/acciones'
import { PlantillaConItems } from '../tipos'
import { toast } from 'sonner'

const DIAS_SEMANA = [
  { numero: 1, nombre: 'Lunes' },
  { numero: 2, nombre: 'Martes' },
  { numero: 3, nombre: 'Miércoles' },
  { numero: 4, nombre: 'Jueves' },
  { numero: 5, nombre: 'Viernes' },
  { numero: 6, nombre: 'Sábado' },
  { numero: 7, nombre: 'Domingo' }
]

type Producto = {
  id: string
  nombre: string
  unidadMedida: string | null
}

type ItemPlantilla = {
  productoId: string
  cantidadContenedores: number
  unidadesPorContenedor: number
  orden: number
}

interface PlantillaFormProps {
  plantilla?: PlantillaConItems
  onSuccess?: () => void
  onCancel?: () => void
}

export default function PlantillaForm({ plantilla, onSuccess, onCancel }: PlantillaFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])

  // Estado para el diálogo de agregar producto
  const [agregarDialogOpen, setAgregarDialogOpen] = useState(false)
  const [nuevoProductoId, setNuevoProductoId] = useState('')
  const [nuevoCantidadContenedores, setNuevoCantidadContenedores] = useState(1)
  const [nuevoUnidadesPorContenedor, setNuevoUnidadesPorContenedor] = useState(1)

  const [formData, setFormData] = useState({
    nombre: plantilla?.nombre || '',
    diaSemana: plantilla?.diaSemana || 1,
    descripcion: plantilla?.descripcion || '',
    color: plantilla?.color || '#3B82F6'
  })

  const [items, setItems] = useState<ItemPlantilla[]>(
    plantilla?.items.map((item, index) => ({
      productoId: item.productoId,
      cantidadContenedores: item.cantidadContenedores,
      unidadesPorContenedor: item.unidadesPorContenedor,
      orden: item.orden || index
    })) || []
  )

  useEffect(() => {
    async function cargarProductos() {
      const result = await obtenerProductos()
      if (result.success && result.productos) {
        setProductos(result.productos)
      }
    }
    cargarProductos()
  }, [])

  function abrirAgregarProducto() {
    if (productos.length === 0) {
      toast.error('No hay productos disponibles')
      return
    }

    // Buscar un producto que no esté ya agregado
    const productoDisponible = productos.find(
      p => !items.some(item => item.productoId === p.id)
    )

    if (!productoDisponible) {
      toast.error('Todos los productos ya están agregados')
      return
    }

    // Resetear valores y abrir diálogo
    setNuevoProductoId(productoDisponible.id)
    setNuevoCantidadContenedores(1)
    setNuevoUnidadesPorContenedor(1)
    setAgregarDialogOpen(true)
  }

  function confirmarAgregarProducto() {
    if (!nuevoProductoId) {
      toast.error('Debes seleccionar un producto')
      return
    }

    const producto = productos.find(p => p.id === nuevoProductoId)
    if (!producto) return

    setItems(prev => [
      ...prev,
      {
        productoId: producto.id,
        cantidadContenedores: nuevoCantidadContenedores,
        unidadesPorContenedor: nuevoUnidadesPorContenedor,
        orden: prev.length
      }
    ])

    setAgregarDialogOpen(false)
    toast.success(`${producto.nombre} agregado a la plantilla`)
  }

  function eliminarItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function actualizarItem(index: number, campo: keyof ItemPlantilla, valor: any) {
    setItems(prev => {
      const nuevos = [...prev]
      nuevos[index] = { ...nuevos[index], [campo]: valor }
      return nuevos
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (items.length === 0) {
      toast.error('Debes agregar al menos un producto')
      setLoading(false)
      return
    }

    const data = {
      ...(plantilla?.id && { id: plantilla.id }),
      ...formData,
      items
    }

    const result = plantilla?.id
      ? await editarPlantilla(data)
      : await crearPlantilla(data)

    setLoading(false)

    if (result.success) {
      toast.success(plantilla?.id ? 'Plantilla actualizada' : 'Plantilla creada exitosamente')
      if (onSuccess) {
        onSuccess()
      } else {
        // Si no hay callback, redirigir a producción
        router.push('/dashboard/produccion')
        router.refresh()
      }
    } else {
      toast.error(result.error || 'Error al guardar plantilla')
    }
  }

  const productoSeleccionado = (productoId: string) =>
    productos.find(p => p.id === productoId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información de la Plantilla</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Plantilla *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Lunes Panadería"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diaSemana">Día de la Semana *</Label>
              <Select
                value={formData.diaSemana.toString()}
                onValueChange={(val) => setFormData({ ...formData, diaSemana: parseInt(val) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map(dia => (
                    <SelectItem key={dia.numero} value={dia.numero.toString()}>
                      {dia.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Describe esta plantilla..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Productos en la Plantilla</CardTitle>
            <Button
              type="button"
              onClick={abrirAgregarProducto}
              size="sm"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay productos agregados</p>
              <p className="text-sm">Haz click en "Agregar Producto" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg bg-card">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label>Producto *</Label>
                        <Select
                          value={item.productoId}
                          onValueChange={(val) => actualizarItem(index, 'productoId', val)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {productos.map(producto => (
                              <SelectItem key={producto.id} value={producto.id}>
                                {producto.nombre}
                                {producto.unidadMedida && (
                                  <span className="text-muted-foreground ml-2">
                                    ({producto.unidadMedida})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Contenedores *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.cantidadContenedores}
                            onChange={(e) => actualizarItem(index, 'cantidadContenedores', parseInt(e.target.value) || 1)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Unidades/Contenedor *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.unidadesPorContenedor}
                            onChange={(e) => actualizarItem(index, 'unidadesPorContenedor', parseInt(e.target.value) || 1)}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Total: <strong>{(item.cantidadContenedores * item.unidadesPorContenedor).toLocaleString()}</strong> unidades
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarItem(index)}
                      className="shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="text-sm text-primary font-medium">
                  Total General: {items.reduce((sum, item) => sum + (item.cantidadContenedores * item.unidadesPorContenedor), 0).toLocaleString()} unidades
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Guardando...' : plantilla ? 'Actualizar Plantilla' : 'Crear Plantilla'}
        </Button>
      </div>

      {/* Diálogo para agregar nuevo producto */}
      <Dialog open={agregarDialogOpen} onOpenChange={setAgregarDialogOpen}>
        <DialogContent className="w-[90vw] sm:w-full max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              Agregar Producto
            </DialogTitle>
            <DialogDescription>
              Selecciona el producto y configura las cantidades
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Selector de producto */}
            <div>
              <Label htmlFor="nuevo-producto" className="text-sm">Producto *</Label>
              <Select
                value={nuevoProductoId}
                onValueChange={setNuevoProductoId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {productos
                    .filter(p => !items.some(item => item.productoId === p.id))
                    .map((producto) => (
                      <SelectItem key={producto.id} value={producto.id}>
                        {producto.nombre}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            {/* Cantidades */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="nuevo-contenedores" className="text-sm">
                  Contenedores
                </Label>
                <Input
                  id="nuevo-contenedores"
                  type="number"
                  min="1"
                  value={nuevoCantidadContenedores}
                  onChange={(e) => setNuevoCantidadContenedores(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="nuevo-unidades" className="text-sm">
                  Unid./Cont.
                </Label>
                <Input
                  id="nuevo-unidades"
                  type="number"
                  min="1"
                  value={nuevoUnidadesPorContenedor}
                  onChange={(e) => setNuevoUnidadesPorContenedor(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Total calculado */}
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-xl font-bold text-primary">
                {(nuevoCantidadContenedores * nuevoUnidadesPorContenedor).toLocaleString()} unidades
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {nuevoCantidadContenedores} × {nuevoUnidadesPorContenedor}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAgregarDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarAgregarProducto}
              disabled={!nuevoProductoId}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
