/**
 * Script para verificar permisos de un usuario específico
 * Útil para debugging cuando un usuario dice que no puede acceder
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.log('❌ Error: Debes proporcionar un email')
    console.log('\nUso: npx tsx scripts/verificar-permisos-usuario.ts <email>')
    console.log('Ejemplo: npx tsx scripts/verificar-permisos-usuario.ts bodega@empresa.com\n')
    process.exit(1)
  }

  console.log(`\n🔍 VERIFICANDO PERMISOS PARA: ${email}\n`)

  // Buscar usuario
  const usuario = await prisma.usuario.findUnique({
    where: { correo: email.toLowerCase().trim() },
    include: {
      rol: {
        include: {
          permisos: {
            include: {
              permission: true,
            },
          },
        },
      },
      permisosIndividuales: {
        include: {
          permission: true,
        },
      },
      sucursalGerente: true,
    },
  })

  if (!usuario) {
    console.log('❌ Usuario no encontrado\n')
    process.exit(1)
  }

  // Información básica
  console.log('👤 INFORMACIÓN DEL USUARIO')
  console.log(`   Nombre: ${usuario.nombre}`)
  console.log(`   Email: ${usuario.correo}`)
  console.log(`   Rol: ${usuario.rol.nombre}`)
  console.log(`   Activo: ${usuario.activo ? '✅ Sí' : '❌ No (BLOQUEADO)'}`)
  if (usuario.sucursalGerente) {
    console.log(`   Sucursal: ${usuario.sucursalGerente.nombre}`)
  }
  console.log()

  // Permisos del rol
  console.log('🔐 PERMISOS DEL ROL')
  const permisosRol = usuario.rol.permisos.map(rp => rp.permission.codigo)
  if (permisosRol.length === 0) {
    console.log('   ❌ Este rol NO tiene permisos asignados')
  } else {
    console.log(`   Total: ${permisosRol.length} permisos`)

    // Agrupar por módulo
    const porModulo: Record<string, string[]> = {}
    usuario.rol.permisos.forEach(rp => {
      const modulo = rp.permission.modulo
      if (!porModulo[modulo]) {
        porModulo[modulo] = []
      }
      porModulo[modulo].push(rp.permission.codigo)
    })

    for (const [modulo, permisos] of Object.entries(porModulo)) {
      console.log(`\n   📁 ${modulo.toUpperCase()}:`)
      permisos.forEach(p => console.log(`      ✓ ${p}`))
    }
  }
  console.log()

  // Permisos individuales
  console.log('✨ PERMISOS INDIVIDUALES (extras)')
  const permisosIndividuales = usuario.permisosIndividuales?.map(up => up.permission.codigo) || []
  if (permisosIndividuales.length === 0) {
    console.log('   (ninguno)')
  } else {
    console.log(`   Total: ${permisosIndividuales.length} permisos extras`)
    permisosIndividuales.forEach(p => console.log(`      + ${p}`))
  }
  console.log()

  // Permisos combinados (lo que realmente tiene el usuario)
  const todosLosPermisos = [...new Set([...permisosRol, ...permisosIndividuales])]
  console.log('🎯 PERMISOS EFECTIVOS (Total Combinado)')
  console.log(`   Total: ${todosLosPermisos.length} permisos`)
  console.log()

  // Verificar acceso a rutas comunes
  console.log('🚪 ACCESO A RUTAS PRINCIPALES')
  const rutasVerificar = [
    { ruta: '/dashboard/usuarios', permiso: 'usuarios.ver' },
    { ruta: '/dashboard/productos', permiso: 'productos.ver' },
    { ruta: '/dashboard/inventario', permiso: 'inventario.ver' },
    { ruta: '/dashboard/ventas', permiso: 'ventas.ver' },
    { ruta: '/dashboard/envios', permiso: 'envios.ver' },
    { ruta: '/dashboard/produccion', permiso: 'produccion.ver' },
    { ruta: '/dashboard/sucursales', permiso: 'sucursales.ver' },
    { ruta: '/dashboard/reportes', permiso: 'reportes.ver' },
  ]

  for (const { ruta, permiso } of rutasVerificar) {
    const tienePermiso = todosLosPermisos.includes(permiso) || usuario.rol.nombre === 'administrador'
    const icono = tienePermiso ? '✅' : '❌'
    const status = tienePermiso ? 'PERMITIDO' : 'BLOQUEADO'
    console.log(`   ${icono} ${ruta} - ${status}`)
  }
  console.log()

  // Problemas potenciales
  console.log('⚠️  DIAGNÓSTICO')
  const problemas = []

  if (!usuario.activo) {
    problemas.push('❌ CRÍTICO: Usuario está INACTIVO - No puede iniciar sesión')
  }

  if (todosLosPermisos.length === 0) {
    problemas.push('❌ CRÍTICO: Usuario NO tiene NINGÚN permiso asignado')
  }

  if (usuario.rol.permisos.length === 0 && permisosIndividuales.length === 0) {
    problemas.push('❌ El rol no tiene permisos Y no tiene permisos individuales')
  }

  if (usuario.rol.nombre === 'administrador' && todosLosPermisos.length < 30) {
    problemas.push('⚠️  Este usuario es administrador pero tiene menos de 30 permisos (debería tener ~32)')
  }

  if (problemas.length === 0) {
    console.log('   ✅ No se detectaron problemas')
  } else {
    problemas.forEach(p => console.log(`   ${p}`))
  }
  console.log()

  // Recomendaciones
  if (problemas.length > 0) {
    console.log('💡 SOLUCIONES')
    if (!usuario.activo) {
      console.log('   1. Activar usuario: UPDATE usuarios SET activo = true WHERE id = ' + usuario.id)
    }
    if (todosLosPermisos.length === 0) {
      console.log('   2. Asignar permisos al rol desde el panel de administración')
      console.log('   3. O ejecutar: npm run seed (reconstruir roles con permisos)')
    }
    console.log()
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
