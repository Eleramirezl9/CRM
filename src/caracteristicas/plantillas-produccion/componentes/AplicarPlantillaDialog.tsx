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
import { Check, Package, Calculator, Plus, Trash2 } from 'lucide-react'
import { aplicarPlantilla } from '../acciones'
import { obtenerProductos } from '@/caracteristicas/productos/acciones'
import { PlantillaConItems } from '../tipos'
import { toast } from 'sonner'

type Producto = {
  id: string
  nombre: string
  unidadMedida: string | null
}

interface AplicarPlantillaDialogProps {
  plantilla: PlantillaConItems
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type ItemAjustado = {
  productoId: string
  productoNombre: string
  cantidadContenedores: number
  unidadesPorContenedor: number
  totalUnidades: number
  esNuevo?: boolean
}

export default function AplicarPlantillaDialog({
  plantilla,
  open,
  onOpenChange,
  onSuccess
}: AplicarPlantillaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])

  // Estado para el diálogo de agregar producto
  const [agregarDialogOpen, setAgregarDialogOpen] = useState(false)
  const [nuevoProductoId, setNuevoProductoId] = useState('')
  const [nuevoCantidadContenedores, setNuevoCantidadContenedores] = useState(1)
  const [nuevoUnidadesPorContenedor, setNuevoUnidadesPorContenedor] = useState(1)

  // Inicializar con los valores de la plantilla
  const [items, setItems] = useState<ItemAjustado[]>([])

  // Resetear items cuando cambia la plantilla o se abre el diálogo
  useEffect(() => {
    if (open && plantilla) {
      setItems(
        plantilla.items.map(item => ({
          productoId: item.productoId,
          productoNombre: item.producto.nombre,
          cantidadContenedores: item.cantidadContenedores,
          unidadesPorContenedor: item.unidadesPorContenedor,
          totalUnidades: item.cantidadContenedores * item.unidadesPorContenedor,
          esNuevo: false
        }))
      )
    }
  }, [open, plantilla])

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

  function actualizarItem(index: number, campo: 'cantidadContenedores' | 'unidadesPorContenedor', valor: number) {
    setItems(prev => {
      const nuevos = [...prev]
      nuevos[index] = {
        ...nuevos[index],
        [campo]: valor,
        totalUnidades: campo === 'cantidadContenedores'
          ? valor * nuevos[index].unidadesPorContenedor
          : nuevos[index].cantidadContenedores * valor
      }
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
        productoNombre: producto.nombre,
        cantidadContenedores: nuevoCantidadContenedores,
        unidadesPorContenedor: nuevoUnidadesPorContenedor,
        totalUnidades: nuevoCantidadContenedores * nuevoUnidadesPorContenedor,
        esNuevo: true
      }
    ])

    setAgregarDialogOpen(false)
    toast.success(`${producto.nombre} agregado`)
  }

  function eliminarItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  async function handleAplicar() {
    setLoading(true)

    // Preparar ajustes para enviar
    const ajustes = items.map(item => ({
      productoId: item.productoId,
      cantidadContenedores: item.cantidadContenedores,
      unidadesPorContenedor: item.unidadesPorContenedor
    }))

    const result = await aplicarPlantilla({
      plantillaId: plantilla.id,
      ajustes
    })

    setLoading(false)

    if (result.success) {
      toast.success(result.mensaje || 'Plantilla aplicada exitosamente', {
        description: `Se registraron ${items.length} productos`
      })
      onSuccess?.()
      onOpenChange(false)
    } else {
      toast.error(result.error || 'Error al aplicar plantilla')
    }
  }

  const totalGeneral = items.reduce((sum, item) => sum + item.totalUnidades, 0)

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
            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 shrink-0" />
            <span className="line-clamp-2">Revisar y Aplicar Plantilla</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Revisa y ajusta las cantidades antes de aplicar la plantilla "{plantilla.nombre}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 min-h-0">
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            {/* Resumen total */}
            <div className="p-3 sm:p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="text-sm sm:text-base font-medium text-primary">Total General</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {totalGeneral.toLocaleString()} unidades
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                {items.length} productos • Puedes ajustar las cantidades abajo
              </div>
            </div>

            {/* Botón para agregar productos */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Productos ({items.length})
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

            {/* Lista de productos editables */}
            <div className="space-y-2 sm:space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.productoId}
                  className="p-3 sm:p-4 border rounded-lg bg-card hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-2 mb-2 sm:mb-3">
                    <Package className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
                    <h3 className="font-medium flex-1 text-sm sm:text-base line-clamp-2">
                      {item.productoNombre}
                      {item.esNuevo && (
                        <Badge variant="outline" className="ml-2 text-xs text-green-600 border-green-600">
                          Nuevo
                        </Badge>
                      )}
                    </h3>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {item.totalUnidades.toLocaleString()} un.
                    </Badge>
                    {item.esNuevo && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarItem(index)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    )}
                  </div>

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
                        onChange={(e) => actualizarItem(index, 'cantidadContenedores', parseInt(e.target.value) || 1)}
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
                        onChange={(e) => actualizarItem(index, 'unidadesPorContenedor', parseInt(e.target.value) || 1)}
                        className="mt-1 h-9 sm:h-10"
                      />
                    </div>
                  </div>

                  <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                    {item.cantidadContenedores} × {item.unidadesPorContenedor} = {item.totalUnidades} unidades
                  </div>
                </div>
              ))}
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
              onClick={handleAplicar}
              disabled={loading}
              className="w-full sm:w-auto order-1 sm:order-2"
              size="lg"
            >
              {loading ? 'Aplicando...' : 'Aplicar Plantilla'}
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
