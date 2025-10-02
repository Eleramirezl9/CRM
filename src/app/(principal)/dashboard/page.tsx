import { obtenerKpisDashboard, obtenerAlertasDashboard, obtenerResumenSucursales } from '@/caracteristicas/dashboard/acciones'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import Link from 'next/link'

// Revalidar cada 60 segundos
export const revalidate = 60

export default async function DashboardPage() {
  // Ejecutar consultas en paralelo para reducir tiempo
  const [{ kpis }, { alertas }, { sucursales }] = await Promise.all([
    obtenerKpisDashboard(),
    obtenerAlertasDashboard(),
    obtenerResumenSucursales(),
  ])
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visión general del negocio</p>
      </div>
      
      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Ventas del Mes"
          value={`$${kpis.ventasTotales.toLocaleString()}`}
          href="/dashboard/reportes"
          trend="up"
        />
        <KpiCard
          title="Rentabilidad"
          value={`${(kpis.rentabilidad * 100).toFixed(1)}%`}
          href="/dashboard/reportes"
          trend={kpis.rentabilidad > 0.3 ? 'up' : 'down'}
        />
        <KpiCard
          title="Stock Crítico"
          value={String(kpis.stockCritico)}
          href="/dashboard/inventario"
          alert={kpis.stockCritico > 0}
        />
        <KpiCard
          title="Envíos Pendientes"
          value={String(kpis.enviosPendientes)}
          href="/dashboard/envios"
          alert={kpis.enviosPendientes > 5}
        />
      </div>
      
      {/* Alertas */}
      {alertas.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-yellow-700 flex items-center gap-2">
              <span>⚠️</span>
              Alertas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {alertas.map((alerta, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded">
                  <span className="text-sm">{alerta.mensaje}</span>
                  <Badge variant={alerta.prioridad === 'alta' ? 'destructive' : 'warning'}>
                    {alerta.prioridad === 'alta' ? 'Urgente' : 'Atención'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Resumen por Sucursal */}
      <Card>
        <CardHeader>
          <CardTitle>Desempeño por Sucursal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sucursales.map((suc, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{suc.nombre}</h3>
                  <Badge variant={suc.cumplimiento >= 100 ? 'success' : suc.cumplimiento >= 70 ? 'warning' : 'destructive'}>
                    {suc.cumplimiento.toFixed(0)}% de meta
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Ventas del Mes</div>
                    <div className="font-semibold">${suc.ventasMes.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Stock Total</div>
                    <div className="font-semibold">{suc.stockTotal} unidades</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Productos Activos</div>
                    <div className="font-semibold">{suc.productosActivos}</div>
                  </div>
                </div>
                <div className="mt-3 bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${suc.cumplimiento >= 100 ? 'bg-green-500' : suc.cumplimiento >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(suc.cumplimiento, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {sucursales.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No hay sucursales registradas
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/productos/nuevo" className="p-4 border rounded-lg hover:bg-accent transition-colors text-center">
              <div className="text-2xl mb-2">📦</div>
              <div className="text-sm font-medium">Nuevo Producto</div>
            </Link>
            <Link href="/dashboard/ventas" className="p-4 border rounded-lg hover:bg-accent transition-colors text-center">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-sm font-medium">Registrar Venta</div>
            </Link>
            <Link href="/dashboard/envios/nuevo" className="p-4 border rounded-lg hover:bg-accent transition-colors text-center">
              <div className="text-2xl mb-2">🚚</div>
              <div className="text-sm font-medium">Nuevo Envío</div>
            </Link>
            <Link href="/dashboard/reportes" className="p-4 border rounded-lg hover:bg-accent transition-colors text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium">Ver Reportes</div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({ title, value, href, trend, alert }: {
  title: string
  value: string
  href: string
  trend?: 'up' | 'down'
  alert?: boolean
}) {
  return (
    <Link href={href as any}>
      <Card className={`hover:shadow-lg transition-shadow ${alert ? 'border-destructive' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">{value}</div>
            {trend && (
              <div className={`text-2xl ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trend === 'up' ? '↗' : '↘'}
              </div>
            )}
            {alert && <div className="text-2xl">⚠️</div>}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
