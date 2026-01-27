// Script to generate PWA icons using sharp
// Run with: node scripts/generate-icons.mjs

import sharp from 'sharp'

const sizes = [
  { name: 'favicon.ico', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
]

async function generateIcon(size) {
  const cornerRadius = Math.round(size * 0.15)
  
  // Create SVG with rounded rectangle background and letter T
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#0f172a"/>
      <text 
        x="50%" 
        y="54%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.55}" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >T</text>
    </svg>
  `
  
  return sharp(Buffer.from(svg)).png().toBuffer()
}

// Generate icons
async function main() {
  for (const { name, size } of sizes) {
    const buffer = await generateIcon(size)
    const path = `public/${name}`
    await sharp(buffer).toFile(path)
    console.log(`Generated: ${path} (${size}x${size})`)
  }
  console.log('All icons generated successfully!')
}

main().catch(console.error)
