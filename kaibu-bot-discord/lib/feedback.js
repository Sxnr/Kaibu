// Bugs, sugerencias (con votos) y encuesta de la beta. También publica lo que llega desde la app.
const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle,
  EmbedBuilder, StringSelectMenuBuilder, PermissionFlagsBits, MessageFlags,
} = require('discord.js')
const { supabase, configServidor, VERSION_APP, COLOR } = require('./config')
const { truncar, paraGitHub, leerSiNo, leerPrecio } = require('./texto')
const { esDelEquipo } = require('./permisos')

const efimero = { flags: MessageFlags.Ephemeral }
// Equipo: rol 🛡️ Equipo Kaibu o permiso de administrar el servidor.
const esStaff = (i) =>
  i.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
  configServidor(i.guildId).then((cfg) => esDelEquipo(new Set(i.member?.roles?.cache?.keys?.() ?? []), cfg, false))

const ESTADO_BUG = {
  pendiente: { texto: '⏳ Pendiente de revisión', color: COLOR.marca, app: 'publicado' },
  en_sprint: { texto: '🛠️ En el sprint (issue creado)', color: COLOR.ambar, app: 'en_sprint' },
  resuelto: { texto: '✅ Resuelto', color: COLOR.exito, app: 'resuelto' },
}
const ESTADO_SUG = {
  pendiente: { texto: '⏳ En votación', color: COLOR.info, app: 'publicado' },
  en_srs: { texto: '📋 Planificada en la hoja de ruta', color: COLOR.ambar, app: 'planificada' },
  aprobada: { texto: '✅ Aprobada para construir', color: COLOR.exito, app: 'aprobada' },
  fuera_alcance: { texto: '⛔ Fuera de alcance por ahora', color: COLOR.gris, app: 'fuera_alcance' },
}

/** Refleja en la app el estado de un reporte que vino desde ella. */
async function actualizarEnApp(appFeedbackId, estado) {
  if (!appFeedbackId) return
  await supabase().from('app_feedback').update({ estado }).eq('id', appFeedbackId)
}

const autorTexto = (fila) => (/^\d{15,22}$/.test(fila.user_id) ? `<@${fila.user_id}>` : truncar(fila.user_tag, 100, 'Usuario de la app'))

// ---------------------------------------------------------------------
// Bugs
// ---------------------------------------------------------------------
function embedBug(bug) {
  const estado = ESTADO_BUG[bug.status] ?? ESTADO_BUG.pendiente
  const campos = [
    { name: 'Autor', value: autorTexto(bug), inline: true },
    { name: 'Origen', value: bug.origen === 'app' ? '📱 App Kaibu' : '💬 Discord', inline: true },
    { name: 'Estado', value: estado.texto, inline: true },
    { name: 'Plataforma', value: truncar(bug.platform, 1024, 'Sin dato'), inline: true },
    { name: 'Sin conexión', value: truncar(bug.offline_mode, 1024, 'Sin dato'), inline: true },
    { name: 'Qué pasó y cómo reproducirlo', value: truncar(bug.description, 1024, 'Sin descripción') },
  ]
  if (bug.github_issue_url) campos.push({ name: 'Issue en GitHub', value: bug.github_issue_url })
  return new EmbedBuilder().setTitle(`🐛 Bug #${bug.id.slice(0, 8)}`).addFields(campos).setColor(estado.color).setTimestamp(new Date(bug.created_at || Date.now()))
}

function botonesBug(bug) {
  if (bug.status === 'resuelto') return []
  const fila = new ActionRowBuilder()
  if (!bug.github_issue_url) fila.addComponents(new ButtonBuilder().setCustomId(`bug_gh_${bug.id}`).setLabel('🐙 Crear issue en GitHub').setStyle(ButtonStyle.Secondary))
  fila.addComponents(new ButtonBuilder().setCustomId(`bug_ok_${bug.id}`).setLabel('✅ Marcar resuelto').setStyle(ButtonStyle.Success))
  return [fila]
}

async function publicarBug(client, cfg, bug) {
  const canal = cfg?.bug_triage_channel_id && (await client.channels.fetch(cfg.bug_triage_channel_id).catch(() => null))
  if (!canal) return false
  await canal.send({ embeds: [embedBug(bug)], components: botonesBug(bug) })
  return true
}

