'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/compartido/componentes/ui/dialog'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { Badge } from '@/compartido/componentes/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/compartido/componentes/ui/select'
import { Pencil, Package, Plus, Trash2, Save } from 'lucide-react'
import { editarPlantilla } from '../acciones'
import { obtenerProductos } from '@/caracteristicas/productos/acciones'
import { PlantillaConItems } from '../tipos'
import { toast } from 'sonner'

interface EditarPlantillaDialogProps {
  plantilla: PlantillaConItems
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type ItemEditable = {
  id?: string
  productoId: string
  productoNombre: string
  cantidadContenedores: number
  unidadesPorContenedor: number
  orden: number
  eliminar?: boolean
}

type Producto = {
  id: string
  nombre: string
  unidadMedida: string | null
}

const DIAS_SEMANA = [
  { numero: 1, nombre: 'Lunes' },
  { numero: 2, nombre: 'Martes' },
  { numero: 3, nombre: 'Miércoles' },
  { numero: 4, nombre: 'Jueves' },
  { numero: 5, nombre: 'Viernes' },
  { numero: 6, nombre: 'Sábado' },
  { numero: 7, nombre: 'Domingo' }
]

export default function EditarPlantillaDialog({
  plantilla,
  open,
  onOpenChange,
  onSuccess
}: EditarPlantillaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [diaSemana, setDiaSemana] = useState(1)
  const [items, setItems] = useState<ItemEditable[]>([])
  const [productos, setProductos] = useState<Producto[]>([])

  // Estado para el diálogo de agregar producto
  const [agregarDialogOpen, setAgregarDialogOpen] = useState(false)
  const [nuevoProductoId, setNuevoProductoId] = useState('')
  const [nuevoCantidadContenedores, setNuevoCantidadContenedores] = useState(1)
  const [nuevoUnidadesPorContenedor, setNuevoUnidadesPorContenedor] = useState(1)

  // Cargar productos disponibles
  useEffect(() => {
    async function cargarProductos() {
      const result = await obtenerProductos()
      if (result.success && result.productos) {
        setProductos(result.productos)
      }
    }
    if (open) {
      cargarProductos()
    }
  }, [open])

  // Resetear todos los campos cuando cambia la plantilla o se abre el diálogo
  useEffect(() => {
    if (open && plantilla) {
      setNombre(plantilla.nombre)
      setDescripcion(plantilla.descripcion || '')
      setDiaSemana(plantilla.diaSemana)
      setItems(
        plantilla.items.map((item, index) => ({
          id: item.id,
          productoId: item.productoId,
          productoNombre: item.producto.nombre,
          cantidadContenedores: item.cantidadContenedores,
          unidadesPorContenedor: item.unidadesPorContenedor,
          orden: item.orden || index
        }))
      )
    }
  }, [open, plantilla])

  function actualizarItem(index: number, campo: keyof ItemEditable, valor: any) {
    setItems(prev => {
      const nuevos = [...prev]
      nuevos[index] = { ...nuevos[index], [campo]: valor }
      return nuevos
    })
  }

  function marcarParaEliminar(index: number) {
    setItems(prev => {
      const nuevos = [...prev]
      nuevos[index] = { ...nuevos[index], eliminar: true }
      return nuevos
    })
  }

  function restaurarItem(index: number) {
    setItems(prev => {
      const nuevos = [...prev]
      delete nuevos[index].eliminar
      return nuevos
    })
  }

  function abrirAgregarProducto() {
    if (productos.length === 0) {
      toast.error('No hay productos disponibles')
      return
    }

    // Buscar un producto que no esté ya agregado
    const productoDisponible = productos.find(
      p => !items.some(item => item.productoId === p.id && !item.eliminar)
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
        productoNombre: producto.nombre,
        cantidadContenedores: nuevoCantidadContenedores,
        unidadesPorContenedor: nuevoUnidadesPorContenedor,
        orden: prev.length
      }
    ])

