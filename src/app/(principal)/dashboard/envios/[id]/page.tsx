import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import Link from 'next/link'
import {
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  MapPin,
  ArrowLeft,
  FileText,
  Clock
} from 'lucide-react'
import { obtenerEnvioPorId } from '@/caracteristicas/envios/acciones'
import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'

interface EnvioDetallePageProps {
  params: {
    id: string
  }
}

export default async function EnvioDetallePage({ params }: EnvioDetallePageProps) {
  const tienePermiso = await verificarPermiso(PERMISOS.ENVIOS_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const { success, envio, error } = await obtenerEnvioPorId(params.id)

  if (!success || !envio) {
    notFound()
  }

  const estadoVerificacion = envio.estadoVerificacion || 'sin_verificar'
  const hayDiferencias = estadoVerificacion === 'con_diferencias'
  const verificadoOk = estadoVerificacion === 'verificado_ok'

  // Calcular totales
  const totalSolicitado = envio.items.reduce((sum: number, item: any) => sum + item.cantidadSolicitada, 0)
  const totalRecibido = envio.items.reduce((sum: number, item: any) => sum + (item.cantidadRecibida || 0), 0)
  const itemsConProblemas = envio.items.filter((item: any) =>
    item.estadoItem && item.estadoItem !== 'correcto' && item.estadoItem !== 'pendiente'
  )

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/envios">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Detalle del Envío</h1>
          <p className="text-muted-foreground mt-1">
            #{envio.id.slice(-6).toUpperCase()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={envio.estado === 'entregado' ? 'default' : 'secondary'} className="text-sm">
            {envio.estado === 'pendiente' && 'Pendiente'}
            {envio.estado === 'en_transito' && 'En Tránsito'}
            {envio.estado === 'entregado' && 'Entregado'}
          </Badge>

          {verificadoOk && (
            <Badge variant="default" className="bg-green-500 text-sm">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verificado OK
            </Badge>
          )}

          {hayDiferencias && (
            <Badge variant="destructive" className="text-sm">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Con Diferencias
            </Badge>
          )}
        </div>
      </div>

      {/* Información general del envío */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Origen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{envio.sucursalOrigen.nombre}</p>
            <p className="text-xs text-muted-foreground">{envio.sucursalOrigen.codigoUnico}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Destino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{envio.sucursalDestino.nombre}</p>
            <p className="text-xs text-muted-foreground">{envio.sucursalDestino.codigoUnico}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fechas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {envio.fechaEnvio && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enviado:</span>
                <span>{new Date(envio.fechaEnvio).toLocaleDateString()}</span>
              </div>
            )}
            {envio.fechaEntrega && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entregado:</span>
                <span>{new Date(envio.fechaEntrega).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen de cantidades */}
      {envio.estado === 'entregado' && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Solicitado</p>
                  <p className="text-2xl font-bold">{totalSolicitado}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Recibido</p>
                  <p className="text-2xl font-bold">{totalRecibido}</p>
                </div>
                <Truck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Con Problemas</p>
                  <p className="text-2xl font-bold text-red-600">{itemsConProblemas.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detalle de productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos del Envío
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {envio.items.map((item: any) => {
              const cantidadRecibida = item.cantidadRecibida || 0
              const diferencia = cantidadRecibida - item.cantidadSolicitada
              const tieneDiferencia = diferencia !== 0
              const estadoItem = item.estadoItem || 'pendiente'

              return (
                <div
                  key={item.productoId}
                  className={`p-4 rounded-lg border ${
                    estadoItem === 'correcto' ? 'bg-green-50 border-green-200' :
                    estadoItem === 'faltante' ? 'bg-red-50 border-red-200' :
                    estadoItem === 'sobrante' ? 'bg-blue-50 border-blue-200' :
                    estadoItem === 'danado' ? 'bg-orange-50 border-orange-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold">{item.producto.nombre}</div>
                      {item.producto.sku && (
                        <div className="text-xs text-muted-foreground">SKU: {item.producto.sku}</div>
                      )}
                    </div>

                    <div className="flex gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Solicitado</p>
                        <p className="font-bold">{item.cantidadSolicitada}</p>
                      </div>

                      {envio.estado === 'entregado' && (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground">Recibido</p>
                            <p className="font-bold">{cantidadRecibida}</p>
                          </div>

                          {tieneDiferencia && (
                            <div>
                              <p className="text-xs text-muted-foreground">Diferencia</p>
                              <p className={`font-bold ${diferencia < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                {diferencia > 0 ? '+' : ''}{diferencia}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Estado y observaciones */}
                  {envio.estado === 'entregado' && (
                    <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            estadoItem === 'correcto' ? 'default' :
                            estadoItem === 'pendiente' ? 'secondary' :
                            'destructive'
                          }
                          className={
                            estadoItem === 'correcto' ? 'bg-green-500' :
                            estadoItem === 'sobrante' ? 'bg-blue-500' : ''
                          }
                        >
                          {estadoItem === 'correcto' && '✓ Correcto'}
                          {estadoItem === 'faltante' && 'Faltante'}
                          {estadoItem === 'sobrante' && 'Sobrante'}
                          {estadoItem === 'danado' && 'Dañado'}
                          {estadoItem === 'pendiente' && 'Pendiente'}
                        </Badge>
                      </div>

                      {item.observaciones && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="italic text-muted-foreground">{item.observaciones}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Observaciones generales */}
      {envio.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observaciones Generales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{envio.observaciones}</p>
          </CardContent>
        </Card>
      )}

      {/* Información de confirmación */}
      {envio.confirmadoPor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Información de Confirmación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confirmado por:</span>
              <span>Usuario #{envio.confirmadoPor}</span>
            </div>
            {envio.fechaConfirmacion && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha de confirmación:</span>
                <span>{new Date(envio.fechaConfirmacion).toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
