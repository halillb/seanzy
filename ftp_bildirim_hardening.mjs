import pkg from 'basic-ftp'
const { Client } = pkg

const BASE_LOCAL = String.raw`C:\Users\halil\OneDrive\Masaüstü\PROJELER\estetix\SÜRÜMLER\estetix-laravel`
const BASE_REMOTE = '/estetix-laravel'

const FILES = [
  ['app/Http/Controllers/Api/BildirimController.php', 'app/Http/Controllers/Api/BildirimController.php'],
  ['routes/api.php', 'routes/api.php'],
]

const client = new Client()
try {
  await client.access({ host: 'homedya.com', user: 'zza35a2p8r4l', password: '*34HOMedy@34*', secure: false })
  console.log('Connected')
  for (const [local, remote] of FILES) {
    await client.uploadFrom(`${BASE_LOCAL}\\${local.replace(/\//g, '\\')}`, `${BASE_REMOTE}/${remote}`)
    console.log(`✓ ${remote}`)
  }
  console.log('All done!')
} catch(e) { console.error(e.message) } finally { client.close() }
