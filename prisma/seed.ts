import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de datos...')

  // Limpiar base de datos
  console.log('🧹 Limpiando base de datos...')
  await prisma.auditLog.deleteMany()
  await prisma.devolucion.deleteMany()
  await prisma.operacionDiaria.deleteMany()
  await prisma.produccionDiaria.deleteMany()
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
  await prisma.rolePermission.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.role.deleteMany()

  // Crear permisos
  console.log('🔐 Creando permisos...')
  const permisosData = [
    // Usuarios
    { codigo: 'usuarios.ver', nombre: 'Ver Usuarios', modulo: 'usuarios', descripcion: 'Permite ver la lista de usuarios' },
    { codigo: 'usuarios.crear', nombre: 'Crear Usuarios', modulo: 'usuarios', descripcion: 'Permite crear nuevos usuarios' },
    { codigo: 'usuarios.editar', nombre: 'Editar Usuarios', modulo: 'usuarios', descripcion: 'Permite editar usuarios existentes' },
    { codigo: 'usuarios.eliminar', nombre: 'Eliminar Usuarios', modulo: 'usuarios', descripcion: 'Permite eliminar usuarios' },
    { codigo: 'usuarios.cambiar_rol', nombre: 'Cambiar Rol Usuarios', modulo: 'usuarios', descripcion: 'Permite cambiar el rol de un usuario' },
    // Roles
    { codigo: 'roles.ver', nombre: 'Ver Roles', modulo: 'roles', descripcion: 'Permite ver roles' },
    { codigo: 'roles.editar', nombre: 'Editar Roles', modulo: 'roles', descripcion: 'Permite editar roles' },
    // Productos
    { codigo: 'productos.ver', nombre: 'Ver Productos', modulo: 'productos', descripcion: 'Permite ver productos' },
    { codigo: 'productos.crear', nombre: 'Crear Productos', modulo: 'productos', descripcion: 'Permite crear productos' },
    { codigo: 'productos.editar', nombre: 'Editar Productos', modulo: 'productos', descripcion: 'Permite editar productos' },
    { codigo: 'productos.eliminar', nombre: 'Eliminar Productos', modulo: 'productos', descripcion: 'Permite eliminar productos' },
    // Inventario
    { codigo: 'inventario.ver', nombre: 'Ver Inventario', modulo: 'inventario', descripcion: 'Permite ver inventario' },
    { codigo: 'inventario.editar', nombre: 'Editar Inventario', modulo: 'inventario', descripcion: 'Permite editar inventario' },
    { codigo: 'inventario.ajustar', nombre: 'Ajustar Inventario', modulo: 'inventario', descripcion: 'Permite ajustar inventario' },
    // Ventas
    { codigo: 'ventas.ver', nombre: 'Ver Ventas', modulo: 'ventas', descripcion: 'Permite ver ventas' },
    { codigo: 'ventas.crear', nombre: 'Crear Ventas', modulo: 'ventas', descripcion: 'Permite crear ventas' },
    { codigo: 'ventas.editar', nombre: 'Editar Ventas', modulo: 'ventas', descripcion: 'Permite editar ventas' },
    { codigo: 'ventas.eliminar', nombre: 'Eliminar Ventas', modulo: 'ventas', descripcion: 'Permite eliminar ventas' },
    // Envíos
    { codigo: 'envios.ver', nombre: 'Ver Envíos', modulo: 'envios', descripcion: 'Permite ver envíos' },
    { codigo: 'envios.crear', nombre: 'Crear Envíos', modulo: 'envios', descripcion: 'Permite crear envíos' },
    { codigo: 'envios.editar', nombre: 'Editar Envíos', modulo: 'envios', descripcion: 'Permite editar envíos' },
    { codigo: 'envios.confirmar', nombre: 'Confirmar Envíos', modulo: 'envios', descripcion: 'Permite confirmar envíos' },
    // Producción
    { codigo: 'produccion.ver', nombre: 'Ver Producción', modulo: 'produccion', descripcion: 'Permite ver producción' },
    { codigo: 'produccion.crear', nombre: 'Crear Producción', modulo: 'produccion', descripcion: 'Permite crear producción' },
    { codigo: 'produccion.editar', nombre: 'Editar Producción', modulo: 'produccion', descripcion: 'Permite editar producción' },
    // Sucursales
    { codigo: 'sucursales.ver', nombre: 'Ver Sucursales', modulo: 'sucursales', descripcion: 'Permite ver sucursales' },
    { codigo: 'sucursales.crear', nombre: 'Crear Sucursales', modulo: 'sucursales', descripcion: 'Permite crear sucursales' },
    { codigo: 'sucursales.editar', nombre: 'Editar Sucursales', modulo: 'sucursales', descripcion: 'Permite editar sucursales' },
    { codigo: 'sucursales.eliminar', nombre: 'Eliminar Sucursales', modulo: 'sucursales', descripcion: 'Permite eliminar sucursales' },
    // Reportes
    { codigo: 'reportes.ver', nombre: 'Ver Reportes', modulo: 'reportes', descripcion: 'Permite ver reportes' },
    { codigo: 'reportes.exportar', nombre: 'Exportar Reportes', modulo: 'reportes', descripcion: 'Permite exportar reportes' },
    // Auditoría
    { codigo: 'auditoria.ver', nombre: 'Ver Auditoría', modulo: 'auditoria', descripcion: 'Permite ver auditoría' },
  ]

  const permisos = []
  for (const data of permisosData) {
    const permiso = await prisma.permission.create({ data })
    permisos.push(permiso)
  }

  // Crear roles
  console.log('📝 Creando roles...')
  const roleAdmin = await prisma.role.create({
    data: {
      nombre: 'administrador',
      descripcion: 'Acceso total al sistema'
    },
  })

  const roleBodega = await prisma.role.create({
    data: {
      nombre: 'bodega',
      descripcion: 'Gestión de inventario y envíos'
    },
  })

  const roleSucursal = await prisma.role.create({
    data: {
      nombre: 'sucursal',
      descripcion: 'Gestión de ventas en sucursal'
    },
  })

  const roleProduccion = await prisma.role.create({
    data: {
      nombre: 'produccion',
      descripcion: 'Gestión de producción diaria'
    },
  })

  // Asignar permisos a roles
  console.log('🔗 Asignando permisos a roles...')

  // Administrador: todos los permisos
  for (const permiso of permisos) {
    await prisma.rolePermission.create({
      data: {
        roleId: roleAdmin.id,
        permissionId: permiso.id,
      },
    })
  }

  // Bodega: inventario, envíos, productos (solo ver)
  const permisosBodega = permisos.filter(p =>
    p.modulo === 'inventario' ||
    p.modulo === 'envios' ||
    (p.modulo === 'productos' && p.codigo === 'productos.ver')
  )
  for (const permiso of permisosBodega) {
    await prisma.rolePermission.create({
      data: {
        roleId: roleBodega.id,
        permissionId: permiso.id,
      },
    })
  }

  // Sucursal: ventas, inventario (solo ver)
  const permisosSucursal = permisos.filter(p =>
    p.modulo === 'ventas' ||
    (p.modulo === 'inventario' && p.codigo === 'inventario.ver')
  )
  for (const permiso of permisosSucursal) {
    await prisma.rolePermission.create({
      data: {
        roleId: roleSucursal.id,
        permissionId: permiso.id,
      },
    })
  }

  // Producción: producción completa, inventario (solo ver)
  const permisosProduccion = permisos.filter(p =>
    p.modulo === 'produccion' ||
    (p.modulo === 'inventario' && p.codigo === 'inventario.ver')
  )
  for (const permiso of permisosProduccion) {
    await prisma.rolePermission.create({
      data: {
        roleId: roleProduccion.id,
        permissionId: permiso.id,
      },
    })
  }

  // Crear empresa
  console.log('🏢 Creando empresa...')
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
  const adminPassword = await hash('Admin@2025', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })
  const admin = await prisma.usuario.create({
    data: {
      correo: 'admin@empresa.com',
      nombre: 'Administrador Principal',
      contrasenaHash: adminPassword,
      rolId: roleAdmin.id,
      activo: true,
    },
  })

  const bodegaPassword = await hash('Bodega@2025', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })
  const bodegaUser = await prisma.usuario.create({
    data: {
      correo: 'bodega@empresa.com',
      nombre: 'Encargado Bodega',
      contrasenaHash: bodegaPassword,
      rolId: roleBodega.id,
      activo: true,
    },
  })

  const produccionPassword = await hash('Produccion@2025', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })
  const produccionUser = await prisma.usuario.create({
    data: {
      correo: 'produccion@empresa.com',
      nombre: 'Encargado Producción',
      contrasenaHash: produccionPassword,
      rolId: roleProduccion.id,
      activo: true,
    },
  })

  // Crear sucursales
  console.log('🏪 Creando sucursales...')
  const bodega = await prisma.sucursal.create({
    data: {
      empresaId: empresa.id,
      codigoUnico: 'SUC-001',
      nombre: 'Bodega Central',
      direccion: 'Zona Industrial, Bodega 5',
      metaVentas: 0,
    },
  })

  const sucursal1 = await prisma.sucursal.create({
    data: {
      empresaId: empresa.id,
      codigoUnico: 'SUC-002',
      nombre: 'Sucursal Centro',
      direccion: 'Av. Central 456, Local 12',
      metaVentas: 50000,
    },
  })

  const sucursal2 = await prisma.sucursal.create({
    data: {
      empresaId: empresa.id,
      codigoUnico: 'SUC-003',
      nombre: 'Sucursal Norte',
      direccion: 'Zona Norte 789, Plaza Norte',
      metaVentas: 40000,
    },
  })

  const sucursal3 = await prisma.sucursal.create({
    data: {
      empresaId: empresa.id,
      codigoUnico: 'SUC-004',
      nombre: 'Sucursal Sur',
      direccion: 'Zona Sur 321, Centro Comercial',
      metaVentas: 35000,
    },
  })

  // Crear usuario de sucursal
  const sucursalPassword = await hash('Sucursal@2025', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })
  const sucursalUser = await prisma.usuario.create({
    data: {
      correo: 'sucursal@empresa.com',
      nombre: 'Gerente Sucursal Centro',
      contrasenaHash: sucursalPassword,
      rolId: roleSucursal.id,
      activo: true,
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
  console.log('\n🔐 Sistema de Seguridad Implementado:')
  console.log('  ✅ Autenticación con Argon2')
  console.log('  ✅ Rate Limiting (5 intentos / 15 min)')
  console.log('  ✅ Cookies seguras con HttpOnly')
  console.log('  ✅ Sistema de permisos granular')
  console.log('  ✅ Auditoría de acciones')
  console.log('  ✅ Validación con Zod')
  console.log('  ✅ Data Access Layer (DAL)')
  console.log('\n📧 Credenciales de acceso:')
  console.log('┌──────────────────────────────────────────┐')
  console.log('│ ADMINISTRADOR                            │')
  console.log('│ Email:    admin@empresa.com              │')
  console.log('│ Password: Admin@2025                     │')
  console.log('├──────────────────────────────────────────┤')
  console.log('│ BODEGA                                   │')
  console.log('│ Email:    bodega@empresa.com             │')
  console.log('│ Password: Bodega@2025                    │')
  console.log('├──────────────────────────────────────────┤')
  console.log('│ PRODUCCIÓN                               │')
  console.log('│ Email:    produccion@empresa.com         │')
  console.log('│ Password: Produccion@2025                │')
  console.log('├──────────────────────────────────────────┤')
  console.log('│ SUCURSAL                                 │')
  console.log('│ Email:    sucursal@empresa.com           │')
  console.log('│ Password: Sucursal@2025                  │')
  console.log('└──────────────────────────────────────────┘')
  console.log('\n⚠️  NOTA DE SEGURIDAD:')
  console.log('  • Cambia estas contraseñas en producción')
  console.log('  • Las contraseñas ahora requieren mayúsculas,')
  console.log('    minúsculas, números y caracteres especiales')
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
