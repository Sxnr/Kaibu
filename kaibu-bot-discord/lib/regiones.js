// Roles por región: cada persona elige de dónde es (una sola región) en #información.
// Sirve para armar grupos de gym por zona y saber de dónde llega la gente.
const { MessageFlags, StringSelectMenuBuilder } = require('discord.js')

const REGIONES = [
  { valor: 'arica', nombre: 'Arica y Parinacota' },
  { valor: 'tarapaca', nombre: 'Tarapacá' },
  { valor: 'antofagasta', nombre: 'Antofagasta' },
  { valor: 'atacama', nombre: 'Atacama' },
  { valor: 'coquimbo', nombre: 'Coquimbo' },
  { valor: 'valparaiso', nombre: 'Valparaíso' },
  { valor: 'metropolitana', nombre: 'Metropolitana' },
  { valor: 'ohiggins', nombre: 'O’Higgins' },
  { valor: 'maule', nombre: 'Maule' },
  { valor: 'nuble', nombre: 'Ñuble' },
  { valor: 'biobio', nombre: 'Biobío' },
  { valor: 'araucania', nombre: 'La Araucanía' },
  { valor: 'losrios', nombre: 'Los Ríos' },
  { valor: 'loslagos', nombre: 'Los Lagos' },
  { valor: 'aysen', nombre: 'Aysén' },
  { valor: 'magallanes', nombre: 'Magallanes' },
  { valor: 'otro', nombre: 'Otro país', emoji: '🌎' },
]

const COLOR_REGION = '#8C8280'
const ID_MENU = 'elegir_region'

/** Nombre del rol de cada región ("📍 Metropolitana", "🌎 Otro país"). */
const nombreRol = (r) => `${r.emoji ?? '📍'} ${r.nombre}`

/** Menú desplegable de #información (máximo 25 opciones: alcanzan las 16 regiones y "otro país"). */
function menuRegiones() {
  return new StringSelectMenuBuilder()
    .setCustomId(ID_MENU)
    .setPlaceholder('📍 ¿De qué región eres?')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(REGIONES.map((r) => ({ label: r.nombre, value: r.valor, emoji: r.emoji ?? '📍' })))
}

/** Roles a quitar y a poner al elegir una región (la nueva reemplaza a la anterior). */
function cambioDeRegion(valor, rolesActuales, rolesPorNombre) {
  const elegida = REGIONES.find((r) => r.valor === valor)
  if (!elegida) return null
  const poner = rolesPorNombre.get(nombreRol(elegida)) ?? null
  const quitar = REGIONES.map((r) => rolesPorNombre.get(nombreRol(r)))
    .filter((id) => id && id !== poner && rolesActuales.has(id))
  return { region: elegida, poner, quitar }
}

/** Crea los roles de región que falten (los busca por nombre: no necesitan columnas en la base). */
async function asegurarRolesRegion(guild) {
  let creados = 0
  for (const r of REGIONES) {
    if (guild.roles.cache.some((x) => x.name === nombreRol(r))) continue
    await guild.roles.create({ name: nombreRol(r), colors: { primaryColor: COLOR_REGION }, mentionable: false, reason: 'Kaibu /setup: roles por región' })
    creados += 1
  }
  return creados
}

/** Menú de #información: pone la región elegida y quita la anterior. */
async function elegirRegion(interaction) {
  const rolesPorNombre = new Map(interaction.guild.roles.cache.map((r) => [r.name, r.id]))
  const cambio = cambioDeRegion(interaction.values[0], interaction.member.roles.cache, rolesPorNombre)
  if (!cambio?.poner) return interaction.reply({ content: 'Aún no están los roles de región: avísale al equipo (/setup).', flags: MessageFlags.Ephemeral })
  if (cambio.quitar.length > 0) await interaction.member.roles.remove(cambio.quitar, 'Kaibu: cambió de región')
  if (!interaction.member.roles.cache.has(cambio.poner)) await interaction.member.roles.add(cambio.poner, 'Kaibu: eligió su región')
  return interaction.reply({ content: `¡Listo! Quedaste en <@&${cambio.poner}>. Puedes cambiarla cuando quieras.`, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } })
}

module.exports = { REGIONES, ID_MENU, nombreRol, menuRegiones, cambioDeRegion, asegurarRolesRegion, elegirRegion }
