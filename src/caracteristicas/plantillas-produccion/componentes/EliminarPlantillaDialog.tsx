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
import { Badge } from '@/compartido/componentes/ui/badge'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { eliminarPlantilla } from '../acciones'
import { PlantillaConItems } from '../tipos'
import { toast } from 'sonner'

interface EliminarPlantillaDialogProps {
  plantilla: PlantillaConItems
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const DIAS_SEMANA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function EliminarPlantillaDialog({
  plantilla,
  open,
  onOpenChange,
  onSuccess
}: EliminarPlantillaDialogProps) {
  const [loading, setLoading] = useState(false)

  async function handleEliminar() {
    setLoading(true)

    const result = await eliminarPlantilla(plantilla.id)

    setLoading(false)

    if (result.success) {
      toast.success('Plantilla eliminada exitosamente')
      onSuccess?.()
      onOpenChange(false)
    } else {
      toast.error(result.error || 'Error al eliminar plantilla')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="line-clamp-2">Eliminar Plantilla</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Esta acción no se puede deshacer
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 mb-3">
              ¿Estás seguro de que deseas eliminar la siguiente plantilla?
            </p>

            <div className="space-y-2 bg-white rounded p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{plantilla.nombre}</p>
                  {plantilla.descripcion && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {plantilla.descripcion}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {DIAS_SEMANA[plantilla.diaSemana]}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{plantilla.items.length} productos</span>
              </div>
            </div>

            <p className="text-xs text-red-700 mt-3">
              <strong>Nota:</strong> Esta plantilla se eliminará permanentemente.
              Las producciones ya registradas con esta plantilla no se verán afectadas.
            </p>
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
              onClick={handleEliminar}
              disabled={loading}
              variant="destructive"
              className="w-full sm:w-auto order-1 sm:order-2"
              size="lg"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {loading ? 'Eliminando...' : 'Eliminar Plantilla'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
