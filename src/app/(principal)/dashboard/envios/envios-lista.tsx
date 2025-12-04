'use client'

import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import { Card, CardContent } from '@/compartido/componentes/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/compartido/componentes/ui/table'
import { actualizarEstadoEnvio } from '@/caracteristicas/envios/acciones'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Printer, Pencil, Calendar, CheckCircle, AlertTriangle, Eye } from 'lucide-react'
import Link from 'next/link'
import { agruparPorDia } from '@/compartido/lib/formateo-fechas'

type Envio = {
  id: string
  estado: string
  estadoVerificacion?: string
  createdAt: Date
  sucursalOrigen: { nombre: string }
  sucursalDestino: { nombre: string }
  items: Array<{
    producto: { nombre: string }
    cantidadSolicitada: number
    cantidadRecibida?: number
    estadoItem?: string
    observaciones?: string
  }>
}

const estadoConfig = {
  pendiente: { label: 'Pendiente', variant: 'outline' as const, color: 'text-gray-600' },
  en_preparacion: { label: 'En Preparación', variant: 'secondary' as const, color: 'text-blue-600' },
  en_transito: { label: 'En Tránsito', variant: 'warning' as const, color: 'text-yellow-600' },
  entregado: { label: 'Entregado', variant: 'success' as const, color: 'text-green-600' },
}

export default function EnviosLista({ envios }: { envios: Envio[] }) {
  const router = useRouter()
  const [loadingEstado, setLoadingEstado] = useState<string | null>(null)

  // Agrupar envíos por día (memoizado para evitar recálculo en cada render)
  const enviosAgrupados = useMemo(() => agruparPorDia(envios), [envios])

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

  const handleCambiarEstado = async (envioId: string, nuevoEstado: string) => {
    if (loadingEstado) return // Prevenir doble click

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
  
  const getProximoEstado = (estadoActual: string) => {
    const flujo = ['pendiente', 'en_preparacion', 'en_transito', 'entregado']
    const idx = flujo.indexOf(estadoActual)
    return idx < flujo.length - 1 ? flujo[idx + 1] : null
  }
  
  const renderEnvioCard = (envio: Envio) => {
    const config = estadoConfig[envio.estado as keyof typeof estadoConfig] || estadoConfig.pendiente
    const proximoEstado = getProximoEstado(envio.estado)

    // Calcular información de verificación
    const estadoVerificacion = envio.estadoVerificacion || 'sin_verificar'
    const hayDiferencias = estadoVerificacion === 'con_diferencias'
    const verificadoOk = estadoVerificacion === 'verificado_ok'
    const itemsConProblemas = envio.items.filter(item =>
      item.estadoItem && item.estadoItem !== 'correcto' && item.estadoItem !== 'pendiente'
    ).length

    return (
      <Card key={envio.id} className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-mono text-sm font-medium">#{envio.id.slice(0, 8)}</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(envio.createdAt), 'HH:mm', { locale: es })}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Badge variant={config.variant}>{config.label}</Badge>
              {verificadoOk && (
                <Badge variant="default" className="bg-green-500 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  OK
                </Badge>
              )}
              {hayDiferencias && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {itemsConProblemas} problema{itemsConProblemas !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">De:</span>
              <span className="font-medium">{envio.sucursalOrigen.nombre}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">A:</span>
              <span className="font-medium">{envio.sucursalDestino.nombre}</span>
            </div>
          </div>

          <div className="bg-muted rounded-md p-3 mb-3">
            <div className="text-xs font-medium mb-2">Productos:</div>
            <div className="text-xs space-y-1">
              {envio.items.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.producto.nombre}</span>
                  <span className="font-medium">×{item.cantidadSolicitada}</span>
                </div>
              ))}
              {envio.items.length > 2 && (
                <div className="text-muted-foreground text-center pt-1">
                  +{envio.items.length - 2} más
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {envio.estado === 'entregado' && (
              <Link href={`/dashboard/envios/${envio.id}`} className="flex-1">
                <Button variant="default" size="sm" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalle
                </Button>
              </Link>
            )}
            {(envio.estado === 'pendiente' || envio.estado === 'en_preparacion') && (
              <Link href={`/dashboard/envios/${envio.id}/editar`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprimir(envio)}
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>

          {proximoEstado && (
            <Button
              variant="default"
              size="sm"
              className="w-full mt-2"
              onClick={() => handleCambiarEstado(envio.id, proximoEstado)}
              disabled={loadingEstado === envio.id}
            >
              {loadingEstado === envio.id ? (
                <span className="animate-pulse">Procesando...</span>
              ) : (
                `Cambiar a: ${estadoConfig[proximoEstado as keyof typeof estadoConfig].label}`
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {envios.length === 0 ? (
        <Card>
          <CardContent className="text-center text-muted-foreground py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay envíos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(enviosAgrupados).map(([dia, enviosDelDia]) => (
            <div key={dia} className="space-y-3">
              {/* Header del día */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{dia}</h3>
                  <p className="text-xs text-muted-foreground">
                    {enviosDelDia.length} {enviosDelDia.length === 1 ? 'envío' : 'envíos'}
                  </p>
                </div>
                <div className="h-px flex-1 bg-border"></div>
              </div>

              {/* Vista Desktop - Tabla */}
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Origen</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enviosDelDia.map((envio) => {
                const config = estadoConfig[envio.estado as keyof typeof estadoConfig] || estadoConfig.pendiente
                const proximoEstado = getProximoEstado(envio.estado)

                return (
                  <TableRow key={envio.id}>
                    <TableCell className="font-mono text-sm">#{envio.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(envio.createdAt), 'HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>{envio.sucursalOrigen.nombre}</TableCell>
                    <TableCell>{envio.sucursalDestino.nombre}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {envio.items.slice(0, 2).map((item, idx) => (
                          <div key={idx}>
                            {item.producto.nombre} ({item.cantidadSolicitada})
                          </div>
                        ))}
                        {envio.items.length > 2 && (
                          <div className="text-muted-foreground">
                            +{envio.items.length - 2} más
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(envio.estado === 'pendiente' || envio.estado === 'en_preparacion') && (
                          <Link href={`/dashboard/envios/${envio.id}/editar`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleImprimir(envio)}
                          title="Imprimir"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        {proximoEstado && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCambiarEstado(envio.id, proximoEstado)}
                            disabled={loadingEstado === envio.id}
                          >
                            {loadingEstado === envio.id ? (
                              <span className="animate-pulse">Procesando...</span>
                            ) : (
                              `→ ${estadoConfig[proximoEstado as keyof typeof estadoConfig].label}`
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Vista Móvil - Cards */}
              <div className="md:hidden space-y-3">
                {enviosDelDia.map((envio) => renderEnvioCard(envio))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
