'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Decimal } from '@prisma/client/runtime/library'

// Generar SKU automático
function generarSKU(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SKU-${timestamp}-${random}`
}

// Crear producto
export async function crearProducto(data: {
  nombre: string
  descripcion?: string
  costoUnitario: number
  precioVenta: number
  unidadMedida?: string
}) {
  try {
    const sku = generarSKU()
    
    const producto = await prisma.producto.create({
      data: {
        sku,
        nombre: data.nombre,
        descripcion: data.descripcion,
        costoUnitario: new Decimal(data.costoUnitario),
        precioVenta: new Decimal(data.precioVenta),
        unidadMedida: data.unidadMedida || 'unidad',
      },
    })
    
    revalidatePath('/dashboard/productos')
    return { success: true, producto }
  } catch (error) {
    console.error('Error al crear producto:', error)
    return { success: false, error: 'Error al crear producto' }
  }
}

// Obtener todos los productos con stock consolidado
export async function obtenerProductos() {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        inventarios: {
          select: {
            cantidadActual: true,
            stockMinimo: true,
            sucursal: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    // Calcular stock total y verificar si está crítico
    const productosConStock = productos.map(p => {
      const stockTotal = p.inventarios.reduce((sum, inv) => sum + inv.cantidadActual, 0)
      const stockMinimoTotal = p.inventarios.reduce((sum, inv) => sum + inv.stockMinimo, 0)
      const stockCritico = stockTotal < stockMinimoTotal

      return {
        ...p,
        costoUnitario: parseFloat(p.costoUnitario.toString()),
        precioVenta: parseFloat(p.precioVenta.toString()),
        stockTotal,
        stockMinimoTotal,
        stockCritico,
      }
    })
    
    return { success: true, productos: productosConStock }
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return { success: false, error: 'Error al obtener productos', productos: [] }
  }
}

// Obtener producto por ID
export async function obtenerProductoPorId(id: string) {
  try {
    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        inventarios: {
          include: {
            sucursal: true,
          },
        },
      },
    })
    
    return { success: true, producto }
  } catch (error) {
    console.error('Error al obtener producto:', error)
    return { success: false, error: 'Error al obtener producto' }
  }
}

// Actualizar producto
export async function actualizarProducto(id: string, data: {
  nombre?: string
  descripcion?: string
  costoUnitario?: number
  precioVenta?: number
  unidadMedida?: string
}) {
  try {
    const updateData: any = {}
    
    if (data.nombre) updateData.nombre = data.nombre
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion
    if (data.costoUnitario) updateData.costoUnitario = new Decimal(data.costoUnitario)
    if (data.precioVenta) updateData.precioVenta = new Decimal(data.precioVenta)
    if (data.unidadMedida) updateData.unidadMedida = data.unidadMedida
    
    const producto = await prisma.producto.update({
      where: { id },
      data: updateData,
    })
    
    revalidatePath('/dashboard/productos')
    return { success: true, producto }
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    return { success: false, error: 'Error al actualizar producto' }
  }
}

// Eliminar producto
export async function eliminarProducto(id: string) {
  try {
    // Verificar si tiene inventario
    const inventarios = await prisma.inventario.findMany({
      where: { productoId: id },
    })
    
    if (inventarios.some(inv => inv.cantidadActual > 0)) {
      return { success: false, error: 'No se puede eliminar un producto con inventario activo' }
    }
    
    await prisma.producto.delete({
      where: { id },
    })
    
    revalidatePath('/dashboard/productos')
    return { success: true }
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    return { success: false, error: 'Error al eliminar producto' }
  }
}

// Obtener productos con stock crítico
export async function obtenerProductosStockCritico() {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        inventarios: {
          where: {
            cantidadActual: {
              lte: prisma.inventario.fields.stockMinimo,
            },
          },
          include: {
            sucursal: true,
          },
        },
      },
    })
    
    const productosCriticos = productos.filter(p => p.inventarios.length > 0)
    
    return { success: true, productos: productosCriticos }
  } catch (error) {
    console.error('Error al obtener productos críticos:', error)
    return { success: false, error: 'Error al obtener productos críticos', productos: [] }
  }
}
