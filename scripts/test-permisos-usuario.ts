/**
 * Script para probar si los permisos de un usuario están funcionando correctamente
 *
 * Uso: npx tsx scripts/test-permisos-usuario.ts <email>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.log('❌ Error: Debes proporcionar un email')
    console.log('\nUso: npx tsx scripts/test-permisos-usuario.ts <email>')
    console.log('Ejemplo: npx tsx scripts/test-permisos-usuario.ts usuario@empresa.com\n')
    process.exit(1)
  }

  console.log(`\n🧪 PROBANDO PERMISOS PARA: ${email}\n`)

  // 1. Buscar usuario
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
    },
  })

  if (!usuario) {
    console.log('❌ Usuario no encontrado\n')
    process.exit(1)
  }

  // 2. Información del usuario
  console.log('👤 USUARIO')
  console.log(`   ID: ${usuario.id}`)
  console.log(`   Nombre: ${usuario.nombre}`)
  console.log(`   Email: ${usuario.correo}`)
  console.log(`   Rol: ${usuario.rol.nombre}`)
  console.log(`   Activo: ${usuario.activo ? '✅ Sí' : '❌ No'}`)
  console.log()

  // 3. Permisos del rol
  const permisosRol = usuario.rol.permisos.map(rp => rp.permission.codigo)
  console.log('🔐 PERMISOS DEL ROL')
  console.log(`   Total: ${permisosRol.length}`)
  if (permisosRol.length > 0) {
    console.log(`   Códigos: ${permisosRol.slice(0, 5).join(', ')}${permisosRol.length > 5 ? '...' : ''}`)
  } else {
    console.log('   ⚠️  PROBLEMA: Este rol NO tiene permisos')
  }
  console.log()

  // 4. Permisos individuales
  const permisosIndividuales = usuario.permisosIndividuales?.map(up => up.permission.codigo) || []
  console.log('✨ PERMISOS INDIVIDUALES')
  console.log(`   Total: ${permisosIndividuales.length}`)
  if (permisosIndividuales.length > 0) {
    console.log(`   Códigos: ${permisosIndividuales.join(', ')}`)
  } else {
    console.log('   (ninguno)')
  }
  console.log()

  // 5. Permisos efectivos (lo que debería tener)
  const todosLosPermisos = [...new Set([...permisosRol, ...permisosIndividuales])]
  console.log('🎯 PERMISOS EFECTIVOS (lo que DEBERÍA tener el usuario)')
  console.log(`   Total: ${todosLosPermisos.length}`)
  console.log()

  // 6. Pruebas de acceso
  console.log('🧪 PRUEBAS DE ACCESO')
  const testCases = [
    { ruta: '/dashboard/ventas', permiso: 'ventas.ver', descripcion: 'Ver ventas' },
    { ruta: '/dashboard/productos', permiso: 'productos.ver', descripcion: 'Ver productos' },
    { ruta: '/dashboard/inventario', permiso: 'inventario.ver', descripcion: 'Ver inventario' },
    { ruta: '/dashboard/envios', permiso: 'envios.ver', descripcion: 'Ver envíos' },
    { ruta: '/dashboard/usuarios', permiso: 'usuarios.ver', descripcion: 'Ver usuarios' },
    { ruta: '/dashboard/sucursales', permiso: 'sucursales.ver', descripcion: 'Ver sucursales' },
  ]

  for (const test of testCases) {
    const tienePermiso = todosLosPermisos.includes(test.permiso) || usuario.rol.nombre === 'administrador'
    const icono = tienePermiso ? '✅' : '❌'
    const status = tienePermiso ? 'PERMITIDO' : 'BLOQUEADO'
    console.log(`   ${icono} ${test.descripcion} (${test.permiso}): ${status}`)
  }
  console.log()

  // 7. Verificar si hay permisos que NO deberían existir
  console.log('🔍 ANÁLISIS DE PERMISOS')
  const permisosValidos = await prisma.permission.findMany({
    select: { codigo: true },
  })
  const codigosValidos = new Set(permisosValidos.map(p => p.codigo))

  const permisosInvalidos = todosLosPermisos.filter(p => !codigosValidos.has(p))
  if (permisosInvalidos.length > 0) {
    console.log('   ❌ PROBLEMA: Permisos que NO existen en la DB:')
    permisosInvalidos.forEach(p => console.log(`      - ${p}`))
  } else {
    console.log('   ✅ Todos los permisos son válidos')
  }
  console.log()

  // 8. Diagnóstico
  console.log('⚠️  DIAGNÓSTICO')
  const problemas = []

  if (!usuario.activo) {
    problemas.push('❌ CRÍTICO: Usuario está INACTIVO')
  }

  if (todosLosPermisos.length === 0) {
    problemas.push('❌ CRÍTICO: NO tiene NINGÚN permiso')
  }

  if (usuario.rol.permisos.length === 0 && permisosIndividuales.length === 0) {
    problemas.push('❌ El rol NO tiene permisos Y tampoco tiene permisos individuales')
  }

  if (problemas.length === 0) {
    console.log('   ✅ No se detectaron problemas')
    console.log()
    console.log('💡 Si el usuario dice que NO puede acceder pero aquí aparece que SÍ tiene permisos:')
    console.log('   1. El usuario debe CERRAR SESIÓN y volver a INICIAR SESIÓN')
    console.log('   2. O hacer clic en "Refrescar Permisos" en la interfaz')
    console.log('   3. O simplemente RECARGAR la página (F5)')
    console.log()
    console.log('   Esto es porque los permisos están cacheados en el JWT del navegador.')
  } else {
    problemas.forEach(p => console.log(`   ${p}`))
    console.log()
    console.log('💡 SOLUCIONES:')
    if (!usuario.activo) {
      console.log('   1. Activar usuario desde el panel de administración')
    }
    if (todosLosPermisos.length === 0) {
      console.log('   2. Asignar permisos al rol o permisos individuales al usuario')
    }
  }
  console.log()
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