function modalBug() {
  return new ModalBuilder().setCustomId('modal_bug').setTitle(`🐛 Reportar bug (Kaibu ${VERSION_APP})`).addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('plataforma').setLabel('¿Dónde? (web en PC, app en iPhone, APK…)')
        .setPlaceholder('Ej.: APK en Android 14').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('sin_conexion').setLabel('¿Pasó sin internet?')
        .setPlaceholder('Sí / No / Al volver la señal').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(40),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('descripcion').setLabel('¿Qué pasó y cómo repetirlo?')
        .setPlaceholder('Pantalla (Hoy, Agregar, Progreso…), qué tocaste y qué esperabas que pasara')
        .setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(10).setMaxLength(1500),
    ),
  )
}

async function enviarBug(interaction) {
  await interaction.deferReply(efimero)
  const cfg = await configServidor(interaction.guildId)
  if (!cfg) return interaction.editReply('El servidor aún no está configurado. Avísale a un administrador.')
  const { data: bug, error } = await supabase()
    .from('discord_bug_reports')
    .insert({
      user_id: interaction.user.id,
      user_tag: truncar(interaction.user.username, 100, 'usuario'),
      platform: interaction.fields.getTextInputValue('plataforma').trim(),
      offline_mode: interaction.fields.getTextInputValue('sin_conexion').trim(),
      description: interaction.fields.getTextInputValue('descripcion').trim(),
      origen: 'discord',
    })
    .select()
    .single()
  if (error) throw error
  await publicarBug(interaction.client, cfg, bug)
  return interaction.editReply('✅ ¡Gracias! Tu reporte llegó al equipo de Kaibu.')
}

async function crearIssue(interaction) {
  if (!(await esStaff(interaction))) return interaction.reply({ content: 'Solo el equipo de Kaibu puede crear issues.', ...efimero })
  await interaction.deferReply(efimero)
  const id = interaction.customId.replace('bug_gh_', '')
  const { data: bug } = await supabase().from('discord_bug_reports').select('*').eq('id', id).maybeSingle()
  if (!bug) return interaction.editReply('No encontré ese reporte.')
  if (bug.github_issue_url) return interaction.editReply(`Ya tiene issue: ${bug.github_issue_url}`)
  if (!process.env.GITHUB_TOKEN) return interaction.editReply('⚠️ Falta `GITHUB_TOKEN` en Render para crear issues.')

  const repo = process.env.GITHUB_REPO || 'Sxnr/Kaibu'
  const respuesta = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: truncar(`[Beta] ${paraGitHub(bug.platform)}: ${paraGitHub(bug.description)}`, 120),
      body:
        `**Origen:** ${bug.origen === 'app' ? 'app Kaibu' : 'Discord'} · **Plataforma:** ${paraGitHub(bug.platform)} · **Sin conexión:** ${paraGitHub(bug.offline_mode)}\n\n` +
        `### Qué pasó y cómo reproducirlo\n\n${paraGitHub(bug.description)}\n\n_Reporte ${bug.id} enviado desde el triaje de Discord._`,
      labels: ['bug', 'beta'],
    }),
  })
  if (!respuesta.ok) {
    console.error('GitHub respondió', respuesta.status, await respuesta.text().catch(() => ''))
    return interaction.editReply('❌ GitHub rechazó el issue. Revisa que el token tenga permiso "Issues: Read and write" en el repositorio.')
  }
  const issue = await respuesta.json()
  const { data: actualizado } = await supabase()
    .from('discord_bug_reports').update({ status: 'en_sprint', github_issue_url: issue.html_url }).eq('id', id).select().single()
  await actualizarEnApp(bug.app_feedback_id, ESTADO_BUG.en_sprint.app)
  await interaction.message.edit({ embeds: [embedBug(actualizado)], components: botonesBug(actualizado) })
  return interaction.editReply(`✅ Issue creado: ${issue.html_url}`)
}

