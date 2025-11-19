'use client'

import { Button } from '@/compartido/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { migrarProduccionesSinTurno } from '@/caracteristicas/produccion/acciones'
import { useState } from 'react'

export default function MigrarTurnosPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleMigrar = async () => {
    setLoading(true)
    const res = await migrarProduccionesSinTurno()
    setLoading(false)
    setResult(res)
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Migrar Producciones Sin Turno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta herramienta actualiza todas las producciones que no tienen turno asignado.
            Se les asignará el turno "Mañana" por defecto.
          </p>

          <Button onClick={handleMigrar} disabled={loading} className="w-full">
            {loading ? 'Migrando...' : 'Ejecutar Migración'}
          </Button>

          {result && (
            <div className={`p-4 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
              {result.success ? (
                <p className="text-green-800">
                  ✅ Migración exitosa. Se actualizaron {result.count} registros.
                </p>
              ) : (
                <p className="text-red-800">
                  ❌ Error: {result.error}
                </p>
              )}
            </div>
          )}

          {result?.success && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Ahora puedes volver a la página de producción
              </p>
              <Button onClick={() => window.location.href = '/dashboard/produccion'}>
                Ir a Producción
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
