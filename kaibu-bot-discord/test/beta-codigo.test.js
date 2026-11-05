// Códigos de beta: 8 caracteres sin letras que se confunden (I, O, 0, 1) y un link directo a la app.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { generarCodigoBeta, linkBeta } = require('../lib/reglas')

test('generarCodigoBeta: 8 caracteres válidos para la base de datos', () => {
  for (let i = 0; i < 200; i++) assert.match(generarCodigoBeta(), /^[A-HJ-NP-Z2-9]{8}$/)
})

test('generarCodigoBeta: no se repiten (aleatorio seguro)', () => {
  const codigos = new Set(Array.from({ length: 500 }, () => generarCodigoBeta()))
  assert.equal(codigos.size, 500)
})

test('linkBeta: lleva a /beta con el código listo', () => {
  assert.equal(linkBeta('https://kaibu-nine.vercel.app', 'ABCD2345'), 'https://kaibu-nine.vercel.app/beta?codigo=ABCD2345')
  assert.equal(linkBeta('https://kaibu-nine.vercel.app/', 'ABCD2345'), 'https://kaibu-nine.vercel.app/beta?codigo=ABCD2345')
})
