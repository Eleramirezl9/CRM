'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/compartido/componentes/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { crearSucursal, actualizarSucursal, obtenerGerentes } from '@/caracteristicas/sucursales/acciones'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const SucursalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  direccion: z.string().optional(),
  codigoUnico: z.string().min(1, 'El código único es requerido'),
  gerenteId: z.string().optional(),
  metaVentas: z.string().min(0, 'La meta de ventas debe ser mayor o igual a 0'),
})

type SucursalFormData = z.infer<typeof SucursalSchema>

interface SucursalFormProps {
  sucursal?: any // Sucursal existente para edición
  onSuccess?: () => void
}

export default function SucursalForm({ sucursal, onSuccess }: SucursalFormProps) {
  const [gerentes, setGerentes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingGerentes, setIsLoadingGerentes] = useState(true)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SucursalFormData>({
    resolver: zodResolver(SucursalSchema),
    defaultValues: {
      nombre: sucursal?.nombre || '',
      direccion: sucursal?.direccion || '',
      codigoUnico: sucursal?.codigoUnico || '',
      gerenteId: sucursal?.gerenteId?.toString() || '',
      metaVentas: sucursal?.metaVentas?.toString() || '0',
    },
  })

  // Cargar gerentes disponibles
  useEffect(() => {
    const cargarGerentes = async () => {
      try {
        const { success, gerentes: gerentesData } = await obtenerGerentes()
        if (success) {
          setGerentes(gerentesData)
        }
      } catch (error) {
        console.error('Error al cargar gerentes:', error)
      } finally {
        setIsLoadingGerentes(false)
      }
    }

    cargarGerentes()
  }, [])

  // Generar código único automáticamente
  const generarCodigoUnico = () => {
    const timestamp = Date.now()
    const codigo = `SUC-${timestamp.toString().slice(-6)}`
    setValue('codigoUnico', codigo)
  }

  const onSubmit = async (data: SucursalFormData) => {
    setIsLoading(true)
    try {
      const formData = {
        ...data,
        gerenteId: data.gerenteId ? parseInt(data.gerenteId) : undefined,
        metaVentas: parseFloat(data.metaVentas) || 0,
      }

      let result
      if (sucursal) {
        result = await actualizarSucursal(sucursal.id, formData)
      } else {
        result = await crearSucursal(formData)
      }

      if (result.success) {
        toast.success(
          sucursal 
            ? 'Sucursal actualizada exitosamente' 
            : 'Sucursal creada exitosamente'
        )
        
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/dashboard/sucursales')
        }
      } else {
        toast.error(result.error || 'Error al guardar sucursal')
      }
    } catch (error) {
      console.error('Error al guardar sucursal:', error)
      toast.error('Error inesperado al guardar sucursal')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {sucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Sucursal *</Label>
            <Input
              id="nombre"
              {...register('nombre')}
              placeholder="Ej: Sucursal Centro"
              className={errors.nombre ? 'border-red-500' : ''}
            />
            {errors.nombre && (
              <p className="text-sm text-red-500">{errors.nombre.message}</p>
            )}
          </div>

          {/* Código Único */}
          <div className="space-y-2">
            <Label htmlFor="codigoUnico">Código Único *</Label>
            <div className="flex gap-2">
              <Input
                id="codigoUnico"
                {...register('codigoUnico')}
                placeholder="Ej: SUC-001"
                className={errors.codigoUnico ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="outline"
                onClick={generarCodigoUnico}
                disabled={isLoading}
              >
                Generar
              </Button>
            </div>
            {errors.codigoUnico && (
              <p className="text-sm text-red-500">{errors.codigoUnico.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Código único para identificar la sucursal
            </p>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              {...register('direccion')}
              placeholder="Ej: Av. Principal 123, Centro"
            />
          </div>

          {/* Gerente */}
          <div className="space-y-2">
            <Label htmlFor="gerenteId">Gerente</Label>
            <Select
              value={watch('gerenteId') || 'none'}
              onValueChange={(value) => setValue('gerenteId', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin gerente asignado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin gerente asignado</SelectItem>
                {isLoadingGerentes ? (
                  <SelectItem value="loading" disabled>
                    Cargando gerentes...
                  </SelectItem>
                ) : gerentes.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    No hay gerentes disponibles
                  </SelectItem>
                ) : (
                  gerentes.map((gerente) => (
                    <SelectItem key={gerente.id} value={gerente.id.toString()}>
                      {gerente.nombre} ({gerente.correo})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Solo se muestran usuarios con rol "sucursal" sin sucursal asignada
            </p>
          </div>

          {/* Meta de Ventas */}
          <div className="space-y-2">
            <Label htmlFor="metaVentas">Meta de Ventas Mensual</Label>
            <Input
              id="metaVentas"
              type="number"
              step="0.01"
              min="0"
              {...register('metaVentas')}
              placeholder="0"
              className={errors.metaVentas ? 'border-red-500' : ''}
            />
            {errors.metaVentas && (
              <p className="text-sm text-red-500">{errors.metaVentas.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Meta de ventas mensual en pesos
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {sucursal ? 'Actualizar Sucursal' : 'Crear Sucursal'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
