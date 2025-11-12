'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/compartido/componentes/ui/card'
import { Textarea } from '@/compartido/componentes/ui/textarea'
import { registrarProduccion } from '@/caracteristicas/produccion/acciones'
import { obtenerProductos } from '@/caracteristicas/productos/acciones'
import { Package, Calculator, Search, Check } from 'lucide-react'

type Producto = {
  id: string
  nombre: string
  unidadMedida: string | null
}

export default function ProduccionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [success, setSuccess] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    productoId: '',
    cantidadContenedores: 0,
    unidadesPorContenedor: 0,
    observaciones: '',
  })

  // Cargar productos
  useEffect(() => {
    async function cargarProductos() {
      const result = await obtenerProductos()
      if (result.success && result.productos) {
        setProductos(result.productos)
      }
    }
    cargarProductos()
  }, [])

  // Filtrar productos según búsqueda
  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  // Seleccionar producto
  const seleccionarProducto = (producto: Producto) => {
    setFormData({ ...formData, productoId: producto.id })
    setBusqueda(producto.nombre)
    setMostrarDropdown(false)
    setSelectedIndex(-1)
    // Enfocar el siguiente input
    setTimeout(() => {
      document.getElementById('cantidadContenedores')?.focus()
    }, 100)
  }

  // Manejar teclas de navegación
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mostrarDropdown) {
      if (e.key === 'Enter') {
        e.preventDefault()
        setMostrarDropdown(true)
      }
      return
    }

    const listaActual = busqueda ? productosFiltrados : productos

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < listaActual.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && listaActual[selectedIndex]) {
          seleccionarProducto(listaActual[selectedIndex])
        }
        break
      case 'Escape':
        setMostrarDropdown(false)
        setSelectedIndex(-1)
        break
      case 'Tab':
        setMostrarDropdown(false)
        break
    }
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setMostrarDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll automático al elemento seleccionado
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[0]?.children[selectedIndex + (busqueda ? 0 : 1)]
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex, busqueda])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Validaciones
    if (!formData.productoId) {
      setError('Debes seleccionar un producto')
      setLoading(false)
      return
    }

    if (formData.cantidadContenedores <= 0) {
      setError('La cantidad de contenedores debe ser mayor a 0')
      setLoading(false)
      return
    }

    if (formData.unidadesPorContenedor <= 0) {
      setError('Las unidades por contenedor deben ser mayor a 0')
      setLoading(false)
      return
    }

    const result = await registrarProduccion(formData)

    setLoading(false)

    if (result.success) {
      setSuccess(true)
      // Limpiar formulario
      setFormData({
        productoId: '',
        cantidadContenedores: 0,
        unidadesPorContenedor: 0,
        observaciones: '',
      })
      setBusqueda('')

      // Callback de éxito
      if (onSuccess) {
        onSuccess()
      }

      // Enfocar el input de búsqueda para siguiente registro
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error || 'Error al registrar producción')
    }
  }

  const totalUnidades = formData.cantidadContenedores * formData.unidadesPorContenedor
  const productoSeleccionado = productos.find(p => p.id === formData.productoId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Registrar Producción del Día
        </CardTitle>
        <CardDescription>
          Registra de forma simple lo que produciste hoy. Ejemplo: Francés 100 latas, 24 panes por lata.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Buscador de productos con autocompletado */}
          <div className="space-y-2 relative">
            <Label htmlFor="producto">¿Qué producto hiciste? *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                id="producto"
                type="text"
                placeholder="Buscar producto... (ej: Francés, Integral)"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setMostrarDropdown(true)
                  setSelectedIndex(-1)
                }}
                onFocus={() => setMostrarDropdown(true)}
                onKeyDown={handleKeyDown}
                className="pl-10"
                autoComplete="off"
              />
              {productoSeleccionado && (
                <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600" />
              )}
            </div>

            {/* Dropdown de resultados */}
            {mostrarDropdown && (
              <div
                ref={dropdownRef}
                className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto"
              >
                {/* Mostrar productos filtrados o todos si no hay búsqueda */}
                {(busqueda ? productosFiltrados : productos).length > 0 ? (
                  <>
                    {!busqueda && (
                      <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground sticky top-0">
                        Todos los productos ({productos.length})
                      </div>
                    )}
                    {(busqueda ? productosFiltrados : productos).map((producto, index) => (
                      <button
                        key={producto.id}
                        type="button"
                        onClick={() => seleccionarProducto(producto)}
                        className={`w-full text-left px-4 py-4 hover:bg-accent transition-colors flex items-center justify-between ${
                          index === selectedIndex ? 'bg-accent' : ''
                        } ${formData.productoId === producto.id ? 'bg-primary/10' : ''}`}
                      >
                        <div>
                          <div className="font-medium">{producto.nombre}</div>
                          {producto.unidadMedida && (
                            <div className="text-xs text-muted-foreground">
                              Unidad: {producto.unidadMedida}
                            </div>
                          )}
                        </div>
                        {formData.productoId === producto.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    {busqueda ? `No se encontraron productos con "${busqueda}"` : 'No hay productos disponibles'}
                  </div>
                )}
              </div>
            )}

            {/* Sugerencia de uso */}
            {!busqueda && !mostrarDropdown && (
              <div className="text-xs text-muted-foreground">
                💡 Tip: Click o Enter para ver todos los productos, o escribe para buscar
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cantidadContenedores">
                ¿Cuántos contenedores? *
              </Label>
              <div className="text-xs text-muted-foreground mb-1">
                Ej: 100 latas, 50 bandejas
              </div>
              <Input
                id="cantidadContenedores"
                type="number"
                min="1"
                value={formData.cantidadContenedores || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  cantidadContenedores: parseInt(e.target.value) || 0
                })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    document.getElementById('unidadesPorContenedor')?.focus()
                  }
                }}
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidadesPorContenedor">
                ¿Cuántas unidades por contenedor? *
              </Label>
              <div className="text-xs text-muted-foreground mb-1">
                Ej: 24 panes por lata
              </div>
              <Input
                id="unidadesPorContenedor"
                type="number"
                min="1"
                value={formData.unidadesPorContenedor || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  unidadesPorContenedor: parseInt(e.target.value) || 0
                })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    // Si hay valores válidos, submit directo. Si no, ir a observaciones
                    if (formData.productoId && formData.cantidadContenedores > 0 && formData.unidadesPorContenedor > 0) {
                      handleSubmit(e as any)
                    } else {
                      document.getElementById('observaciones')?.focus()
                    }
                  }
                }}
                placeholder="24"
              />
            </div>
          </div>

          {totalUnidades > 0 && (
            <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Total Calculado</span>
              </div>
              <div className="text-3xl font-bold text-primary">
                {totalUnidades.toLocaleString()} {productoSeleccionado?.unidadMedida || 'unidades'}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {formData.cantidadContenedores} contenedores × {formData.unidadesPorContenedor} unidades
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones (opcional)</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Alguna nota o comentario adicional..."
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 text-green-600 rounded-md text-sm">
              ✓ Producción registrada exitosamente! Bodega podrá ver este producto disponible.
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? 'Guardando...' : 'Registrar Producción'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
