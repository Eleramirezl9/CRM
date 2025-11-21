'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/compartido/componentes/ui/dialog'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { NativeSelect as Select } from '@/compartido/componentes/ui/native-select'
import { registrarMovimiento } from '@/caracteristicas/inventario/acciones'
import { useSucursales } from '@/compartido/hooks/useSucursales'
import { useRouter } from 'next/navigation'

type Producto = {
  producto: {
    id: string
    nombre: string
  }
  sucursales: Array<{
    sucursal: string
    cantidad: number
  }>
}

export default function MovimientoDialog({
  open,
  onOpenChange,
  producto,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: Producto
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { sucursales } = useSucursales()
  const [confirmacion, setConfirmacion] = useState<any>(null)

  const [formData, setFormData] = useState({
    sucursalId: '',
    tipo: 'entrada' as 'entrada' | 'salida',
    cantidad: 0,
    motivo: '',
  })

  useEffect(() => {
    if (open) {
      setConfirmacion(null)
    }
  }, [open])
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.sucursalId) {
      alert('Selecciona una sucursal')
      return
    }

    if (formData.cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0')
      return
    }

    setLoading(true)

    const result = await registrarMovimiento({
      productoId: producto.producto.id,
      sucursalId: formData.sucursalId,
      tipo: formData.tipo,
      cantidad: formData.cantidad,
      motivo: formData.motivo || undefined,
    })

    setLoading(false)

    if (result.success) {
      setConfirmacion(result)

      // Cerrar después de 2 segundos y refrescar
      setTimeout(() => {
        onOpenChange(false)
        setConfirmacion(null)
        router.refresh()
      }, 2000)
    } else {
      alert(result.error)
    }
  }, [formData, producto.producto.id, onOpenChange, router])
  
  if (confirmacion) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">✓ Movimiento Registrado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Producto</div>
                <div className="font-medium">{confirmacion.producto}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Sucursal</div>
                <div className="font-medium">{confirmacion.sucursal}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Stock Anterior</div>
                <div className="font-medium">{confirmacion.stockAnterior}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Stock Nuevo</div>
                <div className="font-medium text-green-600">{confirmacion.stockNuevo}</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Movimiento</DialogTitle>
          <DialogDescription>
            {producto.producto.nombre}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sucursal">Sucursal</Label>
            <Select
              id="sucursal"
              value={formData.sucursalId}
              onChange={(e) => setFormData({ ...formData, sucursalId: e.target.value })}
              required
            >
              <option value="">Seleccionar sucursal</option>
              {sucursales.map((suc) => (
                <option key={suc.id} value={suc.id}>
                  {suc.nombre}
                </option>
              ))}
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Movimiento</Label>
            <Select
              id="tipo"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
              required
              data-testid="tipo-movimiento"
            >
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input
              id="cantidad"
              type="number"
              min="1"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
              required
              data-testid="cantidad-movimiento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Input
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Ej: Compra, Ajuste, Merma"
              data-testid="motivo-movimiento"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} data-testid="confirmar-movimiento">
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
