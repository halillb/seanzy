import pkg from 'basic-ftp'
const { Client } = pkg

const BASE_LOCAL = String.raw`C:\Users\halil\OneDrive\Masaüstü\PROJELER\estetix\SÜRÜMLER\estetix-laravel`
const BASE_REMOTE = '/estetix-laravel'

const client = new Client()
try {
  await client.access({ host: 'homedya.com', user: 'zza35a2p8r4l', password: '*34HOMedy@34*', secure: false })
  console.log('Connected')
  await client.uploadFrom(`${BASE_LOCAL}\\app\\Http\\Controllers\\Api\\AyarController.php`, `${BASE_REMOTE}/app/Http/Controllers/Api/AyarController.php`)
  console.log('✓ AyarController.php')
} catch(e) { console.error(e.message) } finally { client.close() }
