import { Badge } from '@/compartido/componentes/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'

type Sugerencia = {
  producto: { nombre: string; sku: string }
  sucursalOrigen: { nombre: string }
  sucursalDestino: { nombre: string }
  cantidadSugerida: number
  prioridad: string
}

export default function SugerenciasEnvios({ sugerencias }: { sugerencias: Sugerencia[] }) {
  return (
    <Card className="border-blue-500">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <span className="text-2xl">💡</span>
          Sugerencias Inteligentes - {sugerencias.length} {sugerencias.length === 1 ? 'Recomendación' : 'Recomendaciones'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {sugerencias.slice(0, 5).map((sug, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-muted rounded-lg border-l-4 border-blue-500">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{sug.producto.nombre}</span>
                  <Badge variant={sug.prioridad === 'alta' ? 'destructive' : 'warning'}>
                    {sug.prioridad === 'alta' ? 'Urgente' : 'Prioridad Media'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  De <span className="font-medium">{sug.sucursalOrigen.nombre}</span> → <span className="font-medium">{sug.sucursalDestino.nombre}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{sug.cantidadSugerida}</div>
                <div className="text-xs text-muted-foreground">unidades</div>
              </div>
            </div>
          ))}
          {sugerencias.length > 5 && (
            <div className="text-sm text-muted-foreground text-center pt-2">
              Y {sugerencias.length - 5} sugerencias más...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
