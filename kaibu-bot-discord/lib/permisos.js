// Permisos de cada tipo de canal y reglas de acceso (lógica pura, sin Discord).
// Al entrar solo se ve #verificación; Miembro ve información y comunidad; Beta Tester además la beta; Equipo todo.

const VER = ['ViewChannel', 'ReadMessageHistory']
const ESCRIBIR = ['SendMessages', 'SendMessagesInThreads', 'AddReactions', 'AttachFiles', 'EmbedLinks']
const BOT = ['ViewChannel', 'SendMessages', 'EmbedLinks', 'AttachFiles', 'ReadMessageHistory', 'CreatePublicThreads', 'SendMessagesInThreads', 'ManageMessages']

/**
 * Permisos de un canal según su tipo.
 * @param {'verificacion'|'info'|'comunidad'|'comunidadLectura'|'beta'|'betaLectura'|'staff'} tipo
 * @param {{ everyone: string, bot: string, miembro?: string|null, tester?: string|null, equipo?: string|null }} r
 * @returns {{ id: string, allow: string[], deny: string[] }[]} nombres de PermissionFlagsBits
 */
function permisosCanal(tipo, r) {
  const lista = []
  const poner = (id, allow, deny = []) => {
    if (id) lista.push({ id, allow, deny })
  }
  const equipo = () => poner(r.equipo, [...VER, ...ESCRIBIR])
  switch (tipo) {
    case 'verificacion':
      poner(r.everyone, VER, ['SendMessages', 'CreatePublicThreads', 'AddReactions'])
      poner(r.miembro, [], ['ViewChannel'])
      break
    case 'info':
      poner(r.everyone, [], ['ViewChannel'])
      poner(r.miembro, VER, ['SendMessages', 'CreatePublicThreads'])
      equipo()
      break
    case 'comunidad':
      poner(r.everyone, [], ['ViewChannel'])
      poner(r.miembro, [...VER, ...ESCRIBIR])
      equipo()
      break
    case 'comunidadLectura':
      poner(r.everyone, [], ['ViewChannel'])
      poner(r.miembro, [...VER, 'SendMessagesInThreads'], ['SendMessages', 'CreatePublicThreads'])
      equipo()
      break
    case 'beta':
      poner(r.everyone, [], ['ViewChannel'])
      poner(r.tester, [...VER, ...ESCRIBIR])
      equipo()
      break
    case 'betaLectura':
      poner(r.everyone, [], ['ViewChannel'])
      poner(r.tester, [...VER, 'SendMessagesInThreads'], ['SendMessages', 'CreatePublicThreads'])
      equipo()
      break
    case 'staff':
      poner(r.everyone, [], ['ViewChannel'])
      equipo()
      break
    default:
      throw new Error(`Tipo de canal desconocido: ${tipo}`)
  }
  poner(r.bot, BOT)
  return lista
}

/** Miembro del equipo: rol 🛡️ Equipo Kaibu o permiso de administrar el servidor. */
function esDelEquipo(roles, cfg, administra) {
  return Boolean(administra || (cfg?.equipo_role_id && roles.has(cfg.equipo_role_id)))
}

/** Por ahora vincular la app es solo para Beta Testers (y el equipo). */
function puedeVincular(roles, cfg, administra) {
  return esDelEquipo(roles, cfg, administra) || Boolean(cfg?.tester_role_id && roles.has(cfg.tester_role_id))
}

function estadoCupo(aprobadas, cupo) {
  const quedan = Math.max(0, cupo - aprobadas)
  return { quedan, lleno: quedan === 0 }
}

module.exports = { permisosCanal, esDelEquipo, puedeVincular, estadoCupo }
