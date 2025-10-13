// Script para configurar variables de entorno en Vercel
// Ejecuta: node setup-vercel-env.js

const projectName = 'crm-multi-sucursal';

const envVars = {
  'DATABASE_URL': 'postgresql://postgres:aXDoaqSfJUsvTYMD@db.dsrscfajkbjneamnmhlh.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1',
  'DIRECT_URL': 'postgresql://postgres:aXDoaqSfJUsvTYMD@db.dsrscfajkbjneamnmhlh.supabase.co:5432/postgres',
  'NEXT_PUBLIC_SUPABASE_URL': 'https://dsrscfajkbjneamnmhlh.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcnNjZmFqa2JqbmVhbW5taGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNTQ4MDEsImV4cCI6MjA3NDkzMDgwMX0.D9X1003e4IN8_ibZi6_2yWigFWvi0fpqNfDuNH6zmWc',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcnNjZmFqa2JqbmVhbW5taGxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM1NDgwMSwiZXhwIjoyMDc0OTMwODAxfQ.nJl3MqBs9dyyfvz5TzwCieLtVm-CHKUUF5YDSg2yyKI',
  'NEXTAUTH_URL': 'https://crm-multi-sucursal.vercel.app',
  'NEXTAUTH_SECRET': 'KkiISalZ3IEqJwScQXazBpBHoX7GPsXOlR+owTCyHrHW+llQLkwfrut61GEo0YRJgooaLby3Kmf4uc0SbCQ56Q=='
};

console.log('🔧 Variables de entorno para configurar en Vercel:');
console.log(`Proyecto: ${projectName}`);
console.log('=====================================');

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('=====================================');
console.log('📋 PASOS:');
console.log('1. Ve a: https://vercel.com/dashboard');
console.log(`2. Selecciona el proyecto: ${projectName}`);
console.log('3. Ve a Settings → Environment Variables');
console.log('4. Agrega cada variable de arriba');
console.log('5. Marca todas como Production, Preview, Development');
console.log('6. Haz un Redeploy');
console.log('');
console.log('🚀 O usa Vercel CLI:');
console.log('vercel env add DATABASE_URL');
console.log('vercel env add DIRECT_URL');
console.log('vercel env add NEXT_PUBLIC_SUPABASE_URL');
console.log('vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('vercel env add SUPABASE_SERVICE_ROLE_KEY');
console.log('vercel env add NEXTAUTH_URL');
console.log('vercel env add NEXTAUTH_SECRET');
console.log('vercel --prod');
