import { obtenerSucursalPorId, obtenerOperacionDia, obtenerEnviosPendientesConfirmacion } from '@/caracteristicas/sucursales/acciones'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/compartido/componentes/ui/tabs'
import ConfirmarRecepcion from './confirmar-recepcion'
import RegistroDevolucion from './registro-devolucion'
import ResumenDia from './resumen-dia'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/caracteristicas/autenticacion/auth'

interface PerfilSucursalPageProps {
  params: {
    id: string
  }
}

export const revalidate = 60 // Revalidar cada minuto

export default async function PerfilSucursalPage({ params }: PerfilSucursalPageProps) {
  const session = await getServerSession(authOptions)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{sucursal.nombre}</h1>
          <p className="text-muted-foreground mt-1">
            Código: <span className="font-mono">{sucursal.codigoUnico}</span>
            {sucursal.direccion && (
              <>
                {' • '}
                📍 {sucursal.direccion}
              </>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {pendientes > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              {pendientes} envío{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''}
            </Badge>
          )}
          <Badge variant="outline">
            {sucursal.gerente ? `Gerente: ${sucursal.gerente.nombre}` : 'Sin gerente asignado'}
          </Badge>
        </div>
      </div>

      {/* KPIs del día */}
      {operacionSuccess && operacion && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total a Vender</p>
                  <p className="text-2xl font-bold">
                    ${parseFloat(operacion.totalAVender.toString()).toLocaleString()}
                  </p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Vendido</p>
                  <p className="text-2xl font-bold">
                    ${parseFloat(operacion.totalVendido.toString()).toLocaleString()}
                  </p>
                </div>
                <div className="text-2xl">📈</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pérdidas</p>
                  <p className="text-2xl font-bold text-red-600">
                    -${parseFloat(operacion.totalPerdidas.toString()).toLocaleString()}
                  </p>
                </div>
                <div className="text-2xl">📉</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Efectivo Real</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${parseFloat(operacion.efectivoReal.toString()).toLocaleString()}
                  </p>
                </div>
                <div className="text-2xl">💵</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de operación */}
      <Tabs defaultValue="hoy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hoy" className="flex items-center gap-2">
            📅 Operación de Hoy
          </TabsTrigger>
          <TabsTrigger value="recepciones" className="flex items-center gap-2">
            📦 Recepciones
            {pendientes > 0 && <Badge variant="destructive" className="ml-1">{pendientes}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="devoluciones" className="flex items-center gap-2">
            🔄 Devoluciones
          </TabsTrigger>
          <TabsTrigger value="resumen" className="flex items-center gap-2">
            📊 Resumen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hoy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Control Diario - {new Date().toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Gestiona las operaciones del día: confirma recepciones, registra ventas y devoluciones.
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-blue-700 text-lg">📦 Confirmar Recepciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-600 mb-3">
                      {pendientes} envío{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''} de confirmación
                    </p>
                    <p className="text-xs text-blue-500">
                      Confirma la recepción de productos enviados por bodega
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-green-700 text-lg">🔄 Registrar Devoluciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-600 mb-3">
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
          <ConfirmarRecepcion
            sucursalId={params.id}
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
