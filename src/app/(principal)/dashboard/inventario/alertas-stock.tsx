import { Badge } from '@/compartido/componentes/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'

type Alerta = {
  id: number
  cantidad_actual: number
  stock_minimo: number
  producto_nombre: string
  sku: string
  sucursal_nombre: string
}

export default function AlertasStock({ alertas }: { alertas: Alerta[] }) {
  return (
    <Card className="border-destructive">
      <CardHeader className="bg-destructive/10">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <span className="text-2xl">⚠️</span>
          Stock Crítico - {alertas.length} {alertas.length === 1 ? 'Alerta' : 'Alertas'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {alertas.slice(0, 5).map((alerta) => (
            <div key={alerta.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{alerta.producto_nombre}</div>
                <div className="text-sm text-muted-foreground">
                  {alerta.sucursal_nombre} • SKU: {alerta.sku}
                </div>
              </div>
              <div className="text-right">
                <Badge variant="destructive">
                  {alerta.cantidad_actual} / {alerta.stock_minimo}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  Faltan {alerta.stock_minimo - alerta.cantidad_actual} unidades
                </div>
              </div>
            </div>
          ))}
          {alertas.length > 5 && (
            <div className="text-sm text-muted-foreground text-center pt-2">
              Y {alertas.length - 5} alertas más...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
