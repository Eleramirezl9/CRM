'use client'

import { useState } from 'react'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { ChevronDown, ChevronUp } from 'lucide-react'

type Sugerencia = {
  producto: { nombre: string; sku: string }
  sucursalOrigen: { nombre: string }
  sucursalDestino: { nombre: string }
  cantidadSugerida: number
  prioridad: string
}

export default function SugerenciasEnvios({ sugerencias }: { sugerencias: Sugerencia[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const INITIAL_LIMIT = 5
  const sugerenciasToShow = showAll ? sugerencias : sugerencias.slice(0, INITIAL_LIMIT)

  return (
    <Card className="border-blue-500">
      <CardHeader
        className="bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-blue-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Sugerencias Inteligentes - {sugerencias.length} {sugerencias.length === 1 ? 'Recomendación' : 'Recomendaciones'}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-6">
        <div className="space-y-3">
          {sugerenciasToShow.map((sug, idx) => (
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
          {sugerencias.length > INITIAL_LIMIT && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowAll(!showAll)
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium text-center pt-4 transition-colors"
            >
              {showAll ? (
                <>Ver menos sugerencias</>
              ) : (
                <>Ver todas las {sugerencias.length} sugerencias ({sugerencias.length - INITIAL_LIMIT} más)</>
              )}
            </button>
          )}
        </div>
        </CardContent>
      )}
    </Card>
  )
}
