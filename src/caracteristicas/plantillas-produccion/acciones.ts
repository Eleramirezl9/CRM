'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/compartido/lib/dal'
import { checkPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { detectarTurno } from '@/compartido/lib/turnos'
import {
  crearPlantillaSchema,
  editarPlantillaSchema,
  aplicarPlantillaSchema
} from './schemas'
import type { PlantillaConItems } from './tipos'

/**
 * Obtener todas las plantillas por día de la semana
 */
export async function obtenerPlantillasPorDia(diaSemana: number) {
  try {
    await verifySession()

    const plantillas = await prisma.plantillaProduccion.findMany({
      where: {
        diaSemana,
        activa: true
      },
      include: {
        items: {
          include: {
            producto: true
          },
          orderBy: {
            orden: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return { success: true, plantillas: plantillas as PlantillaConItems[] }
  } catch (error) {
    console.error('Error al obtener plantillas:', error)
    return { success: false, error: 'Error al obtener plantillas', plantillas: [] }
  }
}

/**
 * Obtener todas las plantillas
 */
export async function obtenerTodasLasPlantillas() {
  try {
    await verifySession()

    const plantillas = await prisma.plantillaProduccion.findMany({
      include: {
        items: {
          include: {
            producto: true
          },
          orderBy: {
            orden: 'asc'
          }
        }
      },
      orderBy: [
        { diaSemana: 'asc' },
        { nombre: 'asc' }
      ]
    })

    return { success: true, plantillas: plantillas as PlantillaConItems[] }
  } catch (error) {
    console.error('Error al obtener plantillas:', error)
    return { success: false, error: 'Error al obtener plantillas', plantillas: [] }
  }
}

/**
 * Obtener una plantilla por ID
 */
export async function obtenerPlantillaPorId(id: string) {
  try {
    await verifySession()

    const plantilla = await prisma.plantillaProduccion.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            producto: true
          },
          orderBy: {
            orden: 'asc'
          }
        }
      }
    })

    if (!plantilla) {
      return { success: false, error: 'Plantilla no encontrada' }
    }

    return { success: true, plantilla: plantilla as PlantillaConItems }
  } catch (error) {
    console.error('Error al obtener plantilla:', error)
    return { success: false, error: 'Error al obtener plantilla' }
  }
}

/**
 * Crear nueva plantilla de producción
 */
export async function crearPlantilla(data: unknown) {
  try {
    const session = await verifySession()

    // Validar permisos
    const permisoCheck = await checkPermiso(PERMISOS.PRODUCCION_CREAR)
    if (!permisoCheck.authorized) {
      return { success: false, error: 'Sin permisos para crear plantillas' }
    }

    // Validar datos con Zod
    const validated = crearPlantillaSchema.parse(data)

    // Validar que todos los productos existan
    const productosIds = validated.items.map(item => item.productoId)
    const productosExistentes = await prisma.producto.findMany({
      where: { id: { in: productosIds } },
      select: { id: true }
    })

    if (productosExistentes.length !== productosIds.length) {
      return { success: false, error: 'Uno o más productos no existen' }
    }

    // Crear plantilla con items
    const plantilla = await prisma.plantillaProduccion.create({
      data: {
        nombre: validated.nombre,
        diaSemana: validated.diaSemana,
        descripcion: validated.descripcion,
        color: validated.color,
        items: {
          create: validated.items.map((item, index) => ({
            productoId: item.productoId,
            cantidadContenedores: item.cantidadContenedores,
            unidadesPorContenedor: item.unidadesPorContenedor,
            orden: item.orden ?? index
          }))
        }
      },
      include: {
        items: {
          include: {
            producto: true
          }
        }
      }
    })

    revalidatePath('/dashboard/produccion')
    revalidatePath('/dashboard/produccion/plantillas')

    return { success: true, plantilla: plantilla as PlantillaConItems }
  } catch (error) {
    console.error('Error al crear plantilla:', error)
    if (error instanceof Error && 'errors' in error) {
      return { success: false, error: 'Datos inválidos' }
    }
    return { success: false, error: 'Error al crear plantilla' }
  }
}

/**
 * Editar plantilla existente
 */
export async function editarPlantilla(data: unknown) {
  try {
    const session = await verifySession()

    // Validar permisos
    const permisoCheck = await checkPermiso(PERMISOS.PRODUCCION_EDITAR)
    if (!permisoCheck.authorized) {
      return { success: false, error: 'Sin permisos para editar plantillas' }
    }

    // Validar datos con Zod
    const validated = editarPlantillaSchema.parse(data)

    // Verificar que la plantilla exista
    const plantillaExistente = await prisma.plantillaProduccion.findUnique({
      where: { id: validated.id }
    })

    if (!plantillaExistente) {
      return { success: false, error: 'Plantilla no encontrada' }
    }

    // Validar que todos los productos existan
    const productosIds = validated.items.map(item => item.productoId)
    const productosExistentes = await prisma.producto.findMany({
      where: { id: { in: productosIds } },
      select: { id: true }
    })

    if (productosExistentes.length !== productosIds.length) {
      return { success: false, error: 'Uno o más productos no existen' }
    }

    // Eliminar items anteriores y crear los nuevos
    await prisma.plantillaProduccionItem.deleteMany({
      where: { plantillaId: validated.id }
    })

    // Actualizar plantilla con nuevos items
    const plantilla = await prisma.plantillaProduccion.update({
      where: { id: validated.id },
      data: {
        nombre: validated.nombre,
        diaSemana: validated.diaSemana,
        descripcion: validated.descripcion,
        color: validated.color,
        items: {
          create: validated.items.map((item, index) => ({
            productoId: item.productoId,
            cantidadContenedores: item.cantidadContenedores,
            unidadesPorContenedor: item.unidadesPorContenedor,
            orden: item.orden ?? index
          }))
        }
      },
      include: {
        items: {
          include: {
            producto: true
          }
        }
      }
    })

    revalidatePath('/dashboard/produccion')
    revalidatePath('/dashboard/produccion/plantillas')

    return { success: true, plantilla: plantilla as PlantillaConItems }
  } catch (error) {
    console.error('Error al editar plantilla:', error)
    if (error instanceof Error && 'errors' in error) {
      return { success: false, error: 'Datos inválidos' }
    }
    return { success: false, error: 'Error al editar plantilla' }
  }
}

/**
 * Aplicar plantilla a producción del día (con preview editable)
 */
export async function aplicarPlantilla(data: unknown) {
  try {
    const session = await verifySession()

    // Validar permisos
    const permisoCheck = await checkPermiso(PERMISOS.PRODUCCION_CREAR)
    if (!permisoCheck.authorized) {
      return { success: false, error: 'Sin permisos para aplicar plantillas' }
    }

    // Validar datos con Zod
    const validated = aplicarPlantillaSchema.parse(data)

    // Obtener plantilla con items
    const plantilla = await prisma.plantillaProduccion.findUnique({
      where: { id: validated.plantillaId },
      include: {
        items: {
          include: { producto: true },
          orderBy: { orden: 'asc' }
        }
      }
    })

    if (!plantilla) {
      return { success: false, error: 'Plantilla no encontrada' }
    }

    if (!plantilla.activa) {
      return { success: false, error: 'La plantilla está inactiva' }
    }

    const fechaProduccion = validated.fecha || new Date()
    const producciones = []

    // Si hay ajustes, usar esos valores; si no, usar los de la plantilla
    const itemsParaCrear = validated.ajustes && validated.ajustes.length > 0
      ? validated.ajustes
      : plantilla.items.map(item => ({
          productoId: item.productoId,
          cantidadContenedores: item.cantidadContenedores,
          unidadesPorContenedor: item.unidadesPorContenedor
        }))

    // Crear producción para cada item
    const turno = detectarTurno(fechaProduccion)

    for (const item of itemsParaCrear) {
      const totalUnidades = item.cantidadContenedores * item.unidadesPorContenedor

      const produccion = await prisma.produccionDiaria.upsert({
        where: {
          fecha_productoId_turno_numeroSecuencia: {
            fecha: fechaProduccion,
            productoId: item.productoId,
            turno,
            numeroSecuencia: 1
          }
        },
        update: {
          cantidadContenedores: item.cantidadContenedores,
          unidadesPorContenedor: item.unidadesPorContenedor,
          totalUnidades
        },
        create: {
          fecha: fechaProduccion,
          productoId: item.productoId,
          cantidadContenedores: item.cantidadContenedores,
          unidadesPorContenedor: item.unidadesPorContenedor,
          totalUnidades,
          registradoPor: parseInt(session.user.id),
          turno,
          numeroSecuencia: 1
        },
        include: {
          producto: true
        }
      })

      producciones.push(produccion)
    }

    revalidatePath('/dashboard/produccion')

    return {
      success: true,
      producciones,
      mensaje: `Se aplicaron ${producciones.length} productos de la plantilla "${plantilla.nombre}"`
    }
  } catch (error) {
    console.error('Error al aplicar plantilla:', error)
    if (error instanceof Error && 'errors' in error) {
      return { success: false, error: 'Datos inválidos' }
    }
    return { success: false, error: 'Error al aplicar plantilla' }
  }
}

/**
 * Eliminar plantilla
 */
export async function eliminarPlantilla(id: string) {
  try {
    await verifySession()

    // Validar permisos
    const permisoCheck = await checkPermiso(PERMISOS.PRODUCCION_ELIMINAR)
    if (!permisoCheck.authorized) {
      return { success: false, error: 'Sin permisos para eliminar plantillas' }
    }

    await prisma.plantillaProduccion.delete({
      where: { id }
    })

    revalidatePath('/dashboard/produccion')
    revalidatePath('/dashboard/produccion/plantillas')

    return { success: true }
  } catch (error) {
    console.error('Error al eliminar plantilla:', error)
    return { success: false, error: 'Error al eliminar plantilla' }
  }
}

/**
 * Activar/desactivar plantilla
 */
export async function togglePlantillaActiva(id: string, activa: boolean) {
  try {
    await verifySession()

    // Validar permisos
    const permisoCheck = await checkPermiso(PERMISOS.PRODUCCION_EDITAR)
    if (!permisoCheck.authorized) {
      return { success: false, error: 'Sin permisos para modificar plantillas' }
    }

    const plantilla = await prisma.plantillaProduccion.update({
      where: { id },
      data: { activa },
      include: {
        items: {
          include: {
            producto: true
          }
        }
      }
    })

    revalidatePath('/dashboard/produccion')
    revalidatePath('/dashboard/produccion/plantillas')

    return { success: true, plantilla: plantilla as PlantillaConItems }
  } catch (error) {
    console.error('Error al actualizar plantilla:', error)
    return { success: false, error: 'Error al actualizar plantilla' }
  }
}
