import pkg from 'basic-ftp'
const { Client } = pkg

const client = new Client()
try {
  await client.access({ host: 'homedya.com', user: 'zza35a2p8r4l', password: '*34HOMedy@34*', secure: false })
  // Try common Laravel paths
  for (const p of [
    '/public_html/homedya.com/estetix/config',
    '/public_html/homedya.com/estetix/../config',
    '/public_html/homedya.com/config',
  ]) {
    try {
      const list = await client.list(p)
      console.log(p + ':', list.map(f=>f.name).join(', '))
    } catch(e) { console.log(p + ': NOT FOUND') }
  }
  // list root
  const root = await client.list('/')
  console.log('root:', root.map(f=>f.name+(f.isDirectory?'/':'')).join(', '))
} catch(e) { console.error(e.message) } finally { client.close() }
