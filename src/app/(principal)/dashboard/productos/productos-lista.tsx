'use client'

import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import { Card, CardContent } from '@/compartido/componentes/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/compartido/componentes/ui/table'
import { eliminarProducto } from '@/caracteristicas/productos/acciones'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Producto = {
  id: string
  sku: string
  nombre: string
  costoUnitario: any
  precioVenta: any
  unidadMedida: string | null
  stockTotal: number
  stockMinimoTotal: number
  stockCritico: boolean
}

export default function ProductosLista({ productos }: { productos: Producto[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  
  const handleEliminar = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este producto?')) return
    
    setLoading(id)
    const result = await eliminarProducto(id)
    setLoading(null)
    
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }
  
  const calcularMargen = (costo: any, precio: any) => {
    const c = parseFloat(costo.toString())
    const p = parseFloat(precio.toString())
    if (c === 0) return 0
    return (((p - c) / c) * 100).toFixed(1)
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Precio Venta</TableHead>
              <TableHead>Margen</TableHead>
              <TableHead>Stock Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No hay productos registrados
                </TableCell>
              </TableRow>
            ) : (
              productos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell className="font-mono text-sm">{producto.sku}</TableCell>
                  <TableCell className="font-medium">{producto.nombre}</TableCell>
                  <TableCell>${parseFloat(producto.costoUnitario.toString()).toFixed(2)}</TableCell>
                  <TableCell>${parseFloat(producto.precioVenta.toString()).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={parseFloat(calcularMargen(producto.costoUnitario, producto.precioVenta) as string) > 30 ? 'success' : 'warning'}>
                      {calcularMargen(producto.costoUnitario, producto.precioVenta)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {producto.stockTotal} {producto.unidadMedida || 'u'}
                  </TableCell>
                  <TableCell>
                    {producto.stockCritico ? (
                      <Badge variant="destructive">Stock Crítico</Badge>
                    ) : (
                      <Badge variant="success">Normal</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/productos/${producto.id}`)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleEliminar(producto.id)}
                      disabled={loading === producto.id}
                    >
                      {loading === producto.id ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
