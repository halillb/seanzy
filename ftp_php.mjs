import pkg from 'basic-ftp'
const { Client } = pkg

const LOCAL = String.raw`C:\Users\halil\OneDrive\Masaüstü\PROJELER\estetix\SÜRÜMLER\estetix-laravel\config\app.php`
const REMOTE = '/estetix-laravel/config/app.php'

const client = new Client()
try {
  await client.access({ host: 'homedya.com', user: 'zza35a2p8r4l', password: '*34HOMedy@34*', secure: false })
  // verify dir exists
  const list = await client.list('/estetix-laravel/config')
  const hasApp = list.some(f => f.name === 'app.php')
  console.log('config dir files:', list.map(f=>f.name).slice(0,5).join(', '), '...')
  console.log('app.php exists:', hasApp)
  if (hasApp) {
    await client.uploadFrom(LOCAL, REMOTE)
    console.log('Uploaded app.php with Europe/Istanbul timezone')
  }
} catch(e) { console.error(e.message) } finally { client.close() }
