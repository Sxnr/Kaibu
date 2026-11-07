// Qué ve cada rol: al entrar solo #verificación; Miembro ve información y comunidad; Beta Tester además la beta.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { permisosCanal, puedeVincular, estadoCupo, esDelEquipo } = require('../lib/permisos')

const ids = { everyone: 'E', bot: 'B', miembro: 'M', tester: 'T', equipo: 'Q' }
const de = (lista, id) => lista.find((o) => o.id === id) ?? { allow: [], deny: [] }

test('verificación: la ve quien recién entra, pero no escribe; el miembro ya no la ve', () => {
  const p = permisosCanal('verificacion', ids)
  assert.ok(de(p, 'E').allow.includes('ViewChannel'))
  assert.ok(de(p, 'E').deny.includes('SendMessages'))
  assert.ok(de(p, 'M').deny.includes('ViewChannel'))
})

test('información y comunidad: ocultas para quien no se verifica', () => {
  for (const tipo of ['info', 'comunidad', 'comunidadLectura']) {
    const p = permisosCanal(tipo, ids)
    assert.ok(de(p, 'E').deny.includes('ViewChannel'), tipo)
    assert.ok(de(p, 'M').allow.includes('ViewChannel'), tipo)
  }
  assert.ok(de(permisosCanal('info', ids), 'M').deny.includes('SendMessages'))
  assert.ok(de(permisosCanal('comunidad', ids), 'M').allow.includes('SendMessages'))
  assert.ok(de(permisosCanal('comunidadLectura', ids), 'M').allow.includes('SendMessagesInThreads'))
})

test('beta: solo Beta Tester y Equipo', () => {
  for (const tipo of ['beta', 'betaLectura']) {
    const p = permisosCanal(tipo, ids)
    assert.ok(de(p, 'E').deny.includes('ViewChannel'))
    assert.equal(de(p, 'M').allow.includes('ViewChannel'), false)
    assert.ok(de(p, 'T').allow.includes('ViewChannel'))
    assert.ok(de(p, 'Q').allow.includes('ViewChannel'))
  }
})

test('equipo: solo el rol Equipo; el bot siempre ve y escribe', () => {
  const p = permisosCanal('staff', ids)
  assert.ok(de(p, 'E').deny.includes('ViewChannel'))
  assert.equal(de(p, 'T').allow.includes('ViewChannel'), false)
  assert.ok(de(p, 'Q').allow.includes('ViewChannel'))
  for (const tipo of ['verificacion', 'info', 'comunidad', 'beta', 'staff']) {
    assert.ok(de(permisosCanal(tipo, ids), 'B').allow.includes('SendMessages'), tipo)
  }
})

test('sin un rol configurado no se arma un permiso vacío', () => {
  const p = permisosCanal('beta', { ...ids, tester: null })
  assert.equal(p.some((o) => !o.id), false)
})

test('vincular: solo Beta Tester, Equipo o administración', () => {
  const cfg = { tester_role_id: 'T', equipo_role_id: 'Q' }
  assert.equal(puedeVincular(new Set(['M']), cfg, false), false)
  assert.equal(puedeVincular(new Set(['M', 'T']), cfg, false), true)
  assert.equal(puedeVincular(new Set(['Q']), cfg, false), true)
  assert.equal(puedeVincular(new Set(), cfg, true), true)
  assert.equal(esDelEquipo(new Set(['Q']), cfg, false), true)
  assert.equal(esDelEquipo(new Set(['T']), cfg, false), false)
})

test('cupo de beta testers', () => {
  assert.deepEqual(estadoCupo(5, 20), { quedan: 15, lleno: false })
  assert.deepEqual(estadoCupo(20, 20), { quedan: 0, lleno: true })
  assert.deepEqual(estadoCupo(25, 20), { quedan: 0, lleno: true })
})
