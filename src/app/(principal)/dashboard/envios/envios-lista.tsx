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
import { Printer, Pencil } from 'lucide-react'
import Link from 'next/link'

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
  const [loadingEstado, setLoadingEstado] = useState<string | null>(null)

  const handleImprimir = (envio: Envio) => {
    const fecha = format(new Date(envio.createdAt), "dd 'de' MMMM yyyy", { locale: es })
    const hora = format(new Date(envio.createdAt), 'HH:mm', { locale: es })

    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Envío #${envio.id.slice(0, 8)}</title>
        <style>
          body { font-family: monospace; font-size: 12px; padding: 20px; max-width: 300px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 10px; }
          .header h1 { font-size: 16px; margin: 0 0 5px 0; }
          .info { margin-bottom: 10px; }
          .info div { display: flex; justify-content: space-between; margin: 3px 0; }
          .productos { border-top: 2px solid black; border-bottom: 2px solid black; padding: 10px 0; margin: 10px 0; }
          .productos-header { display: grid; grid-template-columns: 1fr 50px; font-weight: bold; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dashed black; }
          .producto { display: grid; grid-template-columns: 1fr 50px; padding: 3px 0; }
          .producto-cant { text-align: center; font-weight: bold; }
          .totales { margin: 10px 0; }
          .totales div { display: flex; justify-content: space-between; font-weight: bold; }
          .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
          .firma { text-align: center; }
          .firma-linea { border-bottom: 1px solid black; height: 40px; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DOCUMENTO DE ENVIO</h1>
          <div>#${envio.id.slice(0, 8).toUpperCase()}</div>
        </div>

        <div class="info">
          <div><span><b>Fecha:</b></span><span>${fecha}</span></div>
          <div><span><b>Hora:</b></span><span>${hora}</span></div>
          <div style="border-top: 1px dashed black; margin-top: 5px; padding-top: 5px;">
            <span><b>Origen:</b></span><span>${envio.sucursalOrigen.nombre}</span>
          </div>
          <div><span><b>Destino:</b></span><span>${envio.sucursalDestino.nombre}</span></div>
        </div>

        <div class="productos">
          <div class="productos-header">
            <div>PRODUCTO</div>
            <div style="text-align: center">CANT</div>
          </div>
          ${envio.items.map(item => `
            <div class="producto">
              <div>${item.producto.nombre}</div>
              <div class="producto-cant">${item.cantidadSolicitada}</div>
            </div>
          `).join('')}
        </div>

        <div class="totales">
          <div><span>TOTAL PRODUCTOS:</span><span>${envio.items.length}</span></div>
          <div><span>TOTAL UNIDADES:</span><span>${envio.items.reduce((sum, item) => sum + item.cantidadSolicitada, 0)}</span></div>
        </div>

        <div class="firmas">
          <div class="firma">
            <div class="firma-linea"></div>
            <div>Entrega</div>
          </div>
          <div class="firma">
            <div class="firma-linea"></div>
            <div>Recibe</div>
          </div>
        </div>
      </body>
      </html>
    `

    const ventana = window.open('', '_blank', 'width=400,height=600')
    if (ventana) {
      ventana.document.write(contenido)
      ventana.document.close()
      ventana.onload = () => {
        ventana.print()
      }
    }
  }

  const handleCambiarEstado = async (envioId: string, nuevoEstado: string) => {
    if (loadingEstado) return // Prevenir doble click

    setLoadingEstado(envioId)

    try {
      const result = await actualizarEstadoEnvio(envioId, nuevoEstado)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Error al cambiar estado')
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setLoadingEstado(null)
    }
  }
  
  const getProximoEstado = (estadoActual: string) => {
    const flujo = ['pendiente', 'en_preparacion', 'en_transito', 'entregado']
    const idx = flujo.indexOf(estadoActual)
    return idx < flujo.length - 1 ? flujo[idx + 1] : null
  }
  
  return (
    <>
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
                      <div className="flex items-center justify-end gap-1">
                        {/* Editar - solo si no está en tránsito o entregado */}
                        {(envio.estado === 'pendiente' || envio.estado === 'en_preparacion') && (
                          <Link href={`/dashboard/envios/${envio.id}/editar`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleImprimir(envio)}
                          title="Imprimir"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        {proximoEstado && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCambiarEstado(envio.id, proximoEstado)}
                            disabled={loadingEstado === envio.id}
                          >
                            {loadingEstado === envio.id ? (
                              <span className="animate-pulse">Procesando...</span>
                            ) : (
                              `→ ${estadoConfig[proximoEstado as keyof typeof estadoConfig].label}`
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </>
  )
}
