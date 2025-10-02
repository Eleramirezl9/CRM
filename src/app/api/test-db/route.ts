import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Verificar conexión a la base de datos
    const rolesCount = await prisma.role.count()
    const usuariosCount = await prisma.usuario.count()
    
    // Verificar si existe el admin
    const admin = await prisma.usuario.findUnique({
      where: { correo: 'admin@empresa.com' },
      include: { rol: true },
    })
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      roles: rolesCount,
      usuarios: usuariosCount,
      adminExists: !!admin,
      adminData: admin ? {
        correo: admin.correo,
        nombre: admin.nombre,
        rol: admin.rol?.nombre,
        hashLength: admin.contrasenaHash.length,
      } : null,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      database: 'disconnected',
    }, { status: 500 })
  }
}
