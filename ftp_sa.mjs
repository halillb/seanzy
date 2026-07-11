import pkg from 'basic-ftp'
const { Client } = pkg

const LOCAL = String.raw`C:\Users\halil\OneDrive\Masaüstü\PROJELER\estetix\SÜRÜMLER\estetix-laravel\app\Http\Controllers\Api\SuperAdminController.php`
const REMOTE = '/estetix-laravel/app/Http/Controllers/Api/SuperAdminController.php'

const client = new Client()
try {
  await client.access({ host: 'homedya.com', user: 'zza35a2p8r4l', password: '*34HOMedy@34*', secure: false })
  await client.uploadFrom(LOCAL, REMOTE)
  console.log('SuperAdminController.php uploaded')
} catch(e) { console.error(e.message) } finally { client.close() }
