'use client'

import { Badge } from '@/compartido/componentes/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/compartido/componentes/ui/table'
import { Button } from '@/compartido/componentes/ui/button'
import { Select } from '@/compartido/componentes/ui/select'
import { Label } from '@/compartido/componentes/ui/label'
import { useState, useMemo, useCallback } from 'react'
import MovimientoDialog from './movimiento-dialog'
import { useSucursales } from '@/compartido/hooks/useSucursales'

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
  const [selectedProducto, setSelectedProducto] = useState<Consolidado | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const { sucursales } = useSucursales()
  const [filtroSucursal, setFiltroSucursal] = useState('')

  const handleMovimiento = useCallback((producto: Consolidado) => {
    setSelectedProducto(producto)
    setShowDialog(true)
  }, [])

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
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <CardTitle>Inventario por Producto</CardTitle>
            </div>
            <div className="w-64">
              <Label>Filtrar por Sucursal</Label>
              <Select
                value={filtroSucursal}
                onChange={(e) => setFiltroSucursal(e.target.value)}
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
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Stock Total</TableHead>
                <TableHead>Stock Mínimo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Distribución</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consolidadoFiltrado.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay productos en inventario
                  </TableCell>
                </TableRow>
              ) : (
                consolidadoFiltrado.map((item, idx) => (
                  <TableRow key={item.producto.id}>
                    <TableCell className="font-mono text-sm">{item.producto.sku}</TableCell>
                    <TableCell className="font-medium">{item.producto.nombre}</TableCell>
                    <TableCell data-testid={`stock-${idx + 1}`}>
                      {item.stockTotal} {item.producto.unidadMedida || 'u'}
                    </TableCell>
                    <TableCell>
                      {item.stockMinimoTotal} {item.producto.unidadMedida || 'u'}
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
                        {item.sucursales.map((suc, sucIdx) => (
                          <div
                            key={sucIdx}
                            className={suc.critico ? 'text-destructive font-medium' : ''}
                            data-testid="nombre-sucursal"
                          >
                            {suc.sucursal}: {suc.cantidad}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMovimiento(item)}
                        data-testid={`registrar-movimiento-${idx + 1}`}
                      >
                        Movimiento
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {selectedProducto && (
        <MovimientoDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          producto={selectedProducto}
        />
      )}
    </>
  )
}