async function resolverBug(interaction) {
  if (!(await esStaff(interaction))) return interaction.reply({ content: 'Solo el equipo de Kaibu puede cerrar reportes.', ...efimero })
  const id = interaction.customId.replace('bug_ok_', '')
  const { data: bug, error } = await supabase().from('discord_bug_reports').update({ status: 'resuelto' }).eq('id', id).select().single()
  if (error) throw error
  await actualizarEnApp(bug.app_feedback_id, ESTADO_BUG.resuelto.app)
  return interaction.update({ embeds: [embedBug(bug)], components: [] })
}

// ---------------------------------------------------------------------
// Sugerencias
// ---------------------------------------------------------------------
function embedSugerencia(sug, aFavor, enContra) {
  const estado = ESTADO_SUG[sug.status] ?? ESTADO_SUG.pendiente
  return new EmbedBuilder()
    .setTitle(`💡 ${truncar(sug.title, 240)}`)
    .setDescription(truncar(sug.description, 4000))
    .addFields(
      { name: 'Autor', value: sug.origen === 'app' && !/^\d{15,22}$/.test(sug.user_id) ? '📱 Usuario de la app' : autorTexto(sug), inline: true },
      { name: 'Estado', value: estado.texto, inline: true },
      { name: 'Votos', value: `🔼 ${aFavor}   🔽 ${enContra}`, inline: true },
    )
    .setColor(estado.color)
    .setTimestamp(new Date(sug.created_at || Date.now()))
}

function componentesSugerencia(id, aFavor, enContra) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`sug_up_${id}`).setLabel(`🔼 Apoyar (${aFavor})`).setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`sug_down_${id}`).setLabel(`🔽 En contra (${enContra})`).setStyle(ButtonStyle.Secondary),
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId(`sug_status_${id}`).setPlaceholder('🛠️ Equipo: cambiar estado').addOptions(
        { label: 'Planificada en la hoja de ruta', value: 'en_srs', emoji: '📋' },
        { label: 'Aprobada para construir', value: 'aprobada', emoji: '✅' },
        { label: 'Fuera de alcance por ahora', value: 'fuera_alcance', emoji: '⛔' },
        { label: 'Volver a votación', value: 'pendiente', emoji: '⏳' },
      ),
    ),
  ]
}

async function publicarSugerencia(client, cfg, sug) {
  const canal = cfg?.suggestions_channel_id && (await client.channels.fetch(cfg.suggestions_channel_id).catch(() => null))
  if (!canal) return false
  const aFavor = sug.upvotes?.length ?? 0
  const enContra = sug.downvotes?.length ?? 0
  const msg = await canal.send({ embeds: [embedSugerencia(sug, aFavor, enContra)], components: componentesSugerencia(sug.id, aFavor, enContra) })
  const hilo = await msg.startThread({ name: truncar(`Debate: ${sug.title}`, 90), autoArchiveDuration: 1440 }).catch(() => null)
  await supabase().from('discord_suggestions').update({ message_id: msg.id, thread_id: hilo?.id ?? null }).eq('id', sug.id)
  return true
}

function modalSugerencia() {
  return new ModalBuilder().setCustomId('modal_sugerencia').setTitle('💡 Enviar sugerencia para Kaibu').addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('titulo').setLabel('Título corto de la idea').setStyle(TextInputStyle.Short).setRequired(true).setMinLength(3).setMaxLength(100),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('descripcion').setLabel('¿Cómo te ayudaría?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(10).setMaxLength(1500),
    ),
  )
}

async function enviarSugerencia(interaction) {
  await interaction.deferReply(efimero)
  const cfg = await configServidor(interaction.guildId)
  if (!cfg) return interaction.editReply('El servidor aún no está configurado. Avísale a un administrador.')
  const { data: sug, error } = await supabase()
    .from('discord_suggestions')
    .insert({
      user_id: interaction.user.id,
      user_tag: truncar(interaction.user.username, 100, 'usuario'),
      title: interaction.fields.getTextInputValue('titulo').trim(),
      description: interaction.fields.getTextInputValue('descripcion').trim(),
      upvotes: [interaction.user.id],
      origen: 'discord',
    })
    .select()
    .single()
  if (error) throw error
  const ok = await publicarSugerencia(interaction.client, cfg, sug)
  return interaction.editReply(ok ? `✅ ¡Sugerencia publicada en <#${cfg.suggestions_channel_id}>!` : 'Quedó guardada, pero no encontré el canal de sugerencias. Avísale a un administrador.')
}

