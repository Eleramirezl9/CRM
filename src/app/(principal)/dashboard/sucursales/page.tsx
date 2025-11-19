import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { PageTitle } from '@/compartido/componentes/PageTitle'
import { obtenerSucursales } from '@/caracteristicas/sucursales/acciones'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import Link from 'next/link'
import { Eye, Edit, Plus, TrendingUp, TrendingDown } from 'lucide-react'

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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sucursales</p>
                <p className="text-2xl font-bold">{sucursales.length}</p>
              </div>
              <div className="text-2xl">🏢</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Con Gerente</p>
                <p className="text-2xl font-bold">
                  {sucursales.filter(s => s.gerente).length}
                </p>
              </div>
              <div className="text-2xl">👤</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Promedio Cumplimiento</p>
                <p className="text-2xl font-bold">
                  {sucursales.length > 0 
                    ? Math.round(sucursales.reduce((acc, s) => acc + s.cumplimientoMeta, 0) / sucursales.length)
                    : 0}%
                </p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ventas Totales</p>
                <p className="text-2xl font-bold">
                  ${sucursales.reduce((acc, s) => acc + s.totalVentasMes, 0).toLocaleString()}
                </p>
              </div>
              <div className="text-2xl">💰</div>
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
              <div className="text-4xl mb-4">🏢</div>
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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏪</div>
          <div>
            <h3 className="font-semibold text-lg">{sucursal.nombre}</h3>
            <p className="text-sm text-muted-foreground">
              Código: <span className="font-mono">{sucursal.codigoUnico}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/sucursales/${sucursal.id}/perfil`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Ver Perfil
            </Button>
          </Link>
          <Link href={`/dashboard/sucursales/${sucursal.id}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
        {/* Gerente */}
        <div>
          <p className="text-sm text-muted-foreground">Gerente</p>
          <p className="font-medium">
            {sucursal.gerente ? sucursal.gerente.nombre : 'Sin asignar'}
          </p>
        </div>

        {/* Meta vs Ventas */}
        <div>
          <p className="text-sm text-muted-foreground">Meta vs Ventas</p>
          <p className="font-medium">
            ${sucursal.totalVentasMes.toLocaleString()} / ${parseFloat(sucursal.metaVentas.toString()).toLocaleString()}
          </p>
        </div>

        {/* Cumplimiento */}
        <div>
          <p className="text-sm text-muted-foreground">Cumplimiento</p>
          <div className="flex items-center gap-2">
            {isAlto && <TrendingUp className="h-4 w-4 text-green-500" />}
            {isMedio && <TrendingDown className="h-4 w-4 text-yellow-500" />}
            {isBajo && <TrendingDown className="h-4 w-4 text-red-500" />}
            <Badge 
              variant={isAlto ? 'default' : isMedio ? 'secondary' : 'destructive'}
              className={isAlto ? 'bg-green-500' : isMedio ? 'bg-yellow-500' : ''}
            >
              {cumplimiento.toFixed(0)}%
            </Badge>
          </div>
        </div>

        {/* Inventario */}
        <div>
          <p className="text-sm text-muted-foreground">Productos</p>
          <p className="font-medium">{sucursal._count.inventarios} productos</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isAlto ? 'bg-green-500' : isMedio ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(cumplimiento, 100)}%` }}
        />
      </div>

      {/* Dirección */}
      {sucursal.direccion && (
        <p className="text-sm text-muted-foreground mt-2">
          📍 {sucursal.direccion}
        </p>
      )}
    </div>
  )
}
