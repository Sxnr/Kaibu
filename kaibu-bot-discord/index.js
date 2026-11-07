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
const beta = require('./lib/beta')
const conectada = require('./lib/conectada')
const diario = require('./lib/diario')
const bienvenidas = require('./lib/bienvenidas')
const alimentos = require('./lib/alimentos')
const presentaciones = require('./lib/presentaciones')
const anuncios = require('./lib/anuncios')
const invitaciones = require('./lib/invitaciones')
const encuestas = require('./lib/encuestas')
const ayuda = require('./lib/ayuda')
const regiones = require('./lib/regiones')

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
  'cupo-beta': beta.cambiarCupo,
  video: bienvenidas.compartirVideo,
  'codigo-beta': beta.codigoManual,
  ayuda: ayuda.ayuda,
  alimento: alimentos.alimento,
  presentarme: presentaciones.abrirPresentacion,
  'mi-invitacion': invitaciones.miInvitacion,
  invitaciones: invitaciones.invitaciones,
  anuncio: anuncios.anuncio,
}

// Nombres viejos de los botones del primer /setup: siguen funcionando hasta que se repita /setup.
const ALIAS = {
  toggle_updates_role: 'rol_novedades',
  claim_tester_role: 'postular_beta',
  rol_tester: 'postular_beta',
  btn_open_bug: 'abrir_bug',
  btn_open_sug: 'abrir_sugerencia',
  btn_open_survey: 'abrir_encuesta',
}

const BOTON = {
  aceptar_reglas: servidor.aceptarReglas,
  rol_novedades: servidor.alternarRol,
  rol_tiktok: servidor.alternarRol,
  rol_lanzamiento: servidor.alternarRol,
  postular_beta: beta.abrirPostulacion,
  abrir_bug: (i) => i.showModal(feedback.modalBug()),
  abrir_sugerencia: (i) => i.showModal(feedback.modalSugerencia()),
  abrir_encuesta: (i) => i.showModal(feedback.modalEncuesta()),
  presentarme: presentaciones.abrirPresentacion,
}
const BOTON_PREFIJO = [
  ['bug_gh_', feedback.crearIssue],
  ['bug_ok_', feedback.resolverBug],
  ['sug_up_', feedback.votar],
  ['sug_down_', feedback.votar],
  ['beta_ok_', beta.revisarPostulacion],
  ['beta_no_', beta.revisarPostulacion],
]

const FORMULARIO = {
  modal_bug: feedback.enviarBug,
  modal_sugerencia: feedback.enviarSugerencia,
  modal_encuesta: feedback.enviarEncuesta,
  modal_beta: beta.enviarPostulacion,
  modal_presentacion: presentaciones.enviarPresentacion,
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
  if (interaction.isStringSelectMenu() && interaction.customId === regiones.ID_MENU) return regiones.elegirRegion
  return null
}

// Alguien entra al servidor: banner de bienvenida con su foto en #bienvenidas.
client.on(Events.GuildMemberAdd, (miembro) => {
  bienvenidas.darBienvenida(miembro)
  invitaciones.alEntrar(miembro) // con qué link entró (para el ranking y las redes)
})

client.on(Events.InteractionCreate, async (interaction) => {
  // Sugerencias de /alimento mientras se escribe (si fallan, simplemente no aparecen).
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === 'alimento') await alimentos.autocompletar(interaction).catch(() => null)
    return
  }
  const fn = manejador(interaction)
  if (!fn) return
  try {
    await fn(interaction)
  } catch (error) {
    console.error(`Error en ${interaction.commandName ?? interaction.customId}:`, error)
    // PGRST204/205: a Supabase le falta una columna o tabla → falta ejecutar la última migración.
    const faltaMigracion = error?.code === 'PGRST204' || error?.code === 'PGRST205'
    if (faltaMigracion) console.error('⚠️ Falta ejecutar en Supabase la última migración de supabase/migrations (y luego: notify pgrst, \'reload schema\';).')
    const aviso = {
      content: faltaMigracion
        ? '🛠️ A la base de datos le falta una actualización: ejecuta en Supabase la última migración de `supabase/migrations` y luego `notify pgrst, \'reload schema\';`. Después vuelve a intentarlo.'
        : '😕 Algo falló. Intenta de nuevo en un rato; si sigue pasando, avísale al equipo.',
      flags: MessageFlags.Ephemeral,
    }
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
  cron.schedule('* * * * *', () => conectada.publicarSemanas(client), zona) // "Mi semana" desde la app
  cron.schedule('0 10 * * *', () => conectada.seguimientoBeta(client), zona) // seguimiento de beta testers
  cron.schedule('0 21 * * *', () => conectada.recordatorios(client), zona) // recordatorio a quien no anotó hoy
  cron.schedule('17 * * * *', () => conectada.anunciarNovedades(client), zona) // versión grande nueva → #novedades
  cron.schedule('19 * * * *', () => diario.actualizarEstado(client), zona) // panel "Kaibu hoy" (solo edita)
  cron.schedule('30 8 * * *', () => diario.publicarDato(client), zona) // ☀️ dato del día
  cron.schedule('0 9 * * 1', () => diario.abrirDesafio(client), zona) // 🎯 desafío: lunes 9:00
  cron.schedule('30 20 * * 0', () => diario.cerrarDesafio(client), zona) // 🏆 cierre: domingo 20:30
  cron.schedule('0 13 * * 3', () => encuestas.publicarEncuesta(client), zona) // 🇨🇱 encuesta: miércoles 13:00
  cron.schedule('0 12 1 * *', () => invitaciones.rankingMensual(client), zona) // 🤝 embajadores: día 1, 12:00
  // Primero deja el servidor al día (paneles, plantillas, regiones, comunidad); después lo demás.
  await servidor.autoSetup(client)
  await invitaciones.prepararInvitaciones(client)
  alimentos.cargarCatalogo()
  conectada.anunciarNovedades(client)
  diario.actualizarEstado(client)
  diario.abrirDesafio(client) // si el bot se enciende a mitad de semana y aún no hay desafío
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
