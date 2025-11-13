'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/compartido/componentes/ui/card'
import { Button } from '@/compartido/componentes/ui/button'
import { Badge } from '@/compartido/componentes/ui/badge'
import { ChevronLeft, ChevronRight, Calendar, Zap, Sparkles, Pencil, Trash2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/compartido/componentes/ui/dropdown-menu'
import { obtenerPlantillasPorDia } from '../acciones'
import { PlantillaConItems } from '../tipos'
import AplicarPlantillaDialog from './AplicarPlantillaDialog'
import EditarPlantillaDialog from './EditarPlantillaDialog'
import EliminarPlantillaDialog from './EliminarPlantillaDialog'
import { useSwipeable } from 'react-swipeable'

const DIAS_SEMANA = [
  { numero: 1, nombre: 'Lunes', color: 'bg-blue-500', textColor: 'text-blue-500', borderColor: 'border-blue-500' },
  { numero: 2, nombre: 'Martes', color: 'bg-green-500', textColor: 'text-green-500', borderColor: 'border-green-500' },
  { numero: 3, nombre: 'Miércoles', color: 'bg-yellow-500', textColor: 'text-yellow-500', borderColor: 'border-yellow-500' },
  { numero: 4, nombre: 'Jueves', color: 'bg-orange-500', textColor: 'text-orange-500', borderColor: 'border-orange-500' },
  { numero: 5, nombre: 'Viernes', color: 'bg-purple-500', textColor: 'text-purple-500', borderColor: 'border-purple-500' },
  { numero: 6, nombre: 'Sábado', color: 'bg-pink-500', textColor: 'text-pink-500', borderColor: 'border-pink-500' },
  { numero: 7, nombre: 'Domingo', color: 'bg-red-500', textColor: 'text-red-500', borderColor: 'border-red-500' }
]

interface PlantillasSelectorProps {
  onPlantillaAplicada?: () => void
}

export default function PlantillasSelector({ onPlantillaAplicada }: PlantillasSelectorProps) {
  const router = useRouter()

  // Detectar día actual (1=Lunes, 7=Domingo)
  const obtenerDiaActual = () => {
    const dia = new Date().getDay()
    return dia === 0 ? 7 : dia // Convertir Domingo (0) a 7
  }

  const [diaSeleccionado, setDiaSeleccionado] = useState(obtenerDiaActual())
  const [plantillas, setPlantillas] = useState<PlantillaConItems[]>([])
  const [loading, setLoading] = useState(false)
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaConItems | null>(null)
  const [mostrarDialog, setMostrarDialog] = useState(false)
  const [mostrarEditarDialog, setMostrarEditarDialog] = useState(false)
  const [mostrarEliminarDialog, setMostrarEliminarDialog] = useState(false)

  useEffect(() => {
    cargarPlantillas(diaSeleccionado)
  }, [diaSeleccionado])

  async function cargarPlantillas(dia: number) {
    setLoading(true)
    const result = await obtenerPlantillasPorDia(dia)
    if (result.success) {
      setPlantillas(result.plantillas)
    }
    setLoading(false)
  }

  function cambiarDia(delta: number) {
    setDiaSeleccionado(prev => {
      let nuevo = prev + delta
      if (nuevo < 1) nuevo = 7
      if (nuevo > 7) nuevo = 1
      return nuevo
    })
  }

  function handleAbrirDialog(plantilla: PlantillaConItems) {
    setPlantillaSeleccionada(plantilla)
    setMostrarDialog(true)
  }

  function handlePlantillaAplicada() {
    setMostrarDialog(false)
    setPlantillaSeleccionada(null)
    router.refresh() // Revalidar la página para mostrar los nuevos datos
    onPlantillaAplicada?.()
  }

  function handleAbrirEditar(plantilla: PlantillaConItems) {
    setPlantillaSeleccionada(plantilla)
    setMostrarEditarDialog(true)
  }

  function handleAbrirEliminar(plantilla: PlantillaConItems) {
    setPlantillaSeleccionada(plantilla)
    setMostrarEliminarDialog(true)
  }

  function handlePlantillaEditada() {
    setMostrarEditarDialog(false)
    setPlantillaSeleccionada(null)
    cargarPlantillas(diaSeleccionado)
    router.refresh()
  }

  function handlePlantillaEliminada() {
    setMostrarEliminarDialog(false)
    setPlantillaSeleccionada(null)
    cargarPlantillas(diaSeleccionado)
    router.refresh()
  }

  // Configurar swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => cambiarDia(1),
    onSwipedRight: () => cambiarDia(-1),
    preventScrollOnSwipe: true,
    trackMouse: false
  })

  const diaInfo = DIAS_SEMANA.find(d => d.numero === diaSeleccionado)
  const esHoy = diaSeleccionado === obtenerDiaActual()

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 shrink-0" />
                <span className="truncate">Plantillas Rápidas</span>
              </CardTitle>
              <CardDescription className="mt-1 text-xs sm:text-sm">
                Aplica plantillas para registrar más rápido
              </CardDescription>
            </div>
            {esHoy && (
              <Badge variant="default" className="hidden sm:flex shrink-0">
                Hoy
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          {/* Selector de días deslizable */}
          <div className="flex items-center gap-2" {...swipeHandlers}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => cambiarDia(-1)}
              disabled={loading}
              className="shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex-1 text-center relative">
              <div
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg ${diaInfo?.color} text-white shadow-md transition-all duration-200 hover:shadow-lg`}
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-bold text-sm sm:text-lg">{diaInfo?.nombre}</span>
                {esHoy && (
                  <Badge variant="secondary" className="sm:hidden text-xs">
                    Hoy
                  </Badge>
                )}
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                Desliza ← →
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => cambiarDia(1)}
              disabled={loading}
              className="shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Lista de plantillas */}
          <div className="mt-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-pulse">Cargando plantillas...</div>
              </div>
            ) : plantillas.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <div className="text-muted-foreground">
                  No hay plantillas para {diaInfo?.nombre}
                </div>
                <p className="text-sm text-muted-foreground">
                  Crea una plantilla desde la sección de gestión
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {plantillas.map((plantilla) => (
                  <div
                    key={plantilla.id}
                    className={`p-3 sm:p-4 border-2 rounded-lg hover:shadow-md transition-all duration-200 ${diaInfo?.borderColor} hover:border-opacity-100 border-opacity-30 bg-card`}
                  >
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 flex-wrap">
                          <span className="truncate">{plantilla.nombre}</span>
                          {esHoy && (
                            <Badge variant="outline" className={`${diaInfo?.textColor} text-xs shrink-0`}>
                              Sugerida
                            </Badge>
                          )}
                        </h3>
                        {plantilla.descripcion && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                            {plantilla.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge className={`${diaInfo?.color} text-white text-xs`}>
                          {plantilla.items.length}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={loading}
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleAbrirEditar(plantilla)}
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleAbrirEliminar(plantilla)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Preview de productos */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {plantilla.items.slice(0, 2).map((item) => (
                        <Badge
                          key={item.id}
                          variant="secondary"
                          className="text-xs max-w-[120px] truncate"
                        >
                          {item.producto.nombre}
                        </Badge>
                      ))}
                      {plantilla.items.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{plantilla.items.length - 2} más
                        </Badge>
                      )}
                    </div>

                    <Button
                      onClick={() => handleAbrirDialog(plantilla)}
                      disabled={loading}
                      className={`w-full ${diaInfo?.color} hover:opacity-90 text-white h-9 sm:h-10`}
                      size="sm"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      <span className="text-sm sm:text-base">Aplicar Plantilla</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para aplicar plantilla con preview editable */}
      {plantillaSeleccionada && (
        <>
          <AplicarPlantillaDialog
            plantilla={plantillaSeleccionada}
            open={mostrarDialog}
            onOpenChange={setMostrarDialog}
            onSuccess={handlePlantillaAplicada}
          />

          <EditarPlantillaDialog
            plantilla={plantillaSeleccionada}
            open={mostrarEditarDialog}
            onOpenChange={setMostrarEditarDialog}
            onSuccess={handlePlantillaEditada}
          />

          <EliminarPlantillaDialog
            plantilla={plantillaSeleccionada}
            open={mostrarEliminarDialog}
            onOpenChange={setMostrarEliminarDialog}
            onSuccess={handlePlantillaEliminada}
          />
        </>
      )}
    </>
  )
}
