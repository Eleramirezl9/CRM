'use client'

import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import { Card, CardContent } from '@/compartido/componentes/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/compartido/componentes/ui/table'
import { actualizarEstadoEnvio } from '@/caracteristicas/envios/acciones'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Envio = {
  id: string
  estado: string
  createdAt: Date
  sucursalOrigen: { nombre: string }
  sucursalDestino: { nombre: string }
  items: Array<{
    producto: { nombre: string }
    cantidadSolicitada: number
  }>
}

const estadoConfig = {
  pendiente: { label: 'Pendiente', variant: 'outline' as const, color: 'text-gray-600' },
  en_preparacion: { label: 'En Preparación', variant: 'secondary' as const, color: 'text-blue-600' },
  en_transito: { label: 'En Tránsito', variant: 'warning' as const, color: 'text-yellow-600' },
  entregado: { label: 'Entregado', variant: 'success' as const, color: 'text-green-600' },
}

export default function EnviosLista({ envios }: { envios: Envio[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  
  const handleCambiarEstado = async (envioId: string, nuevoEstado: string) => {
    setLoading(envioId)
    const result = await actualizarEstadoEnvio(envioId, nuevoEstado)
    setLoading(null)
    
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }
  
  const getProximoEstado = (estadoActual: string) => {
    const flujo = ['pendiente', 'en_preparacion', 'en_transito', 'entregado']
    const idx = flujo.indexOf(estadoActual)
    return idx < flujo.length - 1 ? flujo[idx + 1] : null
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {envios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No hay envíos registrados
                </TableCell>
              </TableRow>
            ) : (
              envios.map((envio) => {
                const config = estadoConfig[envio.estado as keyof typeof estadoConfig] || estadoConfig.pendiente
                const proximoEstado = getProximoEstado(envio.estado)
                
                return (
                  <TableRow key={envio.id}>
                    <TableCell className="font-mono text-sm">#{envio.id.slice(0, 8)}</TableCell>
                    <TableCell>{envio.sucursalOrigen.nombre}</TableCell>
                    <TableCell>{envio.sucursalDestino.nombre}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {envio.items.slice(0, 2).map((item, idx) => (
                          <div key={idx}>
                            {item.producto.nombre} ({item.cantidadSolicitada})
                          </div>
                        ))}
                        {envio.items.length > 2 && (
                          <div className="text-muted-foreground">
                            +{envio.items.length - 2} más
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(envio.createdAt), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      {proximoEstado && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCambiarEstado(envio.id, proximoEstado)}
                          disabled={loading === envio.id}
                        >
                          {loading === envio.id ? 'Procesando...' : `→ ${estadoConfig[proximoEstado as keyof typeof estadoConfig].label}`}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
