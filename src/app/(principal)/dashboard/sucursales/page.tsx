import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { PageTitle } from '@/compartido/componentes/PageTitle'
import { obtenerSucursales } from '@/caracteristicas/sucursales/acciones'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import Link from 'next/link'
import {
  Eye,
  Edit,
  Plus,
  TrendingUp,
  TrendingDown,
  Store,
  Users,
  BarChart3,
  DollarSign,
  Package,
  MapPin
} from 'lucide-react'

export const revalidate = 60 // Revalidar cada minuto

export default async function SucursalesPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.SUCURSALES_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  const { success, sucursales, error } = await obtenerSucursales()

  if (!success) {
    return (
      <div className="space-y-6 p-4 sm:p-8">
        <div>
          <PageTitle title="Gestión de Sucursales" icon="sucursales" />
          <p className="text-muted-foreground mt-1">Gestiona todas las sucursales de la empresa</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error al cargar sucursales: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
        <div>
          <PageTitle title="Gestión de Sucursales" icon="sucursales" />
          <p className="text-muted-foreground mt-1">Gestiona todas las sucursales de la empresa</p>
        </div>
        <Link href="/dashboard/sucursales/nueva">
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nueva Sucursal
          </Button>
        </Link>
      </div>

      {/* Estadísticas generales */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Sucursales</p>
                <p className="text-xl sm:text-2xl font-bold">{sucursales.length}</p>
              </div>
              <div className="flex-shrink-0 ml-2">
                <Store className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Con Gerente</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {sucursales.filter(s => s.gerente).length}
                </p>
              </div>
              <div className="flex-shrink-0 ml-2">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Promedio Cumplimiento</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {sucursales.length > 0
                    ? Math.round(sucursales.reduce((acc, s) => acc + s.cumplimientoMeta, 0) / sucursales.length)
                    : 0}%
                </p>
              </div>
              <div className="flex-shrink-0 ml-2">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Ventas Totales</p>
                <p className="text-xl sm:text-2xl font-bold break-words">
                  ${sucursales.reduce((acc, s) => acc + s.totalVentasMes, 0).toLocaleString()}
                </p>
              </div>
              <div className="flex-shrink-0 ml-2">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de sucursales */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Sucursales</CardTitle>
        </CardHeader>
        <CardContent>
          {sucursales.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4 flex justify-center">
                <Store className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No hay sucursales registradas</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando tu primera sucursal
              </p>
              <Link href="/dashboard/sucursales/nueva">
                <Button>Crear Primera Sucursal</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sucursales.map((sucursal) => (
                <SucursalCard key={sucursal.id} sucursal={sucursal} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SucursalCard({ sucursal }: { sucursal: any }) {
  const cumplimiento = sucursal.cumplimientoMeta
  const isAlto = cumplimiento >= 100
  const isMedio = cumplimiento >= 70 && cumplimiento < 100
  const isBajo = cumplimiento < 70

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Store className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-lg truncate">{sucursal.nombre}</h3>
            <p className="text-sm text-muted-foreground">
              Código: <span className="font-mono">{sucursal.codigoUnico}</span>
            </p>
          </div>
        </div>

        {/* Botones - Responsive */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Link href={`/dashboard/sucursales/${sucursal.id}/perfil`} className="flex-1 sm:flex-initial">
            <Button variant="outline" size="sm" className="flex items-center gap-1 w-full sm:w-auto">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Ver Perfil</span>
              <span className="sm:hidden">Ver</span>
            </Button>
          </Link>
          <Link href={`/dashboard/sucursales/${sucursal.id}`} className="flex-1 sm:flex-initial">
            <Button variant="outline" size="sm" className="flex items-center gap-1 w-full sm:w-auto">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Editar</span>
              <span className="sm:hidden">Editar</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Info Grid - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Gerente */}
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs sm:text-sm text-muted-foreground">Gerente</p>
          <p className="font-medium text-sm sm:text-base truncate">
            {sucursal.gerente ? sucursal.gerente.nombre : 'Sin asignar'}
          </p>
        </div>

        {/* Meta vs Ventas */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1">
          <p className="text-xs sm:text-sm text-muted-foreground">Meta vs Ventas</p>
          <p className="font-medium text-sm sm:text-base break-words">
            ${sucursal.totalVentasMes.toLocaleString()} / ${parseFloat(sucursal.metaVentas.toString()).toLocaleString()}
          </p>
        </div>

        {/* Cumplimiento */}
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">Cumplimiento</p>
          <div className="flex items-center gap-2">
            {isAlto && <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />}
            {isMedio && <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />}
            {isBajo && <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />}
            <Badge
              variant={isAlto ? 'default' : isMedio ? 'secondary' : 'destructive'}
              className={`${isAlto ? 'bg-green-500' : isMedio ? 'bg-yellow-500' : ''} text-xs sm:text-sm`}
            >
              {cumplimiento.toFixed(0)}%
            </Badge>
          </div>
        </div>

        {/* Inventario */}
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">Productos</p>
          <p className="font-medium text-sm sm:text-base flex items-center gap-1">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            {sucursal._count.inventarios}
          </p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isAlto ? 'bg-green-500' : isMedio ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(cumplimiento, 100)}%` }}
        />
      </div>

      {/* Dirección */}
      {sucursal.direccion && (
        <p className="text-xs sm:text-sm text-muted-foreground break-words flex items-center gap-1">
          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          {sucursal.direccion}
        </p>
      )}
    </div>
  )
}
