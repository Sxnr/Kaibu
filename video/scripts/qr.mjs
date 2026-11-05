// Genera el código QR de la invitación al Discord (public/discord/qr.svg) para el cierre del video.
// Uso: npm run qr --prefix video   (o con otro link: node scripts/qr.mjs https://discord.gg/xxxx)
import QRCode from 'qrcode'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const link = process.argv[2] ?? 'https://discord.gg/xeyuq4M2rP'
const salida = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'discord', 'qr.svg')
await QRCode.toFile(salida, link, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0f0d0d', light: '#ffffff' } })
console.log('✓ QR de', link, '→', salida)
