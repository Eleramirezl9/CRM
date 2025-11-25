'use client'

import { useState } from 'react'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { ChevronDown, ChevronUp } from 'lucide-react'

type Alerta = {
  id: number
  cantidad_actual: number
  stock_minimo: number
  producto_nombre: string
  sku: string
  sucursal_nombre: string
}

export default function AlertasStock({ alertas }: { alertas: Alerta[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const INITIAL_LIMIT = 5
  const alertasToShow = showAll ? alertas : alertas.slice(0, INITIAL_LIMIT)

  return (
    <Card className="border-destructive">
      <CardHeader
        className="bg-destructive/10 cursor-pointer hover:bg-destructive/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-destructive">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            Stock Crítico - {alertas.length} {alertas.length === 1 ? 'Alerta' : 'Alertas'}
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
            {alertasToShow.map((alerta) => (
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
          {alertas.length > INITIAL_LIMIT && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowAll(!showAll)
              }}
              className="w-full text-sm text-destructive hover:text-destructive/80 font-medium text-center pt-4 transition-colors"
            >
              {showAll ? (
                <>Ver menos alertas</>
              ) : (
                <>Ver todas las {alertas.length} alertas ({alertas.length - INITIAL_LIMIT} más)</>
              )}
            </button>
          )}
        </div>
        </CardContent>
      )}
    </Card>
  )
}
