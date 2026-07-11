import sharp from 'sharp'

async function main() {
  const bg = { r: 0x0c, g: 0x0c, b: 0x0d, alpha: 1 }
  const mark = await sharp('public/logo-kaynak/logo-transparent.png').resize(640, 640).png().toBuffer()
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: bg } })
    .composite([{ input: mark, left: Math.round((2732 - 640) / 2), top: Math.round((2732 - 640) / 2) }])
    .png().toFile('resources/splash.png')
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: bg } })
    .composite([{ input: mark, left: Math.round((2732 - 640) / 2), top: Math.round((2732 - 640) / 2) }])
    .png().toFile('resources/splash-dark.png')
  console.log('splash done')
}
main()
