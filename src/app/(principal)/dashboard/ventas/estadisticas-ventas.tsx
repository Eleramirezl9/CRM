import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'

type Estadisticas = {
  ventasHoy: { total: number; cantidad: number }
  ventasMes: { total: number; cantidad: number }
  topProductos: Array<{ producto: string; cantidad: number }>
}

export default function EstadisticasVentas({ estadisticas }: { estadisticas: Estadisticas }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${estadisticas.ventasHoy.total.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {estadisticas.ventasHoy.cantidad} {estadisticas.ventasHoy.cantidad === 1 ? 'venta' : 'ventas'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ventas del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${estadisticas.ventasMes.total.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {estadisticas.ventasMes.cantidad} {estadisticas.ventasMes.cantidad === 1 ? 'venta' : 'ventas'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Productos Top</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {estadisticas.topProductos.slice(0, 3).map((prod, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="truncate">{prod.producto}</span>
                <span className="font-medium">{prod.cantidad}</span>
              </div>
            ))}
            {estadisticas.topProductos.length === 0 && (
              <div className="text-sm text-muted-foreground">Sin datos</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
