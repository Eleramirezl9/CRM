'use client'

import { Badge } from '@/compartido/componentes/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/compartido/componentes/ui/table'
import { Button } from '@/compartido/componentes/ui/button'
import { NativeSelect as Select } from '@/compartido/componentes/ui/native-select'
import { Label } from '@/compartido/componentes/ui/label'
import { useState, useMemo } from 'react'
import { useSucursales } from '@/compartido/hooks/useSucursales'
import { Package, AlertTriangle, Send, MapPin, Warehouse, Store } from 'lucide-react'
import { NumeroFormateado } from '@/compartido/componentes/NumeroFormateado'
import Link from 'next/link'

type Consolidado = {
  producto: {
    id: string
    sku: string
    nombre: string
    unidadMedida: string | null
  }
  stockTotal: number
  stockMinimoTotal: number
  alertaCritica: boolean
  sucursales: Array<{
    sucursal: string
    cantidad: number
    minimo: number
    critico: boolean
  }>
}

export default function InventarioVista({ consolidado }: { consolidado: Consolidado[] }) {
  const { sucursales } = useSucursales()
  const [filtroSucursal, setFiltroSucursal] = useState('')

  // Filtrar consolidado por sucursal si está seleccionada (memoizado)
  const consolidadoFiltrado = useMemo(() => {
    if (!filtroSucursal) return consolidado

    return consolidado
      .map(item => ({
        ...item,
        sucursales: item.sucursales.filter(s =>
          s.sucursal.toLowerCase().includes(filtroSucursal.toLowerCase())
        ),
      }))
      .filter(item => item.sucursales.length > 0)
  }, [consolidado, filtroSucursal])

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const total = consolidado.reduce((sum, item) => sum + item.stockTotal, 0)
    const criticos = consolidado.filter(item => item.alertaCritica).length
    const bajos = consolidado.filter(item => !item.alertaCritica && item.stockTotal < item.stockMinimoTotal * 1.5).length

    // Calcular stock en bodega vs sucursales
    const stockBodega = consolidado.reduce((sum, item) => {
      const bodega = item.sucursales.find(s =>
        s.sucursal.toLowerCase().includes('bodega') ||
        s.sucursal.toLowerCase().includes('central')
      )
      return sum + (bodega?.cantidad || 0)
    }, 0)
    const stockSucursales = total - stockBodega

    return { total, criticos, bajos, productos: consolidado.length, stockBodega, stockSucursales }
  }, [consolidado])

  return (
    <>
      {/* Acciones y Filtro */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Label className="whitespace-nowrap">Filtrar por Sucursal</Label>
              <Select
                value={filtroSucursal}
                onChange={(e) => setFiltroSucursal(e.target.value)}
                className="w-full sm:w-64"
                data-testid="filtro-sucursal"
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((suc) => (
                  <option key={suc.id} value={suc.id}>
                    {suc.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <Link href="/dashboard/envios/nuevo">
              <Button className="w-full sm:w-auto">
                <Send className="w-4 h-4 mr-2" />
                Crear Envío
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Vista de tabla para desktop */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventario por Producto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Por Sucursal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consolidadoFiltrado.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay productos en inventario
                    </TableCell>
                  </TableRow>
                ) : (
                  consolidadoFiltrado.map((item, idx) => (
                    <TableRow key={item.producto.id}>
                      <TableCell className="font-mono text-sm">{item.producto.sku}</TableCell>
                      <TableCell className="font-medium">{item.producto.nombre}</TableCell>
                      <TableCell data-testid={`stock-${idx + 1}`}>
                        <NumeroFormateado valor={item.stockTotal} /> {item.producto.unidadMedida || 'u'}
                      </TableCell>
                      <TableCell>
                        <NumeroFormateado valor={item.stockMinimoTotal} /> {item.producto.unidadMedida || 'u'}
                      </TableCell>
                      <TableCell>
                        {item.alertaCritica ? (
                          <Badge variant="destructive" data-testid="alerta-critica">Crítico</Badge>
                        ) : item.stockTotal < item.stockMinimoTotal * 1.5 ? (
                          <Badge variant="warning">Bajo</Badge>
                        ) : (
                          <Badge variant="success">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {/* Bodega Central primero */}
                          {item.sucursales
                            .filter(s => s.sucursal.toLowerCase().includes('bodega') || s.sucursal.toLowerCase().includes('central'))
                            .map((suc, sucIdx) => (
                              <div
                                key={`bodega-${sucIdx}`}
                                className="p-1.5 bg-blue-50 border-l-2 border-blue-500 rounded-r mb-2"
                                data-testid="nombre-sucursal"
                              >
                                <span className="font-semibold text-blue-700">{suc.sucursal}:</span>{' '}
                                <span className="font-bold text-blue-800"><NumeroFormateado valor={suc.cantidad} /></span>
                              </div>
                            ))
                          }
                          {/* Sucursales */}
                          {item.sucursales
                            .filter(s => !s.sucursal.toLowerCase().includes('bodega') && !s.sucursal.toLowerCase().includes('central'))
                            .map((suc, sucIdx) => (
                              <div
                                key={sucIdx}
                                className={`pl-1.5 ${suc.critico ? 'text-destructive font-medium' : ''}`}
                                data-testid="nombre-sucursal"
                              >
                                {suc.sucursal}: <NumeroFormateado valor={suc.cantidad} />
                              </div>
                            ))
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Vista de cards para móvil y tablet */}
      <div className="lg:hidden space-y-4">
        {consolidadoFiltrado.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay productos en inventario</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          consolidadoFiltrado.map((item, idx) => (
            <Card key={item.producto.id} className={item.alertaCritica ? 'border-red-200 bg-red-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.producto.nombre}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{item.producto.sku}</p>
                  </div>
                  {item.alertaCritica ? (
                    <Badge variant="destructive" data-testid="alerta-critica">Crítico</Badge>
                  ) : item.stockTotal < item.stockMinimoTotal * 1.5 ? (
                    <Badge variant="warning">Bajo</Badge>
                  ) : (
                    <Badge variant="success">Normal</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground">Stock Total</div>
                    <div className="text-xl font-bold" data-testid={`stock-${idx + 1}`}>
                      <NumeroFormateado valor={item.stockTotal} />
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground">Stock Mínimo</div>
                    <div className="text-xl font-bold">
                      <NumeroFormateado valor={item.stockMinimoTotal} />
                    </div>
                  </div>
                </div>

                {/* Distribución por sucursal */}
                <div className="mb-4">
                  {/* Bodega Central primero */}
                  {item.sucursales.some(s => s.sucursal.toLowerCase().includes('bodega') || s.sucursal.toLowerCase().includes('central')) && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                        <Warehouse className="w-3 h-3" />
                        Disponible en Bodega
                      </h4>
                      {item.sucursales
                        .filter(s => s.sucursal.toLowerCase().includes('bodega') || s.sucursal.toLowerCase().includes('central'))
                        .map((suc, sucIdx) => (
                          <div
                            key={`bodega-${sucIdx}`}
                            className="text-sm p-3 rounded bg-blue-50 border-l-4 border-blue-500"
                            data-testid="nombre-sucursal"
                          >
                            <div className="font-medium text-blue-800">{suc.sucursal}</div>
                            <div className="text-2xl font-bold text-blue-700">
                              <NumeroFormateado valor={suc.cantidad} />
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}

                  {/* Sucursales */}
                  {item.sucursales.some(s => !s.sucursal.toLowerCase().includes('bodega') && !s.sucursal.toLowerCase().includes('central')) && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        En Sucursales
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {item.sucursales
                          .filter(s => !s.sucursal.toLowerCase().includes('bodega') && !s.sucursal.toLowerCase().includes('central'))
                          .map((suc, sucIdx) => (
                            <div
                              key={sucIdx}
                              className={`text-sm p-2 rounded ${
                                suc.critico
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-muted'
                              }`}
                              data-testid="nombre-sucursal"
                            >
                              <div className="font-medium truncate">{suc.sucursal}</div>
                              <div className="text-lg font-bold">
                                <NumeroFormateado valor={suc.cantidad} />
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  )
}
