import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de datos...')

  // Limpiar base de datos
  console.log('🧹 Limpiando base de datos...')
  await prisma.notificacion.deleteMany()
  await prisma.movimientoInventario.deleteMany()
  await prisma.ventaItem.deleteMany()
  await prisma.venta.deleteMany()
  await prisma.envioItem.deleteMany()
  await prisma.envio.deleteMany()
  await prisma.inventario.deleteMany()
  await prisma.producto.deleteMany()
  await prisma.sucursal.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.empresa.deleteMany()
  await prisma.role.deleteMany()

  // Crear roles
  console.log('📝 Creando roles...')
  const roleAdmin = await prisma.role.create({
    data: { nombre: 'administrador' },
  })

  const roleBodega = await prisma.role.create({
    data: { nombre: 'bodega' },
  })

  const roleSucursal = await prisma.role.create({
    data: { nombre: 'sucursal' },
  })

  // Crear empresa
  console.log('sCreando empresa...')
  const empresa = await prisma.empresa.create({
    data: {
      nombre: 'Mi Empresa Demo',
      logoUrl: null,
      datosFiscales: {
        nit: '123456789',
        direccion: 'Calle Principal 123',
        telefono: '555-1234',
      },
    },
  })

  // Crear usuario administrador
  console.log('👤 Creando usuarios...')
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.usuario.create({
    data: {
      correo: 'admin@empresa.com',
      nombre: 'Administrador Principal',
      contrasenaHash: adminPassword,
      rolId: roleAdmin.id,
    },
  })

  const bodegaPassword = await bcrypt.hash('bodega123', 10)
  const bodegaUser = await prisma.usuario.create({
    data: {
      correo: 'bodega@empresa.com',
      nombre: 'Encargado Bodega',
      contrasenaHash: bodegaPassword,
      rolId: roleBodega.id,
    },
  })

  // Crear sucursales
  console.log('🏪 Creando sucursales...')
  const bodega = await prisma.sucursal.create({
    data: {
      empresaId: empresa.id,
      nombre: 'Bodega Central',
      direccion: 'Zona Industrial, Bodega 5',
      metaVentas: 0,
    },
  })

  const sucursal1 = await prisma.sucursal.create({
    data: {
      empresaId: empresa.id,
      nombre: 'Sucursal Centro',
      direccion: 'Av. Central 456, Local 12',
      metaVentas: 50000,
    },
  })

  const sucursal2 = await prisma.sucursal.create({
    data: {
      empresaId: empresa.id,
      nombre: 'Sucursal Norte',
      direccion: 'Zona Norte 789, Plaza Norte',
      metaVentas: 40000,
    },
  })

  const sucursal3 = await prisma.sucursal.create({
    data: {
      empresaId: empresa.id,
      nombre: 'Sucursal Sur',
      direccion: 'Zona Sur 321, Centro Comercial',
      metaVentas: 35000,
    },
  })

  // Crear usuario de sucursal
  const sucursalPassword = await bcrypt.hash('sucursal123', 10)
  const sucursalUser = await prisma.usuario.create({
    data: {
      correo: 'sucursal@empresa.com',
      nombre: 'Gerente Sucursal Centro',
      contrasenaHash: sucursalPassword,
      rolId: roleSucursal.id,
    },
  })

  // Asignar gerente a la sucursal
  await prisma.sucursal.update({
    where: { id: sucursal1.id },
    data: { gerenteId: sucursalUser.id },
  })

  // Crear productos de ejemplo
  console.log('📦 Creando productos...')
  const productos = await Promise.all([
    prisma.producto.create({
      data: {
        sku: 'SKU-PAN-001',
        nombre: 'Pan Francés',
        descripcion: 'Pan fresco del día, tradicional',
        costoUnitario: 0.50,
        precioVenta: 1.00,
        unidadMedida: 'unidad',
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'SKU-PAN-002',
        nombre: 'Pan Dulce',
        descripcion: 'Pan dulce variado, surtido',
        costoUnitario: 0.75,
        precioVenta: 1.50,
        unidadMedida: 'unidad',
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'SKU-PAN-003',
        nombre: 'Pan Integral',
        descripcion: 'Pan integral con semillas',
        costoUnitario: 1.00,
        precioVenta: 2.00,
        unidadMedida: 'unidad',
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'SKU-BEB-001',
        nombre: 'Agua 500ml',
        descripcion: 'Agua purificada embotellada',
        costoUnitario: 0.30,
        precioVenta: 0.75,
        unidadMedida: 'unidad',
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'SKU-BEB-002',
        nombre: 'Jugo Natural 1L',
        descripcion: 'Jugo de naranja natural',
        costoUnitario: 1.50,
        precioVenta: 3.00,
        unidadMedida: 'litro',
      },
    }),
    prisma.producto.create({
      data: {
        sku: 'SKU-LAC-001',
        nombre: 'Leche Entera 1L',
        descripcion: 'Leche entera pasteurizada',
        costoUnitario: 1.20,
        precioVenta: 2.50,
        unidadMedida: 'litro',
      },
    }),
  ])

  // Inicializar inventarios
  console.log('📊 Inicializando inventarios...')
  for (const producto of productos) {
    // Bodega con stock alto
    await prisma.inventario.create({
      data: {
        sucursalId: bodega.id,
        productoId: producto.id,
        cantidadActual: 500,
        stockMinimo: 100,
      },
    })

    // Sucursal Centro con stock normal
    await prisma.inventario.create({
      data: {
        sucursalId: sucursal1.id,
        productoId: producto.id,
        cantidadActual: 50,
        stockMinimo: 20,
      },
    })

    // Sucursal Norte con stock crítico intencional
    await prisma.inventario.create({
      data: {
        sucursalId: sucursal2.id,
        productoId: producto.id,
        cantidadActual: 15,
        stockMinimo: 20,
      },
    })

    // Sucursal Sur con stock bajo
    await prisma.inventario.create({
      data: {
        sucursalId: sucursal3.id,
        productoId: producto.id,
        cantidadActual: 25,
        stockMinimo: 15,
      },
    })
  }

  // Crear algunas ventas de ejemplo
  console.log('💰 Creando ventas de ejemplo...')
  const venta1 = await prisma.venta.create({
    data: {
      sucursalId: sucursal1.id,
      vendedorId: sucursalUser.id,
      totalVenta: 5.50,
      metodoPago: 'efectivo',
      items: {
        create: [
          {
            productoId: productos[0].id,
            cantidad: 3,
            precioUnitario: 1.00,
          },
          {
            productoId: productos[3].id,
            cantidad: 2,
            precioUnitario: 0.75,
          },
          {
            productoId: productos[1].id,
            cantidad: 1,
            precioUnitario: 1.50,
          },
        ],
      },
    },
  })

  const venta2 = await prisma.venta.create({
    data: {
      sucursalId: sucursal1.id,
      vendedorId: sucursalUser.id,
      totalVenta: 8.00,
      metodoPago: 'tarjeta',
      items: {
        create: [
          {
            productoId: productos[2].id,
            cantidad: 2,
            precioUnitario: 2.00,
          },
          {
            productoId: productos[4].id,
            cantidad: 1,
            precioUnitario: 3.00,
          },
          {
            productoId: productos[5].id,
            cantidad: 1,
            precioUnitario: 2.50,
          },
        ],
      },
    },
  })

  // Crear un envío de ejemplo
  console.log('🚚 Creando envío de ejemplo...')
  const envio = await prisma.envio.create({
    data: {
      empresaId: empresa.id,
      sucursalOrigenId: bodega.id,
      sucursalDestinoId: sucursal2.id,
      estado: 'pendiente',
      creadorId: admin.id,
      items: {
        create: [
          {
            productoId: productos[0].id,
            cantidadSolicitada: 30,
          },
          {
            productoId: productos[1].id,
            cantidadSolicitada: 25,
          },
        ],
      },
    },
  })

  console.log('\n✅ Seed completado exitosamente!')
  console.log('\n📧 Credenciales de acceso:')
  console.log('┌─────────────────────────────────────────┐')
  console.log('│ ADMINISTRADOR                           │')
  console.log('│ Email:    admin@empresa.com             │')
  console.log('│ Password: admin123                      │')
  console.log('├─────────────────────────────────────────┤')
  console.log('│ BODEGA                                  │')
  console.log('│ Email:    bodega@empresa.com            │')
  console.log('│ Password: bodega123                     │')
  console.log('├─────────────────────────────────────────┤')
  console.log('│ SUCURSAL                                │')
  console.log('│ Email:    sucursal@empresa.com          │')
  console.log('│ Password: sucursal123                   │')
  console.log('└─────────────────────────────────────────┘')
  console.log('\n🚀 Inicia el servidor: npm run dev')
  console.log('🌐 Abre: http://localhost:3000\n')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
