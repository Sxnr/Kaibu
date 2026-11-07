// La lista de miembros se pide una sola vez a la vez, y si Discord pide esperar, se espera y se reintenta.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { conReintento, traerMiembros } = require('../lib/miembros')

const limite = (segundos) => Object.assign(new Error('rate limited'), { name: 'GatewayRateLimitError', data: { retry_after: segundos } })
const sinEspera = () => Promise.resolve()

test('reintenta tras el límite de Discord, esperando lo que pide', async () => {
  let intentos = 0
  const esperas = []
  const r = await conReintento(
    async () => {
      intentos += 1
      if (intentos < 3) throw limite(4.691)
      return 'ok'
    },
    { esperar: async (ms) => esperas.push(ms) },
  )
  assert.equal(r, 'ok')
  assert.equal(intentos, 3)
  assert.ok(esperas.every((ms) => ms >= 4691))
})

test('otros errores no se reintentan', async () => {
  let intentos = 0
  await assert.rejects(conReintento(async () => {
    intentos += 1
    throw new Error('otro')
  }, { esperar: sinEspera }))
  assert.equal(intentos, 1)
})

test('se rinde después de varios intentos', async () => {
  await assert.rejects(conReintento(async () => { throw limite(1) }, { esperar: sinEspera, intentos: 2 }), /rate limited/)
})

test('dos pedidos seguidos del mismo servidor comparten una sola llamada', async () => {
  let llamadas = 0
  const guild = { id: 'g-prueba', members: { fetch: async () => { llamadas += 1; return new Map() } } }
  await Promise.all([traerMiembros(guild), traerMiembros(guild)])
  await traerMiembros(guild)
  assert.equal(llamadas, 1)
})
