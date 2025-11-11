/**
 * Script para probar la lógica de rutas del middleware
 */

// Simular el mapeo del middleware
const routePermissions: Record<string, string[]> = {
  '/dashboard/usuarios': ['usuarios.ver'],
  '/dashboard/roles': ['roles.ver'],
  '/dashboard/productos': ['productos.ver'],
  '/dashboard/inventario': ['inventario.ver'],
  '/dashboard/ventas': ['ventas.ver'],
  '/dashboard/envios': ['envios.ver'],
  '/dashboard/produccion': ['produccion.ver'],
  '/dashboard/sucursales': ['sucursales.ver'],
  '/dashboard/reportes': ['reportes.ver'],
  '/dashboard/auditoria': ['auditoria.ver'],
}

// Rutas a probar
const testPaths = [
  '/dashboard/ventas',
  '/dashboard/inventario',
  '/dashboard/envios',
  '/dashboard/envios/nuevo',
  '/dashboard/productos/nuevo',
  '/dashboard/productos/123',
  '/dashboard/ventas/123/editar',
  '/dashboard/sucursales/abc123',
]

// Permisos de ejemplo de un usuario
const permisosUsuario = ['ventas.ver', 'inventario.ver']

console.log('🧪 TEST DE LÓGICA DE RUTAS DEL MIDDLEWARE\n')
console.log(`Permisos del usuario: ${permisosUsuario.join(', ')}\n`)

for (const pathname of testPaths) {
  let allowed = false
  let matchedRoute = null

  // Lógica actual del middleware (líneas 100-109)
  for (const [route, requiredPerms] of Object.entries(routePermissions)) {
    if (pathname.startsWith(route)) {
      allowed = requiredPerms.some(perm => permisosUsuario.includes(perm))
      matchedRoute = route
      break
    }
  }

  console.log(`Ruta: ${pathname}`)
  console.log(`  Matched: ${matchedRoute || 'NINGUNA'}`)
  console.log(`  Allowed: ${allowed ? '✅' : '❌'}`)

  if (!matchedRoute) {
    console.log(`  ⚠️  PROBLEMA: Esta ruta NO matchea con ninguna regla`)
  }
  console.log()
}

console.log('\n📊 ANÁLISIS:')
console.log('- Si una ruta NO está en el mapeo, no entra al bucle')
console.log('- allowed queda en false pero NUNCA se verifica')
console.log('- Por lo tanto, la ruta pasa sin restricción')
console.log('\n💡 SOLUCIÓN:')
console.log('- Usar startsWith para capturar sub-rutas')
console.log('- O tener una lista más completa de rutas')
console.log('- O tener una regla por defecto que DENIEGUE el acceso')
