import sharp from 'sharp'

const src = 'public/logo-kaynak/logo-dark.png'

async function main() {
  await sharp(src).resize(192, 192).png().toFile('public/icon-192.png')
  await sharp(src).resize(512, 512).png().toFile('public/icon-512.png')
  await sharp(src).resize(1024, 1024).png().toFile('public/icon-1024.png')
  await sharp(src).resize(512, 512).png().toFile('public/icon-maskable-512.png')
  await sharp(src).resize(180, 180).png().toFile('public/apple-touch-icon.png')
  await sharp(src).resize(48, 48).png().toFile('public/favicon.png')
  console.log('done')
}
main()
