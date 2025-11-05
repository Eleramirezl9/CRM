import { Card, CardContent } from '@/compartido/componentes/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/compartido/componentes/ui/table'
import { Badge } from '@/compartido/componentes/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Venta = {
  id: string
  totalVenta: any
  metodoPago: string | null
  createdAt: Date
  sucursal: { nombre: string }
  vendedor: { nombre: string } | null
  items: Array<{
    producto: { nombre: string }
    cantidad: number
    precioUnitario: any
  }>
}

export default function VentasLista({ ventas }: { ventas: Venta[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Método Pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay ventas registradas
                </TableCell>
              </TableRow>
            ) : (
              ventas.map((venta) => (
                <TableRow key={venta.id} data-testid="venta-reciente">
                  <TableCell className="font-mono text-sm">#{venta.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(venta.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </TableCell>
                  <TableCell>{venta.sucursal.nombre}</TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      {venta.items.slice(0, 2).map((item, idx) => (
                        <div key={idx}>
                          {item.producto.nombre} x{item.cantidad}
                        </div>
                      ))}
                      {venta.items.length > 2 && (
                        <div className="text-muted-foreground">
                          +{venta.items.length - 2} más
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${parseFloat(venta.totalVenta.toString()).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {venta.metodoPago || 'N/A'}
                    </Badge>
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
