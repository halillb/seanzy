import pkg from 'basic-ftp'
const { Client } = pkg
import { join } from 'path'

const HOST = 'homedya.com'
const USER = 'zza35a2p8r4l'
const PASS = '*34HOMedy@34*'
const REMOTE_BASE = '/public_html/homedya.com/estetix'
const LOCAL_DIST = String.raw`C:\Users\halil\OneDrive\Masaüstü\PROJELER\estetix\estetix-ui\dist`

const client = new Client()
client.ftp.verbose = false

try {
  await client.access({ host: HOST, user: USER, password: PASS, secure: false })
  console.log('Connected to FTP')
  console.log('Uploading dist/ to', REMOTE_BASE)
  await client.uploadFromDir(LOCAL_DIST, REMOTE_BASE)
  console.log('Done!')
} catch(e) {
  console.error('Error:', e.message)
  process.exit(1)
} finally {
  client.close()
}
