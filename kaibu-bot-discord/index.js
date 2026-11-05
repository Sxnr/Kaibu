// Bot de la comunidad de Kaibu en Discord.
// Arranca el bot, registra los comandos, recibe cada botón/formulario y programa las tareas automáticas.
const config = require('./lib/config')

config.revisarVariables()

const { Client, GatewayIntentBits, Events, REST, Routes, MessageFlags } = require('discord.js')
const express = require('express')
const cron = require('node-cron')
const { COMANDOS } = require('./lib/comandos')
const servidor = require('./lib/servidor')
const feedback = require('./lib/feedback')
const comunidad = require('./lib/comunidad')
const calculadoras = require('./lib/calculadoras')

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] })

// ---------------------------------------------------------------------
// Servidor HTTP: Render lo usa para saber que el bot está vivo (y cron-job.org para que no se duerma).
// ---------------------------------------------------------------------
const app = express()
app.get('/health', (_req, res) => {
  res.status(client.isReady() ? 200 : 503).json({ ok: client.isReady(), version: config.VERSION_APP })
})
const http = app.listen(process.env.PORT || 8000, () => console.log(`🌐 Healthcheck en el puerto ${process.env.PORT || 8000}`))

// ---------------------------------------------------------------------
// Qué hace cada comando, botón, formulario y menú
// ---------------------------------------------------------------------
const COMANDO = {
  setup: servidor.setup,
  invitacion: servidor.invitacion,
  'calcular-plan': calculadoras.planCmd,
  'progresion-gym': calculadoras.gymCmd,
  'verificar-etiqueta': calculadoras.etiquetaCmd,
  vincular: comunidad.vincular,
  desvincular: comunidad.desvincular,
  'metricas-beta': comunidad.metricas,
}

// Nombres viejos de los botones del primer /setup: siguen funcionando hasta que se repita /setup.
const ALIAS = {
  toggle_updates_role: 'rol_novedades',
  claim_tester_role: 'rol_tester',
  btn_open_bug: 'abrir_bug',
  btn_open_sug: 'abrir_sugerencia',
  btn_open_survey: 'abrir_encuesta',
}

const BOTON = {
  rol_novedades: servidor.alternarRol,
  rol_tester: servidor.alternarRol,
  abrir_bug: (i) => i.showModal(feedback.modalBug()),
  abrir_sugerencia: (i) => i.showModal(feedback.modalSugerencia()),
  abrir_encuesta: (i) => i.showModal(feedback.modalEncuesta()),
}
const BOTON_PREFIJO = [
  ['bug_gh_', feedback.crearIssue],
  ['bug_ok_', feedback.resolverBug],
  ['sug_up_', feedback.votar],
  ['sug_down_', feedback.votar],
]

const FORMULARIO = {
  modal_bug: feedback.enviarBug,
  modal_sugerencia: feedback.enviarSugerencia,
  modal_encuesta: feedback.enviarEncuesta,
}

function manejador(interaction) {
  if (interaction.isChatInputCommand()) return COMANDO[interaction.commandName]
  if (interaction.isButton()) {
    const id = ALIAS[interaction.customId] ?? interaction.customId
    if (ALIAS[interaction.customId]) Object.defineProperty(interaction, 'customId', { value: id })
    return BOTON[id] ?? BOTON_PREFIJO.find(([p]) => id.startsWith(p))?.[1]
  }
  if (interaction.isModalSubmit()) return FORMULARIO[interaction.customId]
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('sug_status_')) return feedback.cambiarEstadoSugerencia
  return null
}

client.on(Events.InteractionCreate, async (interaction) => {
  const fn = manejador(interaction)
  if (!fn) return
  try {
    await fn(interaction)
  } catch (error) {
    console.error(`Error en ${interaction.commandName ?? interaction.customId}:`, error)
    const aviso = { content: '😕 Algo falló. Intenta de nuevo en un rato; si sigue pasando, avísale al equipo.', flags: MessageFlags.Ephemeral }
    if (interaction.deferred) await interaction.editReply(aviso).catch(() => {})
    else if (!interaction.replied) await interaction.reply(aviso).catch(() => {})
  }
})

// ---------------------------------------------------------------------
// Al conectarse: registrar comandos y programar las tareas automáticas
// ---------------------------------------------------------------------
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`)
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN)
  try {
    const ruta = process.env.DISCORD_GUILD_ID
      ? Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID)
      : Routes.applicationCommands(process.env.DISCORD_CLIENT_ID)
    await rest.put(ruta, { body: COMANDOS })
    console.log(process.env.DISCORD_GUILD_ID ? '⚡ Comandos listos en tu servidor.' : '🌍 Comandos registrados (pueden tardar hasta 1 hora en aparecer).')
  } catch (err) {
    console.error('Error registrando comandos:', err)
  }

  const zona = { timezone: 'America/Santiago' }
  cron.schedule('* * * * *', () => feedback.publicarDesdeApp(client), zona) // reportes y sugerencias desde la app
  cron.schedule('*/15 * * * *', () => comunidad.sincronizarRoles(client), zona) // roles por cuenta vinculada y racha
  cron.schedule('0 20 * * 0', () => comunidad.recordatorioDominical(client), zona) // domingo 20:00
  feedback.publicarDesdeApp(client)
  comunidad.sincronizarRoles(client)
})

// Un error inesperado no debe botar el bot: se registra y sigue funcionando.
process.on('unhandledRejection', (e) => console.error('Promesa sin manejar:', e))

function apagar() {
  console.log('Apagando el bot…')
  http.close()
  client.destroy().finally(() => process.exit(0))
}
process.on('SIGTERM', apagar)
process.on('SIGINT', apagar)

client.login(process.env.DISCORD_TOKEN)
