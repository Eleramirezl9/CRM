// 🔍 Script de debug PWA - Copia y pega en la consola (F12)
// Para verificar por qué no aparece el botón de instalación

console.log('🔍 === PWA DEBUG SCRIPT === 🔍');
console.log('');

// 1. Detectar dispositivo
const userAgent = navigator.userAgent.toLowerCase();
console.log('📱 USER AGENT:', userAgent);
console.log('');

const isAndroid = /android/.test(userAgent);
const isIOS = /iphone|ipad|ipod/.test(userAgent);
const isMobile = /android|webos|iphone|ipad|ipot|blackberry|iemobile|opera mini/.test(userAgent);

console.log('🔎 DETECCIÓN DE DISPOSITIVO:');
console.log('   Android:', isAndroid ? '✅ SÍ' : '❌ NO');
console.log('   iOS:', isIOS ? '✅ SÍ' : '❌ NO');
console.log('   Móvil (en general):', isMobile ? '✅ SÍ' : '❌ NO');
console.log('');

// 2. Verificar si ya está instalada
const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
console.log('📦 ¿YA ESTÁ INSTALADA?', isInstalled ? '✅ SÍ' : '❌ NO (aún no)');
console.log('');

// 3. Verificar beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ BEFOREINSTALLPROMPT CAPTURADO');
  console.log('   Este es el evento que hace aparecer el botón de instalar');
});

// 4. Verificar service worker
if ('serviceWorker' in navigator) {
  console.log('🔧 SERVICE WORKER:');
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length > 0) {
      console.log('   ✅ ACTIVO - Registraciones:', registrations.length);
      registrations.forEach((reg, i) => {
        console.log(`   ${i + 1}. Scope: ${reg.scope}`);
        console.log(`      Estado: ${reg.active ? 'Activo' : 'Pendiente'}`);
      });
    } else {
      console.log('   ⚠️ NO HAY SERVICE WORKERS REGISTRADOS');
    }
  });
} else {
  console.log('   ❌ NO SOPORTADO');
}
console.log('');

// 5. Verificar HTTPS
console.log('🔐 PROTOCOLO:');
console.log('   ' + (location.protocol === 'https:' ? '✅ HTTPS (correcto)' : '❌ HTTP (PWA requiere HTTPS)'));
console.log('');

// 6. Verificar manifest.json
console.log('📄 MANIFEST.JSON:');
fetch('/manifest.json')
  .then(r => r.json())
  .then(manifest => {
    console.log('   ✅ ENCONTRADO');
    console.log('   Name:', manifest.name);
    console.log('   Short name:', manifest.short_name);
    console.log('   Display:', manifest.display);
    console.log('   Icons:', manifest.icons?.length || 0);
  })
  .catch(err => {
    console.log('   ❌ NO ENCONTRADO O ERROR:', err.message);
  });

console.log('');
console.log('💡 RECOMENDACIONES:');
if (!isMobile) {
  console.log('   1. Este NO es un dispositivo móvil');
  console.log('   2. Abre esto en un celular para ver el botón de instalar');
} else if (isIOS) {
  console.log('   1. En iOS, usa Safari (no Chrome)');
  console.log('   2. Busca el botón "Compartir" (↑) abajo');
  console.log('   3. Selecciona "Añadir a Inicio"');
} else if (isAndroid) {
  console.log('   1. Espera a que aparezca el botón (3-4 segundos)');
  console.log('   2. Si aparece "Instalar ahora", haz clic');
  console.log('   3. Confirma en el diálogo del navegador');
}

console.log('');
console.log('✅ DEBUG COMPLETADO');
