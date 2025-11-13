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
import { ScrollArea } from '@/compartido/componentes/ui/scroll-area'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Pencil, Package, Plus, Trash2, Save } from 'lucide-react'
import { editarPlantilla } from '../acciones'
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
  const [nombre, setNombre] = useState(plantilla.nombre)
  const [descripcion, setDescripcion] = useState(plantilla.descripcion || '')
  const [diaSemana, setDiaSemana] = useState(plantilla.diaSemana)
  const [items, setItems] = useState<ItemEditable[]>([])

  // Inicializar items cuando cambia la plantilla
  useEffect(() => {
    if (plantilla) {
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
  }, [plantilla])

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
      <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 w-[95vw] sm:w-full">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
          <DialogTitle className="text-lg sm:text-2xl flex items-center gap-2">
            <Pencil className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span className="line-clamp-2">Editar Plantilla</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Modifica el nombre, día y productos de la plantilla
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 sm:px-6 overflow-auto">
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
                        <h3 className="font-medium flex-1 text-sm sm:text-base line-clamp-2">
                          {item.productoNombre}
                          {item.eliminar && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Se eliminará
                            </Badge>
                          )}
                        </h3>
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
        </ScrollArea>

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
    </Dialog>
  )
}
