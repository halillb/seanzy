import sharp from 'sharp'
import { readFileSync } from 'fs'

const svg = readFileSync('public/icon.svg')

async function main() {
  await sharp(svg, { density: 384 }).resize(192, 192).png().toFile('public/icon-192.png')
  await sharp(svg, { density: 384 }).resize(512, 512).png().toFile('public/icon-512.png')
  await sharp(svg, { density: 384 }).resize(1024, 1024).png().toFile('public/icon-1024.png')

  // Maskable: içerik %80 safe-zone içinde kalacak şekilde arka plan üstüne ortalanmış küçültme
  const bg = { r: 0x0c, g: 0x0c, b: 0x0d, alpha: 1 }
  const inner = await sharp(svg, { density: 384 }).resize(410, 410).png().toBuffer()
  await sharp({ create: { width: 512, height: 512, channels: 4, background: bg } })
    .composite([{ input: inner, left: 51, top: 51 }])
    .png().toFile('public/icon-maskable-512.png')

  console.log('done')
}
main()
