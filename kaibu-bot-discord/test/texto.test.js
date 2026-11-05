// Pruebas de los textos: límites de Discord, texto seguro para GitHub y lectura de respuestas.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { truncar, paraGitHub, leerSiNo, leerPrecio, describirPlataforma, codigoValido, numeroCL } = require('../lib/texto')

test('truncar respeta el límite y marca el corte', () => {
  assert.equal(truncar('hola', 10), 'hola')
  assert.equal(truncar('abcdefghij', 5), 'abcd…')
  assert.equal(truncar('', 5, 'Sin texto'), 'Sin texto')
})

test('paraGitHub no notifica a nadie con @ y no rompe el formato', () => {
  const t = paraGitHub('Hola @octocat mira <script> y ```código```')
  assert.ok(!t.includes('@octocat'))
  assert.ok(t.includes('@​octocat'))
  assert.ok(!t.includes('```'))
  assert.ok(!t.includes('<script>'))
})

test('leerSiNo entiende respuestas comunes en español', () => {
  assert.equal(leerSiNo('Sí'), true)
  assert.equal(leerSiNo('si, claro'), true)
  assert.equal(leerSiNo('NO'), false)
  assert.equal(leerSiNo('nop'), false)
  assert.equal(leerSiNo('no sé'), null)
  assert.equal(leerSiNo('tal vez'), null)
})

test('leerPrecio acepta formatos chilenos', () => {
  assert.equal(leerPrecio('$2.990'), 2990)
  assert.equal(leerPrecio('2990 pesos'), 2990)
  assert.equal(leerPrecio('3 lucas'), null)
  assert.equal(leerPrecio(''), null)
  assert.equal(leerPrecio('999999'), null)
})

test('describirPlataforma y código de vinculación', () => {
  assert.equal(describirPlataforma('Android APK · Chrome 130'), 'Android APK · Chrome 130')
  assert.equal(codigoValido(' ab3k9z '), 'AB3K9Z')
  assert.equal(codigoValido('AB1K9Z'), null)
  assert.equal(codigoValido('ABC'), null)
})

test('numeroCL usa coma decimal y punto de miles', () => {
  assert.equal(numeroCL(1403), '1.403')
  assert.equal(numeroCL(62.5, 1), '62,5')
})
