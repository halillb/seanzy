import pkg from 'basic-ftp'
import https from 'https'
const { Client } = pkg

const LOCAL  = String.raw`C:\Users\halil\OneDrive\Masaüstü\PROJELER\estetix\SÜRÜMLER\run_migrate_once.php`
const REMOTE = '/public_html/homedya.com/estetix/run_migrate_once.php'
const URL    = 'https://homedya.com/estetix/run_migrate_once.php?key=EstetiX2026migrate'

const client = new Client()
try {
  await client.access({ host: 'homedya.com', user: 'zza35a2p8r4l', password: '*34HOMedy@34*', secure: false })
  await client.uploadFrom(LOCAL, REMOTE)
  console.log('✓ Runner uploaded. Triggering migration...')
  client.close()

  await new Promise((resolve, reject) => {
    https.get(URL, (res) => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => { console.log('Migration output:\n' + body); resolve() })
    }).on('error', reject)
  })

  // Delete the runner
  const c2 = new Client()
  await c2.access({ host: 'homedya.com', user: 'zza35a2p8r4l', password: '*34HOMedy@34*', secure: false })
  await c2.remove(REMOTE)
  c2.close()
  console.log('✓ Runner deleted.')
} catch(e) { console.error(e.message); client.close() }
