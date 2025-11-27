'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Package,
  Printer,
  Pencil,
  TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { actualizarEstadoEnvio } from '@/caracteristicas/envios/acciones'

type Envio = {
  id: string
  estado: string
  createdAt: Date
  sucursalOrigen: { nombre: string }
  sucursalDestino: { nombre: string }
  items: Array<{
    producto: { nombre: string }
    cantidadSolicitada: number
  }>
}

type Props = {
  envios: Envio[]
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const estadoConfig = {
  pendiente: { label: 'Pendiente', variant: 'outline' as const, color: 'bg-gray-500' },
  en_preparacion: { label: 'En Preparación', variant: 'secondary' as const, color: 'bg-blue-500' },
  en_transito: { label: 'En Tránsito', variant: 'warning' as const, color: 'bg-yellow-500' },
  entregado: { label: 'Entregado', variant: 'success' as const, color: 'bg-green-500' },
}

export default function CalendarioEnvios({ envios }: Props) {
  const router = useRouter()
  const hoy = new Date()

  const [mesActual, setMesActual] = useState(() => {
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  })

  // Inicializar con el día de hoy seleccionado
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date>(hoy)
  const [loadingEstado, setLoadingEstado] = useState<string | null>(null)
  const [calendarioExpandido, setCalendarioExpandido] = useState(false)

  // Agrupar envíos por fecha
  const enviosPorFecha = useMemo(() => {
    const grupos: Record<string, Envio[]> = {}
    envios.forEach(e => {
      const fecha = new Date(e.createdAt)
      const key = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`
      if (!grupos[key]) {
        grupos[key] = []
      }
      grupos[key].push(e)
    })
    return grupos
  }, [envios])

  // Generar días del mes
  const diasDelMes = useMemo(() => {
    const anio = mesActual.getFullYear()
    const mes = mesActual.getMonth()
    const primerDia = new Date(anio, mes, 1)
    const ultimoDia = new Date(anio, mes + 1, 0)
    const dias: (Date | null)[] = []

    // Días vacíos al inicio
    for (let i = 0; i < primerDia.getDay(); i++) {
      dias.push(null)
    }

    // Días del mes
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      dias.push(new Date(anio, mes, d))
    }

    return dias
  }, [mesActual])

  // Verificar si un día tiene envíos
  const tieneEnvios = (fecha: Date): number => {
    const key = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`
    return enviosPorFecha[key]?.length || 0
  }

  // Obtener envíos de un día
  const obtenerEnviosDia = (fecha: Date): Envio[] => {
    const key = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`
    return enviosPorFecha[key] || []
  }

  // Es hoy
  const esHoy = (fecha: Date): boolean => {
    const hoy = new Date()
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear()
  }

  const mesAnterior = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1))
  }

  const mesSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1))
  }

  const enviosDiaSeleccionado = obtenerEnviosDia(diaSeleccionado)

  const getProximoEstado = (estadoActual: string) => {
    const flujo = ['pendiente', 'en_preparacion', 'en_transito', 'entregado']
    const idx = flujo.indexOf(estadoActual)
    return idx < flujo.length - 1 ? flujo[idx + 1] : null
  }

  const handleCambiarEstado = async (envioId: string, nuevoEstado: string) => {
    if (loadingEstado) return
    setLoadingEstado(envioId)

    try {
      const result = await actualizarEstadoEnvio(envioId, nuevoEstado)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Error al cambiar estado')
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setLoadingEstado(null)
    }
  }

  const handleImprimir = (envio: Envio) => {
    const fecha = format(new Date(envio.createdAt), "dd 'de' MMMM yyyy", { locale: es })
    const hora = format(new Date(envio.createdAt), 'HH:mm', { locale: es })

    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Envío #${envio.id.slice(0, 8)}</title>
        <style>
          body { font-family: monospace; font-size: 12px; padding: 20px; max-width: 300px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 10px; }
          .header h1 { font-size: 16px; margin: 0 0 5px 0; }
          .info { margin-bottom: 10px; }
          .info div { display: flex; justify-content: space-between; margin: 3px 0; }
          .productos { border-top: 2px solid black; border-bottom: 2px solid black; padding: 10px 0; margin: 10px 0; }
          .productos-header { display: grid; grid-template-columns: 1fr 50px; font-weight: bold; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dashed black; }
          .producto { display: grid; grid-template-columns: 1fr 50px; padding: 3px 0; }
          .producto-cant { text-align: center; font-weight: bold; }
          .totales { margin: 10px 0; }
          .totales div { display: flex; justify-content: space-between; font-weight: bold; }
          .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
          .firma { text-align: center; }
          .firma-linea { border-bottom: 1px solid black; height: 40px; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DOCUMENTO DE ENVIO</h1>
          <div>#${envio.id.slice(0, 8).toUpperCase()}</div>
        </div>

        <div class="info">
          <div><span><b>Fecha:</b></span><span>${fecha}</span></div>
          <div><span><b>Hora:</b></span><span>${hora}</span></div>
          <div style="border-top: 1px dashed black; margin-top: 5px; padding-top: 5px;">
            <span><b>Origen:</b></span><span>${envio.sucursalOrigen.nombre}</span>
          </div>
          <div><span><b>Destino:</b></span><span>${envio.sucursalDestino.nombre}</span></div>
        </div>

        <div class="productos">
          <div class="productos-header">
            <div>PRODUCTO</div>
            <div style="text-align: center">CANT</div>
          </div>
          ${envio.items.map(item => `
            <div class="producto">
              <div>${item.producto.nombre}</div>
              <div class="producto-cant">${item.cantidadSolicitada}</div>
            </div>
          `).join('')}
        </div>

        <div class="totales">
          <div><span>TOTAL PRODUCTOS:</span><span>${envio.items.length}</span></div>
          <div><span>TOTAL UNIDADES:</span><span>${envio.items.reduce((sum, item) => sum + item.cantidadSolicitada, 0)}</span></div>
        </div>

        <div class="firmas">
          <div class="firma">
            <div class="firma-linea"></div>
            <div>Entrega</div>
          </div>
          <div class="firma">
            <div class="firma-linea"></div>
            <div>Recibe</div>
          </div>
        </div>
      </body>
      </html>
    `

    const ventana = window.open('', '_blank', 'width=400,height=600')
    if (ventana) {
      ventana.document.write(contenido)
      ventana.document.close()
      ventana.onload = () => {
        ventana.print()
      }
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarIcon className="w-5 h-5" />
          Envíos del Día
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Envíos del día seleccionado - ARRIBA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-base">
              {esHoy(diaSeleccionado) ? (
                <span className="flex items-center gap-2">
                  Hoy
                  <span className="text-sm font-normal text-muted-foreground">
                    {format(diaSeleccionado, "dd 'de' MMMM", { locale: es })}
                  </span>
                </span>
              ) : (
                format(diaSeleccionado, "EEEE, dd 'de' MMMM", { locale: es })
              )}
            </h4>
            <Badge variant="outline">{enviosDiaSeleccionado.length} envíos</Badge>
          </div>

          {enviosDiaSeleccionado.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Sin envíos registrados</p>
              <p className="text-xs mt-1">No hay envíos para este día</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {enviosDiaSeleccionado.map(envio => {
                  const config = estadoConfig[envio.estado as keyof typeof estadoConfig] || estadoConfig.pendiente
                  const proximoEstado = getProximoEstado(envio.estado)

                  return (
                    <div key={envio.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs">#{envio.id.slice(0, 8)}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(envio.createdAt), 'HH:mm', { locale: es })}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">De:</span>{' '}
                            <span className="font-medium">{envio.sucursalOrigen.nombre}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">A:</span>{' '}
                            <span className="font-medium">{envio.sucursalDestino.nombre}</span>
                          </div>
                        </div>
                        <Badge variant={config.variant} className="text-xs">
                          {config.label}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground pl-2 border-l-2 border-border">
                        {envio.items.slice(0, 2).map((item, idx) => (
                          <div key={idx}>
                            {item.producto.nombre} (×{item.cantidadSolicitada})
                          </div>
                        ))}
                        {envio.items.length > 2 && (
                          <div className="italic">+{envio.items.length - 2} más</div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 pt-2">
                        {(envio.estado === 'pendiente' || envio.estado === 'en_preparacion') && (
                          <Link href={`/dashboard/envios/${envio.id}/editar`} className="flex-1">
                            <Button variant="ghost" size="sm" className="h-8 text-xs w-full">
                              <Pencil className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs flex-1"
                          onClick={() => handleImprimir(envio)}
                        >
                          <Printer className="w-3 h-3 mr-1" />
                          Imprimir
                        </Button>
                      </div>

                      {proximoEstado && (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full mt-1.5 h-8 text-xs"
                          onClick={() => handleCambiarEstado(envio.id, proximoEstado)}
                          disabled={loadingEstado === envio.id}
                        >
                          {loadingEstado === envio.id ? (
                            <span className="animate-pulse">Procesando...</span>
                          ) : (
                            <>
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Cambiar a: {estadoConfig[proximoEstado as keyof typeof estadoConfig].label}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Separador */}
          <div className="border-t pt-4">
            {/* Botón para expandir/colapsar calendario */}
            <button
              onClick={() => setCalendarioExpandido(!calendarioExpandido)}
              className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span className="font-medium text-sm">Ver calendario completo</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${calendarioExpandido ? 'rotate-90' : ''}`} />
            </button>

            {/* Calendario - ABAJO y colapsable */}
            {calendarioExpandido && (
              <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                {/* Navegación del mes */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base">
                    {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
                  </h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={mesAnterior}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={mesSiguiente}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Calendario */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Encabezados */}
                  {DIAS_SEMANA.map(dia => (
                    <div key={dia} className="text-xs font-medium text-muted-foreground py-2">
                      {dia}
                    </div>
                  ))}

                  {/* Días */}
                  {diasDelMes.map((fecha, idx) => {
                    const cantidadEnvios = fecha ? tieneEnvios(fecha) : 0

                    return (
                      <div key={idx} className="aspect-square">
                        {fecha ? (
                          <button
                            onClick={() => setDiaSeleccionado(fecha)}
                            className={`
                              w-full h-full flex flex-col items-center justify-center rounded-lg text-sm
                              transition-colors relative
                              ${esHoy(fecha) ? 'bg-primary text-primary-foreground font-bold' : ''}
                              ${diaSeleccionado.getTime() === fecha.getTime() && !esHoy(fecha)
                                ? 'bg-primary/20 font-semibold'
                                : ''}
                              ${!esHoy(fecha) && diaSeleccionado.getTime() !== fecha.getTime()
                                ? 'hover:bg-muted'
                                : ''}
                            `}
                          >
                            {fecha.getDate()}
                            {cantidadEnvios > 0 && (
                              <div className="absolute bottom-1 flex items-center justify-center">
                                <span className={`
                                  text-[10px] font-bold px-1.5 rounded-full
                                  ${esHoy(fecha) ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'}
                                `}>
                                  {cantidadEnvios}
                                </span>
                              </div>
                            )}
                          </button>
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
