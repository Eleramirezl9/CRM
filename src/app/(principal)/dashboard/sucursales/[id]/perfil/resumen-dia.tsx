'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Button } from '@/compartido/componentes/ui/button'
import { Badge } from '@/compartido/componentes/ui/badge'
import { cerrarOperacionDia } from '@/caracteristicas/sucursales/acciones'
import { toast } from 'react-hot-toast'
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Loader2 } from 'lucide-react'

interface ResumenDiaProps {
  sucursalId: string
  operacion: any
}

export default function ResumenDia({ sucursalId, operacion }: ResumenDiaProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!operacion) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">No hay operación para el día</h3>
          <p className="text-muted-foreground">
            Las operaciones se crean automáticamente cuando hay actividad
          </p>
        </CardContent>
      </Card>
    )
  }

  // Cálculos
  const totalAVender = parseFloat(operacion.totalAVender.toString())
  const totalVendido = parseFloat(operacion.totalVendido.toString())
  const totalCosto = parseFloat(operacion.totalCosto.toString())
  const totalPerdidas = parseFloat(operacion.totalPerdidas.toString())
  const efectivoReal = parseFloat(operacion.efectivoReal.toString())
  
  const sobranteManana = totalAVender - totalVendido - totalPerdidas
  const gananciaNeta = totalVendido - totalCosto - totalPerdidas
  const margen = totalVendido > 0 ? (gananciaNeta / totalVendido) * 100 : 0

  const handleCerrarDia = async () => {
    setIsLoading(true)
    try {
      const result = await cerrarOperacionDia(operacion.id)
      
      if (result.success) {
        toast.success('Operación del día cerrada exitosamente')
        window.location.reload()
      } else {
        toast.error(result.error || 'Error al cerrar operación')
      }
    } catch (error) {
      console.error('Error al cerrar operación:', error)
      toast.error('Error inesperado al cerrar operación')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Estado del día */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {operacion.cerrado ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Día Cerrado
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-blue-500" />
                Día en Progreso
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={operacion.cerrado ? 'default' : 'secondary'}>
              {operacion.cerrado ? 'Cerrado' : 'Activo'}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Fecha: {new Date(operacion.fecha).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Balance del día */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Balance del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Ingresos */}
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Ingresos
              </h4>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-green-700">Total a Vender:</span>
                  <span className="font-semibold text-green-800">
                    ${totalAVender.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">Total Vendido:</span>
                  <span className="font-semibold text-green-800">
                    ${totalVendido.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Egresos */}
            <div className="space-y-3">
              <h4 className="font-semibold text-red-600 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Egresos
              </h4>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-red-700">Costo Productos:</span>
                  <span className="font-semibold text-red-800">
                    ${totalCosto.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">Pérdidas:</span>
                  <span className="font-semibold text-red-800">
                    ${totalPerdidas.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen financiero */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumen Financiero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Efectivo a entregar */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800">Efectivo Real</h4>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                ${efectivoReal.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600">
                Dinero recaudado del día
              </p>
            </div>

            {/* Ganancia neta */}
            <div className={`p-4 rounded-lg ${gananciaNeta >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {gananciaNeta >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                <h4 className={`font-semibold ${gananciaNeta >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  Ganancia Neta
                </h4>
              </div>
              <p className={`text-2xl font-bold ${gananciaNeta >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                ${gananciaNeta.toLocaleString()}
              </p>
              <p className={`text-sm ${gananciaNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {gananciaNeta >= 0 ? 'Utilidad del día' : 'Pérdida del día'}
              </p>
            </div>

            {/* Margen */}
            <div className={`p-4 rounded-lg ${margen >= 15 ? 'bg-green-50' : margen >= 5 ? 'bg-yellow-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold text-gray-800">Margen</h4>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {margen.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">
                {margen >= 15 ? 'Excelente' : margen >= 5 ? 'Bueno' : 'Bajo'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sobrante para mañana */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventario para Mañana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Productos Sobrantes</h4>
                <p className="text-sm text-muted-foreground">
                  Productos que no se vendieron y quedan para el día siguiente
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  ${sobranteManana.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Valor total
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devoluciones del día */}
      {operacion.devoluciones && operacion.devoluciones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Devoluciones Registradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {operacion.devoluciones.map((devolucion: any) => (
                <div key={devolucion.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{devolucion.producto.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {devolucion.cantidad} unidades • {devolucion.motivo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        -${parseFloat(devolucion.costoTotal.toString()).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(devolucion.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón cerrar día */}
      {!operacion.cerrado && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h4 className="font-semibold mb-2">Finalizar Operación del Día</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Al cerrar el día, se generará el reporte final y se calcularán los sobrantes para mañana.
              </p>
              <Button
                onClick={handleCerrarDia}
                disabled={isLoading}
                className="w-full max-w-md"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cerrar Día y Generar Reporte
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje si el día está cerrado */}
      {operacion.cerrado && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h4 className="font-semibold mb-2">Operación del Día Cerrada</h4>
              <p className="text-sm text-muted-foreground">
                La operación del día ha sido finalizada. Los sobrantes han sido registrados 
                para el inventario del día siguiente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
