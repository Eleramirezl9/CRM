'use client'

import { useState } from 'react'
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
import { Check, Package, Calculator } from 'lucide-react'
import { aplicarPlantilla } from '../acciones'
import { PlantillaConItems } from '../tipos'
import { toast } from 'sonner'

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
}

export default function AplicarPlantillaDialog({
  plantilla,
  open,
  onOpenChange,
  onSuccess
}: AplicarPlantillaDialogProps) {
  const [loading, setLoading] = useState(false)

  // Inicializar con los valores de la plantilla
  const [items, setItems] = useState<ItemAjustado[]>(() =>
    plantilla.items.map(item => ({
      productoId: item.productoId,
      productoNombre: item.producto.nombre,
      cantidadContenedores: item.cantidadContenedores,
      unidadesPorContenedor: item.unidadesPorContenedor,
      totalUnidades: item.cantidadContenedores * item.unidadesPorContenedor
    }))
  )

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
      <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 w-[95vw] sm:w-full">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
          <DialogTitle className="text-lg sm:text-2xl flex items-center gap-2">
            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 shrink-0" />
            <span className="line-clamp-2">Revisar y Aplicar Plantilla</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Revisa y ajusta las cantidades antes de aplicar la plantilla "{plantilla.nombre}"
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 sm:px-6 overflow-auto">
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
                    </h3>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {item.totalUnidades.toLocaleString()} un.
                    </Badge>
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
    </Dialog>
  )
}
