// La clave de Supabase del bot debe ser la secreta (service_role), nunca la pública (anon).
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { tipoDeClave, limpiarClave } = require('../lib/clave')

test('limpiarClave quita espacios y saltos de línea pegados por error', () => {
  assert.equal(limpiarClave('sb_secret_abc\nDEF '), 'sb_secret_abcDEF')
  assert.equal(limpiarClave(' eyJ.a b.c\r\n'), 'eyJ.ab.c')
  assert.equal(limpiarClave(undefined), '')
})

// JWT de ejemplo inventados (firma falsa): solo importa el "role" de adentro.
const jwt = (payload) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.firma`

test('reconoce las claves nuevas de Supabase', () => {
  assert.equal(tipoDeClave('sb_secret_abc123'), 'secreta')
  assert.equal(tipoDeClave('sb_publishable_abc123'), 'publica')
})

test('reconoce las claves antiguas (JWT) por su rol', () => {
  assert.equal(tipoDeClave(jwt({ role: 'service_role', iss: 'supabase' })), 'secreta')
  assert.equal(tipoDeClave(jwt({ role: 'anon', iss: 'supabase' })), 'publica')
})

test('no se cae con claves raras o vacías', () => {
  assert.equal(tipoDeClave(''), 'desconocida')
  assert.equal(tipoDeClave('cualquier-cosa'), 'desconocida')
  assert.equal(tipoDeClave(' sb_secret_abc '), 'secreta')
})
