import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verificando duplicados...')

  // Buscar duplicados: registros con la misma fecha, productoId y turno
  const producciones = await prisma.produccionDiaria.findMany({
    orderBy: [
      { fecha: 'asc' },
      { productoId: 'asc' },
      { turno: 'asc' },
      { createdAt: 'asc' }
    ]
  })

  const duplicados: Map<string, typeof producciones> = new Map()

  for (const prod of producciones) {
    const key = `${prod.fecha.toISOString()}_${prod.productoId}_${prod.turno}`
    const existing = duplicados.get(key) || []
    existing.push(prod)
    duplicados.set(key, existing)
  }

  // Filtrar solo los que tienen más de un registro
  const conDuplicados = Array.from(duplicados.entries()).filter(([_, prods]) => prods.length > 1)

  if (conDuplicados.length === 0) {
    console.log('✅ No se encontraron duplicados')
    return
  }

  console.log(`⚠️  Encontrados ${conDuplicados.length} grupos de duplicados:`)

  for (const [key, prods] of conDuplicados) {
    console.log(`\n📦 ${key}:`)
    for (const prod of prods) {
      console.log(`  - ID: ${prod.id}, Cantidad: ${prod.totalUnidades}, Creado: ${prod.createdAt}`)
    }

    // Mantener el más reciente (por createdAt) y eliminar los demás
    const [keep, ...remove] = prods.sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    )

    console.log(`  ✅ Mantener: ${keep.id}`)

    for (const prod of remove) {
      console.log(`  ❌ Eliminar: ${prod.id}`)
      await prisma.produccionDiaria.delete({
        where: { id: prod.id }
      })
    }
  }

  console.log('\n✅ Duplicados eliminados')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
