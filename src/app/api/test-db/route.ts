import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Probar conexión a la base de datos
    const userCount = await prisma.usuario.count()
    
    // Probar autenticación básica
    const adminUser = await prisma.usuario.findUnique({
      where: { correo: 'admin@empresa.com' },
      include: { rol: true }
    })

    return NextResponse.json({
      success: true,
      message: '✅ Conexión a base de datos exitosa',
      data: {
        totalUsers: userCount,
        adminUser: adminUser ? {
          id: adminUser.id,
          correo: adminUser.correo,
          nombre: adminUser.nombre,
          rol: adminUser.rol?.nombre
        } : null,
        environment: process.env.NODE_ENV,
        database: 'Connected'
      }
    })
  } catch (error) {
    console.error('❌ Error en test-db:', error)
    return NextResponse.json({
      success: false,
      message: '❌ Error de conexión a base de datos',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}