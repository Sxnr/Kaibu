// Lista de miembros del servidor sin chocar con el límite de Discord (opcode 8).
// /setup y la sincronización de roles la pedían al mismo tiempo: ahora comparten un solo pedido
// durante un minuto, y si Discord pide esperar, se espera lo indicado y se reintenta.

const VIGENCIA_MS = 60 * 1000
const cache = new Map()
const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

/** Ejecuta fn; si Discord responde con límite de pedidos, espera retry_after y reintenta. */
async function conReintento(fn, { intentos = 4, esperar = dormir } = {}) {
  for (let i = 1; ; i += 1) {
    try {
      return await fn()
    } catch (e) {
      const esLimite = e?.name === 'GatewayRateLimitError' || typeof e?.data?.retry_after === 'number'
      if (!esLimite || i >= intentos) throw e
      await esperar(Math.ceil((e.data?.retry_after ?? 5) * 1000) + 500)
    }
  }
}

/** Todos los miembros del servidor (el mismo pedido se comparte por un minuto). */
function traerMiembros(guild) {
  const guardado = cache.get(guild.id)
  if (guardado && guardado.hasta > Date.now()) return guardado.promesa
  const promesa = conReintento(() => guild.members.fetch())
  cache.set(guild.id, { promesa, hasta: Date.now() + VIGENCIA_MS })
  promesa.catch(() => cache.delete(guild.id))
  return promesa
}

module.exports = { conReintento, traerMiembros }
