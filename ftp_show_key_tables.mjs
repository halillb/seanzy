import pkg from 'basic-ftp'
import https from 'https'
const { Client } = pkg

const LOCAL  = String.raw`C:\Users\halil\OneDrive\Masaüstü\PROJELER\estetix\SÜRÜMLER\show_key_tables.php`
const REMOTE = '/public_html/homedya.com/estetix/show_key_tables.php'
const URL    = 'https://homedya.com/estetix/show_key_tables.php?key=EstetiX2026migrate'

const client = new Client()
try {
  await client.access({ host: 'homedya.com', user: 'zza35a2p8r4l', password: '*34HOMedy@34*', secure: false })
  await client.uploadFrom(LOCAL, REMOTE)
  client.close()
  await new Promise((resolve, reject) => {
    https.get(URL, (res) => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => { console.log(body); resolve() })
    }).on('error', reject)
  })
  const c2 = new Client()
  await c2.access({ host: 'homedya.com', user: 'zza35a2p8r4l', password: '*34HOMedy@34*', secure: false })
  await c2.remove(REMOTE)
  c2.close()
} catch(e) { console.error(e.message); client.close() }
