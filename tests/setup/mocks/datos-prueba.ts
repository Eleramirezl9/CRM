// Datos de prueba reutilizables

export const PRODUCTO_PRUEBA = {
  id: 'prod-test-1',
  sku: 'SKU-TEST-001',
  nombre: 'Producto de Prueba',
  descripcion: 'Descripción de prueba',
  costoUnitario: 100,
  precioVenta: 150,
  unidadMedida: 'unidad',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const USUARIO_ADMIN_PRUEBA = {
  id: 1,
  correo: 'admin@test.com',
  nombre: 'Admin Test',
  contrasenaHash: 'hash-test',
  rolId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const SUCURSAL_PRUEBA = {
  id: 'suc-test-1',
  empresaId: 'emp-test-1',
  codigoUnico: 'SUC-TEST-001',
  nombre: 'Sucursal de Prueba',
  direccion: 'Dirección de prueba',
  gerenteId: null,
  metaVentas: 10000,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const INVENTARIO_PRUEBA = {
  id: 1,
  sucursalId: 'suc-test-1',
  productoId: 'prod-test-1',
  cantidadActual: 100,
  stockMinimo: 20,
  updatedAt: new Date(),
}

export const VENTA_PRUEBA = {
  id: 'venta-test-1',
  sucursalId: 'suc-test-1',
  vendedorId: 1,
  totalVenta: 450,
  metodoPago: 'efectivo',
  createdAt: new Date(),
}