async function votar(interaction) {
  const aFavor = interaction.customId.startsWith('sug_up_')
  const id = interaction.customId.replace(aFavor ? 'sug_up_' : 'sug_down_', '')
  const { data, error } = await supabase().rpc('votar_sugerencia_discord', { p_sugerencia: id, p_usuario: interaction.user.id, p_a_favor: aFavor })
  if (error) throw error
  const votos = data?.[0]
  if (!votos) return interaction.reply({ content: 'Esa sugerencia ya no existe.', ...efimero })
  const { data: sug } = await supabase().from('discord_suggestions').select('*').eq('id', id).single()
  return interaction.update({ embeds: [embedSugerencia(sug, votos.a_favor, votos.en_contra)], components: componentesSugerencia(id, votos.a_favor, votos.en_contra) })
}

async function cambiarEstadoSugerencia(interaction) {
  if (!(await esStaff(interaction))) return interaction.reply({ content: 'Solo el equipo de Kaibu puede cambiar el estado.', ...efimero })
  const id = interaction.customId.replace('sug_status_', '')
  const status = interaction.values[0]
  if (!ESTADO_SUG[status]) return interaction.reply({ content: 'Estado desconocido.', ...efimero })
  const { data: sug, error } = await supabase().from('discord_suggestions').update({ status }).eq('id', id).select().single()
  if (error) throw error
  await actualizarEnApp(sug.app_feedback_id, ESTADO_SUG[status].app)
  const aFavor = sug.upvotes?.length ?? 0
  const enContra = sug.downvotes?.length ?? 0
  return interaction.update({ embeds: [embedSugerencia(sug, aFavor, enContra)], components: componentesSugerencia(id, aFavor, enContra) })
}

// ---------------------------------------------------------------------
// Encuesta rápida de la beta (la versión completa es el formulario de Google)
// ---------------------------------------------------------------------
function modalEncuesta() {
  return new ModalBuilder().setCustomId('modal_encuesta').setTitle('📊 Encuesta Kaibu+ (1 minuto)').addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('pagaria').setLabel('¿Pagarías Kaibu+ a $2.990 al mes?')
        .setPlaceholder('Sí o No (lo básico sigue gratis siempre)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('precio').setLabel('¿Qué precio al mes te parecería justo?')
        .setPlaceholder('Ej.: 2.490').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(12),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('extra').setLabel('¿Qué extra te serviría más?')
        .setPlaceholder('Foto con IA, metas por día de entreno, planificador, análisis…').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(300),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('comentarios').setLabel('¿Qué es lo que más te gusta de la beta?')
        .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(1000),
    ),
  )
}

async function enviarEncuesta(interaction) {
  const pagaria = leerSiNo(interaction.fields.getTextInputValue('pagaria'))
  if (pagaria === null) return interaction.reply({ content: 'En la primera pregunta responde **Sí** o **No** y vuelve a enviarla, por favor 🙏', ...efimero })
  await interaction.deferReply(efimero)
  const fila = {
    user_id: interaction.user.id,
    user_tag: truncar(interaction.user.username, 100, 'usuario'),
    would_pay: pagaria,
    precio_justo: leerPrecio(interaction.fields.getTextInputValue('precio')),
    favorite_feature: interaction.fields.getTextInputValue('extra').trim(),
    comments: interaction.fields.getTextInputValue('comentarios').trim() || null,
  }
  const { error } = await supabase().from('discord_beta_survey').upsert(fila, { onConflict: 'user_id' })
  if (error) throw error

  const [{ count: total }, { count: si }, cfg] = await Promise.all([
    supabase().from('discord_beta_survey').select('*', { count: 'exact', head: true }),
    supabase().from('discord_beta_survey').select('*', { count: 'exact', head: true }).eq('would_pay', true),
    configServidor(interaction.guildId),
  ])
  const pct = total ? Math.round((si / total) * 100) : 0
  const canal = cfg?.survey_logs_channel_id && (await interaction.client.channels.fetch(cfg.survey_logs_channel_id).catch(() => null))
  if (canal) {
    await canal.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('📊 Nueva respuesta de la encuesta')
          .addFields(
            { name: '¿Pagaría $2.990?', value: pagaria ? '✅ Sí' : '❌ No', inline: true },
            { name: 'Precio justo', value: fila.precio_justo ? `$${fila.precio_justo.toLocaleString('es-CL')}` : 'Sin dato', inline: true },
            { name: 'Meta: 40 % o más dice que sí', value: `**${pct} %** (${si} de ${total})`, inline: true },
            { name: 'Extra favorito', value: truncar(fila.favorite_feature, 1024) },
            { name: 'Comentarios', value: truncar(fila.comments, 1024, 'Sin comentarios') },
          )
          .setColor(pct >= 40 ? COLOR.exito : COLOR.ambar),
      ],
    })
  }
  return interaction.editReply('🙌 ¡Gracias! Tu respuesta quedó guardada. Puedes volver a responder cuando quieras: se guarda la última.')
}

