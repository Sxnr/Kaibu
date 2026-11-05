// Tareas diarias y semanales de la comunidad: dato del día (8:30), desafío semanal (lunes a domingo)
// y el panel "Kaibu hoy" del canal de roadmap, que se edita solo cuando la app publica una versión.
// Regla anti-spam: primero se guarda en Supabase "ya lo hice"; si no se puede guardar, no se publica.
const { supabase, COLOR } = require('./config')
const { embedKaibu } = require('./marca')
const { configPrincipal, leerNovedades } = require('./conectada')
const { refrescarRoadmap } = require('./servidor')
const { DATOS, DESAFIOS } = require('./contenido')
const R = require('./reglas')

const canal = (client, id) => (id ? client.channels.fetch(id).catch(() => null) : null)

/** Guarda en la configuración; devuelve false (y no se publica nada) si Supabase falla. */
async function guardar(cfg, cambios) {
  const { error } = await supabase().from('discord_guild_config').update(cambios).eq('guild_id', cfg.guild_id)
  if (error) console.error('No pude guardar el estado del bot (¿falta la migración 20261108?):', error.message)
  return !error
}

/** ☀️ Dato del día, una vez al día. */
async function publicarDato(client) {
  try {
    const cfg = await configPrincipal()
    const hoy = R.hoyChile()
    if (!cfg?.dato_channel_id || cfg.dato_publicado_el === hoy) return
    const destino = await canal(client, cfg.dato_channel_id)
    if (!destino || !(await guardar(cfg, { dato_publicado_el: hoy }))) return
    const dato = R.datoDelDia(hoy, DATOS)
    const embed = embedKaibu(COLOR.ambar).setTitle(`☀️ ${dato.titulo}`).setDescription(dato.texto)
    const mensaje = await destino.send({ embeds: [embed] })
    await mensaje.startThread({ name: '💬 Comenta el dato', autoArchiveDuration: 1440 }).catch(() => null)
  } catch (e) {
    console.error('Error publicando el dato del día:', e)
  }
}

/** 🎯 Abre el desafío de la semana (lunes, o al encender el bot si esta semana aún no tiene). */
async function abrirDesafio(client) {
  try {
    const cfg = await configPrincipal()
    const lunes = R.lunesDe(R.hoyChile())
    if (!cfg?.desafio_channel_id || cfg.desafio_semana === lunes) return
    const destino = await canal(client, cfg.desafio_channel_id)
    if (!destino || !(await guardar(cfg, { desafio_semana: lunes, desafio_message_id: null }))) return
    const d = R.desafioDeLaSemana(lunes, DESAFIOS)
    const embed = embedKaibu(COLOR.marca)
      .setTitle(`🎯 Desafío de la semana: ${d.titulo}`)
      .setDescription(`${d.detalle}\n\nEl domingo en la noche vemos cuántos se sumaron. ¡Vamos con todo! 💪`)
    const mensaje = await destino.send({ embeds: [embed] })
    await mensaje.react('✅').catch(() => null)
    await mensaje.startThread({ name: '💬 ¿Cómo vas con el desafío?', autoArchiveDuration: 10080 }).catch(() => null)
    await guardar(cfg, { desafio_message_id: mensaje.id })
  } catch (e) {
    console.error('Error abriendo el desafío semanal:', e)
  }
}

/** 🏆 Domingo en la noche: cierra el desafío con cuántas personas se sumaron. */
async function cerrarDesafio(client) {
  try {
    const cfg = await configPrincipal()
    if (!cfg?.desafio_message_id || !cfg.desafio_semana || cfg.desafio_cerrado_el === cfg.desafio_semana) return
    const destino = await canal(client, cfg.desafio_channel_id)
    if (!destino || !(await guardar(cfg, { desafio_cerrado_el: cfg.desafio_semana }))) return
    const mensaje = await destino.messages.fetch(cfg.desafio_message_id).catch(() => null)
    if (!mensaje) return
    const reaccion = mensaje.reactions.cache.get('✅')
    const personas = Math.max(0, (reaccion?.count ?? 1) - 1) // menos la reacción del bot
    const texto =
      personas === 0
        ? 'Esta semana nadie se sumó al desafío. ¡El lunes viene otro! 💪'
        : `🏆 **${personas} ${personas === 1 ? 'persona se sumó' : 'personas se sumaron'}** al desafío de esta semana. ¡Bien hecho! Cuenten en el hilo cómo les fue.`
    await mensaje.reply({ content: texto, allowedMentions: { parse: [] } })
  } catch (e) {
    console.error('Error cerrando el desafío semanal:', e)
  }
}

// Última versión de novedades.json mostrada en el panel (en memoria: editar no avisa a nadie).
let ultimaHuella = null

/** 📍 Edita el panel "Kaibu hoy" cuando cambia novedades.json (nunca manda mensajes nuevos). */
async function actualizarEstado(client) {
  try {
    const novedad = await leerNovedades()
    if (!R.panelEstado(novedad)) return
    const huella = JSON.stringify(novedad)
    if (huella === ultimaHuella) return
    const cfg = await configPrincipal()
    await refrescarRoadmap(client, cfg, novedad)
    ultimaHuella = huella
  } catch (e) {
    console.error('Error actualizando el panel "Kaibu hoy":', e)
  }
}

module.exports = { publicarDato, abrirDesafio, cerrarDesafio, actualizarEstado }
