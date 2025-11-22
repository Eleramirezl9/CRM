'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { NativeSelect } from '@/compartido/componentes/ui/native-select'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { actualizarEnvio } from '@/caracteristicas/envios/acciones'
import { obtenerSucursales } from '@/caracteristicas/inventario/acciones'
import { obtenerProductos } from '@/caracteristicas/productos/acciones'
import { Save, Package, ArrowRight } from 'lucide-react'

type Envio = {
  id: string
  estado: string
  sucursalOrigenId: string
  sucursalDestinoId: string
  sucursalOrigen: { nombre: string }
  sucursalDestino: { nombre: string }
  items: Array<{
    productoId: string
    cantidadSolicitada: number
    producto: { nombre: string; sku: string }
  }>
}

type Producto = {
  id: string
  nombre: string
  sku: string
}

type Sucursal = {
  id: string
  nombre: string
}

export default function EnvioEditForm({ envio }: { envio: Envio }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [productos, setProductos] = useState<Producto[]>([])

  const [sucursalDestinoId, setSucursalDestinoId] = useState(envio.sucursalDestinoId)
  const [cantidades, setCantidades] = useState<Record<string, number>>(() => {
    // Inicializar con las cantidades actuales del envío
    const inicial: Record<string, number> = {}
    envio.items.forEach(item => {
      inicial[item.productoId] = item.cantidadSolicitada
    })
    return inicial
  })

  useEffect(() => {
    const cargarDatos = async () => {
      const [sucursalesRes, productosRes] = await Promise.all([
        obtenerSucursales(),
        obtenerProductos()
      ])

      setSucursales(sucursalesRes.sucursales || [])
      setProductos(productosRes.productos || [])
    }

    cargarDatos()
  }, [])

  const itemsAEnviar = useMemo(() => {
    return Object.entries(cantidades)
      .filter(([_, cantidad]) => cantidad > 0)
      .map(([productoId, cantidadSolicitada]) => ({
        productoId,
        cantidadSolicitada
      }))
  }, [cantidades])

  const handleCantidadChange = (productoId: string, valor: string) => {
    const cantidad = parseInt(valor) || 0
    setCantidades(prev => ({
      ...prev,
      [productoId]: cantidad
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (itemsAEnviar.length === 0) {
      setError('Ingrese cantidad en al menos un producto')
      setLoading(false)
      return
    }

    const result = await actualizarEnvio(envio.id, {
      sucursalDestinoId: sucursalDestinoId !== envio.sucursalDestinoId ? sucursalDestinoId : undefined,
      items: itemsAEnviar,
    })

    setLoading(false)

    if (result.success) {
      router.push('/dashboard/envios')
      router.refresh()
    } else {
      setError(result.error || 'Error al actualizar envío')
    }
  }

  const estadoConfig: Record<string, { label: string; variant: 'outline' | 'secondary' }> = {
    pendiente: { label: 'Pendiente', variant: 'outline' },
    en_preparacion: { label: 'En Preparación', variant: 'secondary' },
  }

  const config = estadoConfig[envio.estado] || estadoConfig.pendiente

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info del envío */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">ORIGEN</Label>
              <div className="font-semibold p-2 bg-muted rounded">
                {envio.sucursalOrigen.nombre}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destino" className="text-xs font-medium text-muted-foreground">
                DESTINO
              </Label>
              <NativeSelect
                id="destino"
                value={sucursalDestinoId}
                onChange={(e) => setSucursalDestinoId(e.target.value)}
                className="font-semibold"
              >
                {sucursales
                  .filter(s => s.id !== envio.sucursalOrigenId)
                  .map((suc) => (
                    <option key={suc.id} value={suc.id}>
                      {suc.nombre}
                    </option>
                  ))}
              </NativeSelect>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de productos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" />
            Productos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <div className="grid grid-cols-[1fr_100px] sm:grid-cols-[1fr_120px] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
              <div>PRODUCTO</div>
              <div className="text-center">CANTIDAD</div>
            </div>

            <div className="divide-y max-h-[400px] overflow-y-auto">
              {productos.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  Cargando productos...
                </div>
              ) : (
                productos.map((producto) => (
                  <div
                    key={producto.id}
                    className={`grid grid-cols-[1fr_100px] sm:grid-cols-[1fr_120px] gap-2 px-4 py-3 items-center ${
                      (cantidades[producto.id] || 0) > 0 ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{producto.nombre}</div>
                      <div className="text-xs text-muted-foreground font-mono">{producto.sku}</div>
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={cantidades[producto.id] || ''}
                        onChange={(e) => handleCantidadChange(producto.id, e.target.value)}
                        className="text-center h-9"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {itemsAEnviar.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="text-sm font-medium">
              {itemsAEnviar.length} producto{itemsAEnviar.length !== 1 ? 's' : ''} - Total: {itemsAEnviar.reduce((sum, item) => sum + item.cantidadSolicitada, 0)} unidades
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="submit"
          disabled={loading || itemsAEnviar.length === 0}
          className="flex-1 sm:flex-none"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
