import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Actualizando producciones sin turno...')

  // Actualizar todas las producciones que no tienen turno válido
  const result = await prisma.produccionDiaria.updateMany({
    where: {
      NOT: {
        turno: {
          in: ['manana', 'noche']
        }
      }
    },
    data: {
      turno: 'manana'
    }
  })

  console.log(`✅ Actualizadas ${result.count} producciones`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
