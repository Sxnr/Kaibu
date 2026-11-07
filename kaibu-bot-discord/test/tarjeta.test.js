// El banner de bienvenida se dibuja y sale como PNG de 1100×480 (con o sin foto de perfil).
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { dibujarBienvenida } = require('../lib/tarjetaBienvenida')

const esPng = (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
const ancho = (b) => b.readUInt32BE(16)
const alto = (b) => b.readUInt32BE(20)

test('banner sin foto (inicial) y con nombre largo', async () => {
  const png = await dibujarBienvenida({ nombre: 'un_nombre_larguisimo_de_discord', avatar: null, numero: 128 })
  assert.ok(esPng(png))
  assert.equal(ancho(png), 1100)
  assert.equal(alto(png), 480)
})

test('banner con foto de perfil (PNG descargado de Discord)', async () => {
  const { createCanvas } = require('@napi-rs/canvas')
  const foto = createCanvas(256, 256)
  const ctx = foto.getContext('2d')
  ctx.fillStyle = '#3FBF7F'
  ctx.fillRect(0, 0, 256, 256)
  const png = await dibujarBienvenida({ nombre: 'ana_fit', avatar: foto.toBuffer('image/png'), numero: 7 })
  assert.ok(esPng(png))
  assert.equal(ancho(png), 1100)
})
