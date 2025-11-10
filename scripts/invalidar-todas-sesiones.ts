/**
 * Script: Invalidar Todas las Sesiones
 *
 * Este script marca todas las sesiones de usuarios como invalidadas
 * en Redis, forzando que todos recarguen sus permisos al hacer el
 * próximo request.
 *
 * Uso:
 * npx tsx scripts/invalidar-todas-sesiones.ts
 */

import { PrismaClient } from '@prisma/client'
import { Redis } from '@upstash/redis'

const prisma = new PrismaClient()

// Cliente Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

async function main() {
  console.log('🔄 Invalidando todas las sesiones de usuarios...\n')

  // Obtener todos los usuarios activos
  const usuarios = await prisma.usuario.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, correo: true },
  })

  console.log(`📊 Encontrados ${usuarios.length} usuarios activos\n`)

  let count = 0
  for (const usuario of usuarios) {
    const key = `invalidate-session:${usuario.id}`

    // Marcar sesión como invalidada
    await redis.set(key, Date.now(), { ex: 300 }) // 5 minutos TTL

    console.log(`✅ ${usuario.nombre} (${usuario.correo}) - Sesión invalidada`)
    count++
  }

  console.log(`\n🎉 ${count} sesiones invalidadas exitosamente!`)
  console.log('\n⚠️  Los usuarios verán sus permisos actualizados en los próximos 5-10 segundos.')
  console.log('💡 Si algún usuario no ve cambios, debe refrescar la página (F5).\n')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