    setAgregarDialogOpen(false)
    toast.success(`${producto.nombre} agregado a la plantilla`)
  }

  async function handleGuardar() {
    if (!nombre.trim()) {
      toast.error('El nombre de la plantilla es requerido')
      return
    }

    const itemsActivos = items.filter(item => !item.eliminar)
    if (itemsActivos.length === 0) {
      toast.error('Debe haber al menos un producto en la plantilla')
      return
    }

    setLoading(true)

    const result = await editarPlantilla({
      id: plantilla.id,
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      diaSemana,
      items: itemsActivos.map(item => ({
        id: item.id,
        productoId: item.productoId,
        cantidadContenedores: item.cantidadContenedores,
        unidadesPorContenedor: item.unidadesPorContenedor,
        orden: item.orden
      }))
    })

    setLoading(false)

    if (result.success) {
      toast.success('Plantilla actualizada exitosamente')
      onSuccess?.()
      onOpenChange(false)
    } else {
      toast.error(result.error || 'Error al actualizar plantilla')
    }
  }

  const itemsActivos = items.filter(item => !item.eliminar)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="
        w-[95vw] sm:w-full max-w-2xl
        max-h-[95vh] sm:max-h-[90vh]
        flex flex-col p-0 gap-0
        overflow-hidden
      ">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b shrink-0">
          <DialogTitle className="text-lg sm:text-2xl flex items-center gap-2">
            <Pencil className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span className="line-clamp-2">Editar Plantilla</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Modifica el nombre, día y productos de la plantilla
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 min-h-0">
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            {/* Información básica */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="nombre" className="text-sm">Nombre de la Plantilla *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Producción Lunes - Panadería"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="descripcion" className="text-sm">Descripción (opcional)</Label>
                <Input
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Productos de panadería para el lunes"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="diaSemana" className="text-sm">Día de la Semana *</Label>
                <select
                  id="diaSemana"
                  value={diaSemana}
                  onChange={(e) => setDiaSemana(parseInt(e.target.value))}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {DIAS_SEMANA.map(dia => (
                    <option key={dia.numero} value={dia.numero}>
                      {dia.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de productos editables */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Productos ({itemsActivos.length})
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={abrirAgregarProducto}
                  disabled={loading}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Agregar Producto</span>
                  <span className="sm:hidden">Agregar</span>
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No hay productos en esta plantilla
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className={`p-3 sm:p-4 border rounded-lg transition-all ${
                        item.eliminar
                          ? 'bg-red-50 border-red-200 opacity-60'
                          : 'bg-card hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-2 mb-2 sm:mb-3">
                        <Package className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
                        <div className="flex-1">
                          {!item.id ? (
                            // Selector para nuevos productos
                            <Select
                              value={item.productoId}
                              onValueChange={(value) => {
                                const producto = productos.find(p => p.id === value)
                                if (producto) {
                                  actualizarItem(index, 'productoId', value)
                                  actualizarItem(index, 'productoNombre', producto.nombre)
                                }
                              }}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecciona un producto" />
                              </SelectTrigger>
                              <SelectContent>
                                {productos.map((producto) => (
                                  <SelectItem key={producto.id} value={producto.id}>
                                    {producto.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            // Nombre fijo para productos existentes
                            <h3 className="font-medium text-sm sm:text-base line-clamp-2">
                              {item.productoNombre}
                              {item.eliminar && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  Se eliminará
                                </Badge>
                              )}
                            </h3>
                          )}
                        </div>
                        {item.eliminar ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => restaurarItem(index)}
                            className="h-8 px-2 text-green-600 hover:text-green-700"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="sr-only">Restaurar</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => marcarParaEliminar(index)}
                            className="h-8 px-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        )}
                      </div>

                      {!item.eliminar && (
                        <>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div>
                              <Label htmlFor={`contenedores-${index}`} className="text-xs">
                                Contenedores
                              </Label>
                              <Input
                                id={`contenedores-${index}`}
                                type="number"
                                min="1"
                                value={item.cantidadContenedores}
                                onChange={(e) =>
                                  actualizarItem(index, 'cantidadContenedores', parseInt(e.target.value) || 1)
                                }
                                className="mt-1 h-9 sm:h-10"
                              />
                            </div>

                            <div>
                              <Label htmlFor={`unidades-${index}`} className="text-xs">
                                Unid./Cont.
                              </Label>
                              <Input
                                id={`unidades-${index}`}
                                type="number"
                                min="1"
                                value={item.unidadesPorContenedor}
                                onChange={(e) =>
                                  actualizarItem(index, 'unidadesPorContenedor', parseInt(e.target.value) || 1)
                                }
                                className="mt-1 h-9 sm:h-10"
                              />
                            </div>
                          </div>

                          <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                            Total: {item.cantidadContenedores * item.unidadesPorContenedor} unidades
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-muted/30 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuardar}
              disabled={loading || itemsActivos.length === 0}
              className="w-full sm:w-auto order-1 sm:order-2"
              size="lg"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

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
                    .filter(p => !items.some(item => item.productoId === p.id && !item.eliminar))
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
            <div className="p-4 rounded-lg border border-primary/30">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Total</div>
              <div className="text-3xl font-bold text-primary mt-2">
                {(nuevoCantidadContenedores * nuevoUnidadesPorContenedor).toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 mt-2 font-medium">
                {nuevoCantidadContenedores} × {nuevoUnidadesPorContenedor} unidades
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
    </Dialog>
  )
}
