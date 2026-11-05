// Distingue la clave secreta de Supabase (la que necesita el bot) de la pública (la de la app).
// No muestra ni guarda la clave: solo mira su forma.

/** 'secreta' (service_role o sb_secret_), 'publica' (anon o sb_publishable_) o 'desconocida'. */
function tipoDeClave(clave) {
  const k = String(clave ?? '').trim()
  if (k.startsWith('sb_secret_')) return 'secreta'
  if (k.startsWith('sb_publishable_')) return 'publica'
  const partes = k.split('.')
  if (partes.length !== 3) return 'desconocida'
  try {
    const { role } = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'))
    if (role === 'service_role') return 'secreta'
    if (role === 'anon') return 'publica'
  } catch {
    // No es un JWT válido.
  }
  return 'desconocida'
}

module.exports = { tipoDeClave }