// ---------------------------------------------------------------------
// Desde la app: reportes y sugerencias que llegan a app_feedback
// ---------------------------------------------------------------------
let publicando = false

/** Publica en Discord lo enviado desde la app que aún no se publica. Se llama cada minuto. */
async function publicarDesdeApp(client) {
  if (publicando) return
  publicando = true
  try {
    // Con DISCORD_GUILD_ID se usa ese servidor; si no, el primero configurado con /setup.
    let consulta = supabase().from('discord_guild_config').select('*').order('created_at').limit(1)
    if (process.env.DISCORD_GUILD_ID) consulta = consulta.eq('guild_id', process.env.DISCORD_GUILD_ID)
    const { data: configs } = await consulta
    const cfg = configs?.[0]
    if (!cfg) return
    const { data: pendientes, error } = await supabase()
      .from('app_feedback').select('*').is('publicado_at', null).is('deleted_at', null).order('created_at').limit(10)
    if (error) throw error
    for (const fb of pendientes ?? []) {
      const { data: link } = await supabase().from('discord_links').select('discord_user_id, discord_tag').eq('user_id', fb.user_id).maybeSingle()
      const autor = { user_id: link?.discord_user_id ?? 'app', user_tag: truncar(link?.discord_tag, 100, 'Usuario de la app') }
      let ok
      if (fb.tipo === 'bug') {
        const { data: existente } = await supabase().from('discord_bug_reports').select('*').eq('app_feedback_id', fb.id).maybeSingle()
        const bug = existente ?? (
          await supabase().from('discord_bug_reports').insert({
            ...autor,
            platform: truncar(fb.plataforma, 100, 'Sin dato'),
            offline_mode: fb.sin_conexion ? 'Sí' : 'No',
            description: truncar(`${fb.descripcion}\n\nVersión de la app: ${fb.version_app}`, 2000),
            origen: 'app',
            app_feedback_id: fb.id,
          }).select().single()
        ).data
        ok = bug && (existente ? true : await publicarBug(client, cfg, bug))
      } else {
        const { data: existente } = await supabase().from('discord_suggestions').select('*').eq('app_feedback_id', fb.id).maybeSingle()
        const sug = existente ?? (
          await supabase().from('discord_suggestions').insert({
            ...autor,
            title: truncar(fb.titulo, 100, 'Sugerencia'),
            description: truncar(fb.descripcion, 2000),
            upvotes: link ? [link.discord_user_id] : [],
            origen: 'app',
            app_feedback_id: fb.id,
          }).select().single()
        ).data
        ok = sug && (existente ? true : await publicarSugerencia(client, cfg, sug))
      }
      if (ok) await supabase().from('app_feedback').update({ estado: 'publicado', publicado_at: new Date().toISOString() }).eq('id', fb.id)
    }
  } catch (e) {
    console.error('Error publicando lo enviado desde la app:', e)
  } finally {
    publicando = false
  }
}

module.exports = {
  modalBug, enviarBug, crearIssue, resolverBug,
  modalSugerencia, enviarSugerencia, votar, cambiarEstadoSugerencia,
  modalEncuesta, enviarEncuesta,
  publicarDesdeApp,
}
