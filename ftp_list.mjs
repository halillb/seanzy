import pkg from 'basic-ftp'
const { Client } = pkg
const client = new Client()
try {
  await client.access({ host: 'homedya.com', user: 'zza35a2p8r4l', password: '*34HOMedy@34*', secure: false })
  console.log('=== /public_html/homedya.com/estetix ===')
  const es = await client.list('/public_html/homedya.com/estetix')
  es.forEach(f => console.log(f.type === 2 ? `[DIR] ${f.name}` : `      ${f.name}`))
  console.log('\n=== /estetix-laravel (check for public symlink or api.php) ===')
  const l = await client.list('/estetix-laravel')
  l.forEach(f => console.log(f.type === 2 ? `[DIR] ${f.name}` : `      ${f.name}`))
} catch(e) { console.error(e.message) } finally { client.close() }
