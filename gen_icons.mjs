import sharp from 'sharp'

const src = 'public/logo-kaynak/logo-dark.png'

async function main() {
  await sharp(src).resize(192, 192).png().toFile('public/icon-192.png')
  await sharp(src).resize(512, 512).png().toFile('public/icon-512.png')
  await sharp(src).resize(1024, 1024).png().toFile('public/icon-1024.png')
  await sharp(src).resize(180, 180).png().toFile('public/apple-touch-icon.png')
  await sharp(src).resize(48, 48).png().toFile('public/favicon.png')

  // Maskable: içerik %80 safe-zone içinde kalacak şekilde arka plan üstüne ortalanmış küçültme
  const bg = { r: 0x0c, g: 0x0c, b: 0x0d, alpha: 1 }
  const inner = await sharp(src).resize(410, 410).png().toBuffer()
  await sharp({ create: { width: 512, height: 512, channels: 4, background: bg } })
    .composite([{ input: inner, left: 51, top: 51 }])
    .png().toFile('public/icon-maskable-512.png')

  console.log('done')
}
main()
