'use client'

import { Badge } from '@/compartido/componentes/ui/badge'
import { Card, CardContent } from '@/compartido/componentes/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/compartido/componentes/ui/table'
import { Button } from '@/compartido/componentes/ui/button'
import { useState } from 'react'
import MovimientoDialog from './movimiento-dialog'

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
  
  const handleMovimiento = (producto: Consolidado) => {
    setSelectedProducto(producto)
    setShowDialog(true)
  }
  
  return (
    <>
      <Card>
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
              {consolidado.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay productos en inventario
                  </TableCell>
                </TableRow>
              ) : (
                consolidado.map((item) => (
                  <TableRow key={item.producto.id}>
                    <TableCell className="font-mono text-sm">{item.producto.sku}</TableCell>
                    <TableCell className="font-medium">{item.producto.nombre}</TableCell>
                    <TableCell>
                      {item.stockTotal} {item.producto.unidadMedida || 'u'}
                    </TableCell>
                    <TableCell>
                      {item.stockMinimoTotal} {item.producto.unidadMedida || 'u'}
                    </TableCell>
                    <TableCell>
                      {item.alertaCritica ? (
                        <Badge variant="destructive">Crítico</Badge>
                      ) : item.stockTotal < item.stockMinimoTotal * 1.5 ? (
                        <Badge variant="warning">Bajo</Badge>
                      ) : (
                        <Badge variant="success">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {item.sucursales.map((suc, idx) => (
                          <div key={idx} className={suc.critico ? 'text-destructive font-medium' : ''}>
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
