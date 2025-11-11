/**
 * Script de diagnóstico de permisos
 * Verifica que los permisos estén correctamente asignados y se estén cargando
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 DIAGNÓSTICO DE PERMISOS\n')

  // 1. Verificar que existan permisos en la DB
  console.log('1️⃣ Verificando permisos en la base de datos...')
  const permisos = await prisma.permission.findMany({
    orderBy: { modulo: 'asc' },
  })
  console.log(`   ✅ Total de permisos: ${permisos.length}`)
  console.log(`   Permisos: ${permisos.map(p => p.codigo).join(', ')}\n`)

  // 2. Verificar roles
  console.log('2️⃣ Verificando roles...')
  const roles = await prisma.role.findMany({
    include: {
      permisos: {
        include: {
          permission: true,
        },
      },
    },
  })
  console.log(`   ✅ Total de roles: ${roles.length}\n`)

  for (const rol of roles) {
    console.log(`   📋 Rol: ${rol.nombre}`)
    console.log(`      Permisos asignados: ${rol.permisos.length}`)
    if (rol.permisos.length > 0) {
      console.log(`      Permisos: ${rol.permisos.map(p => p.permission.codigo).slice(0, 5).join(', ')}${rol.permisos.length > 5 ? '...' : ''}`)
    } else {
      console.log(`      ❌ PROBLEMA: Este rol NO tiene permisos asignados`)
    }
    console.log()
  }

  // 3. Verificar usuarios
  console.log('3️⃣ Verificando usuarios...')
  const usuarios = await prisma.usuario.findMany({
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

  for (const usuario of usuarios) {
    console.log(`   👤 Usuario: ${usuario.nombre} (${usuario.correo})`)
    console.log(`      Rol: ${usuario.rol.nombre}`)
    console.log(`      Activo: ${usuario.activo ? '✅' : '❌'}`)
    console.log(`      Permisos del rol: ${usuario.rol.permisos.length}`)

    if (usuario.rol.permisos.length > 0) {
      const codigosPermisos = usuario.rol.permisos.map(rp => rp.permission.codigo)
      console.log(`      Códigos: ${codigosPermisos.slice(0, 5).join(', ')}${codigosPermisos.length > 5 ? '...' : ''}`)
    } else {
      console.log(`      ❌ PROBLEMA: El rol de este usuario NO tiene permisos`)
    }

    console.log(`      Permisos individuales: ${usuario.permisosIndividuales?.length || 0}`)
    if (usuario.permisosIndividuales && usuario.permisosIndividuales.length > 0) {
      const codigosIndividuales = usuario.permisosIndividuales.map(up => up.permission.codigo)
      console.log(`      Códigos individuales: ${codigosIndividuales.join(', ')}`)
    }
    console.log()
  }

  // 4. Verificar relaciones RolePermission
  console.log('4️⃣ Verificando relaciones RolePermission...')
  const rolePermissions = await prisma.rolePermission.findMany({
    include: {
      role: true,
      permission: true,
    },
  })
  console.log(`   ✅ Total de relaciones: ${rolePermissions.length}`)

  const roleCounts: Record<string, number> = {}
  for (const rp of rolePermissions) {
    roleCounts[rp.role.nombre] = (roleCounts[rp.role.nombre] || 0) + 1
  }

  for (const [rolNombre, count] of Object.entries(roleCounts)) {
    console.log(`   ${rolNombre}: ${count} permisos`)
  }
  console.log()

  // 5. Test de carga de permisos (simular lo que hace auth.ts)
  console.log('5️⃣ Simulando carga de permisos (como en auth.ts)...')
  const testUserId = usuarios[0]?.id
  if (testUserId) {
    const userWithPermissions = await prisma.usuario.findUnique({
      where: { id: testUserId },
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

    if (userWithPermissions) {
      console.log(`   👤 Usuario de prueba: ${userWithPermissions.nombre}`)

      // Combinar permisos (como en auth.ts líneas 178-183)
      const permisosRol = userWithPermissions.rol.permisos.map(rp => rp.permission.codigo)
      const permisosIndividuales = userWithPermissions.permisosIndividuales?.map(up => up.permission.codigo) || []
      const todosLosPermisos = [...new Set([...permisosRol, ...permisosIndividuales])]

      console.log(`   Permisos del rol: ${permisosRol.length}`)
      console.log(`   Permisos individuales: ${permisosIndividuales.length}`)
      console.log(`   Total combinado: ${todosLosPermisos.length}`)
      console.log(`   Permisos finales: ${todosLosPermisos.slice(0, 10).join(', ')}${todosLosPermisos.length > 10 ? '...' : ''}`)

      if (todosLosPermisos.length === 0) {
        console.log(`   ❌ PROBLEMA CRÍTICO: No se están cargando permisos`)
      } else {
        console.log(`   ✅ Los permisos se cargan correctamente`)
      }
    }
  }

  console.log('\n✅ Diagnóstico completado')
}

main()
  .catch((e) => {
    console.error('❌ Error en diagnóstico:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
