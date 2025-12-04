import { obtenerSucursalPorId, obtenerOperacionDia, obtenerEnviosPendientesConfirmacion } from '@/caracteristicas/sucursales/acciones'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/compartido/componentes/ui/tabs'
import DocumentoRecepcion from './documento-recepcion'
import RegistroDevolucion from './registro-devolucion'
import ResumenDia from './resumen-dia'
import { getServerSession } from '@/caracteristicas/autenticacion/server'
import { authOptions } from '@/caracteristicas/autenticacion/server'
import {
  Calendar,
  Package,
  RotateCcw,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Banknote,
  MapPin,
  User
} from 'lucide-react'

interface PerfilSucursalPageProps {
  params: {
    id: string
  }
}

export const revalidate = 60 // Revalidar cada minuto

export default async function PerfilSucursalPage({ params }: PerfilSucursalPageProps) {
  const session = await getServerSession()
  if (!session) {
    notFound()
  }

  // Verificar acceso a la sucursal
  if (session.user.rol === 'sucursal' && session.user.sucursalId !== params.id) {
    notFound()
  }

  // Obtener datos en paralelo
  const [
    { success: sucursalSuccess, sucursal, error: sucursalError },
    { success: operacionSuccess, operacion },
    { success: enviosSuccess, envios }
  ] = await Promise.all([
    obtenerSucursalPorId(params.id),
    obtenerOperacionDia(params.id, new Date()),
    obtenerEnviosPendientesConfirmacion(params.id)
  ])

  if (!sucursalSuccess || !sucursal) {
    if (sucursalError === 'Sucursal no encontrada') {
      notFound()
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Perfil de Sucursal</h1>
          <p className="text-muted-foreground mt-1">
            Error al cargar la sucursal: {sucursalError}
          </p>
        </div>
      </div>
    )
  }

  const pendientes = enviosSuccess && envios ? envios.length : 0

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">{sucursal.nombre}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">
            Código: <span className="font-mono">{sucursal.codigoUnico}</span>
            {sucursal.direccion && (
              <>
                <span className="hidden sm:inline"> • </span>
                <span className="flex sm:inline items-center gap-1 mt-1 sm:mt-0">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 inline" />
                  {sucursal.direccion}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
          {pendientes > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1 text-xs sm:text-sm">
              <Package className="h-3 w-3" />
              {pendientes} envío{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''}
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1 text-xs sm:text-sm">
            <User className="h-3 w-3" />
            {sucursal.gerente ? sucursal.gerente.nombre : 'Sin gerente'}
          </Badge>
        </div>
      </div>

      {/* KPIs del día - Responsive */}
      {operacionSuccess && operacion && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total a Vender</p>
                  <p className="text-lg sm:text-2xl font-bold break-words">
                    ${parseFloat(operacion.totalAVender.toString()).toLocaleString()}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Vendido</p>
                  <p className="text-lg sm:text-2xl font-bold break-words">
                    ${parseFloat(operacion.totalVendido.toString()).toLocaleString()}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Pérdidas</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600 break-words">
                    -${parseFloat(operacion.totalPerdidas.toString()).toLocaleString()}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Efectivo Real</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600 break-words">
                    ${parseFloat(operacion.efectivoReal.toString()).toLocaleString()}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <Banknote className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de operación - Responsive */}
      <Tabs defaultValue="hoy" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
          <TabsTrigger value="hoy" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 data-[state=active]:bg-background">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Operación de Hoy</span>
            <span className="sm:hidden">Hoy</span>
          </TabsTrigger>
          <TabsTrigger value="recepciones" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 data-[state=active]:bg-background">
            <Package className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Recepciones</span>
            {pendientes > 0 && <Badge variant="destructive" className="ml-1 text-xs px-1 h-4 min-w-4 flex items-center justify-center">{pendientes}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="devoluciones" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 data-[state=active]:bg-background">
            <RotateCcw className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Devoluciones</span>
          </TabsTrigger>
          <TabsTrigger value="resumen" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hoy" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Control Diario - {new Date().toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Gestiona las operaciones del día: confirma recepciones, registra ventas y devoluciones.
              </p>

              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                <Card className="border-blue-200 bg-blue-50 overflow-visible">
                  <CardHeader className="pb-3 p-3 sm:p-4">
                    <CardTitle className="text-blue-700 text-base sm:text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Confirmar Recepciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-blue-600 mb-2 sm:mb-3">
                      {pendientes} envío{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''} de confirmación
                    </p>
                    <p className="text-xs text-blue-500">
                      Confirma la recepción de productos enviados por bodega
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50 overflow-visible">
                  <CardHeader className="pb-3 p-3 sm:p-4">
                    <CardTitle className="text-green-700 text-base sm:text-lg flex items-center gap-2">
                      <RotateCcw className="h-5 w-5" />
                      Registrar Devoluciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-green-600 mb-2 sm:mb-3">
                      Productos no vendidos o dañados
                    </p>
                    <p className="text-xs text-green-500">
                      Registra pérdidas por vencimiento, daño o no venta
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recepciones">
          <DocumentoRecepcion
            sucursalId={params.id}
            sucursalNombre={sucursal.nombre}
            enviosPendientes={enviosSuccess && envios ? envios : []}
          />
        </TabsContent>

        <TabsContent value="devoluciones">
          <RegistroDevolucion 
            sucursalId={params.id}
            operacionId={operacionSuccess && operacion ? operacion.id : null}
          />
        </TabsContent>

        <TabsContent value="resumen">
          <ResumenDia 
            sucursalId={params.id}
            operacion={operacionSuccess && operacion ? operacion : null}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
