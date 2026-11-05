// Postular a beta tester: formulario, revisión manual del equipo (Aprobar/Rechazar) y cupo.
const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags, PermissionFlagsBits,
} = require('discord.js')
const { supabase, configServidor, COLOR, APP_URL } = require('./config')
const { generarCodigoBeta, linkBeta } = require('./reglas')
const { embedKaibu } = require('./marca')
const { truncar } = require('./texto')
const { esDelEquipo, estadoCupo } = require('./permisos')
const { contarAprobadas } = require('./conectada')
const { refrescarBienvenida } = require('./servidor')

const efimero = { flags: MessageFlags.Ephemeral }
const rolesDe = (miembro) => new Set(miembro?.roles?.cache?.keys?.() ?? [])
const esEquipo = (i, cfg) => esDelEquipo(rolesDe(i.member), cfg, i.memberPermissions?.has(PermissionFlagsBits.ManageGuild))

const aprobadas = contarAprobadas

/** Crea un código de beta de un solo uso (reintenta si justo choca con uno existente). */
async function crearCodigoBeta({ discordUserId = null, nota = null, creadoPor = null }) {
  for (let intento = 0; intento < 4; intento++) {
    const codigo = generarCodigoBeta()
    const { error } = await supabase().from('beta_codes').insert({ codigo, discord_user_id: discordUserId, nota, creado_por: creadoPor })
    if (!error) return codigo
    if (error.code !== '23505') throw error
  }
  throw new Error('No pude crear un código de beta único')
}
const refrescar = (guild) => refrescarBienvenida(guild).catch((e) => console.error('No pude actualizar el contador de cupos:', e.message))

function modalPostulacion() {
  const corta = (id, etiqueta, ejemplo, max) =>
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(id).setLabel(etiqueta).setPlaceholder(ejemplo).setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(max),
    )
  return new ModalBuilder().setCustomId('modal_beta').setTitle('🧪 Postular a beta tester').addComponents(
    corta('dias', '¿Cuántos días a la semana usarás Kaibu?', '1–2, 3–4 o 5 o más', 60),
    corta('dispositivo', '¿En qué dispositivo la usarás?', 'Android (APK), iPhone o PC', 60),
    corta('objetivo', 'Tu objetivo y dónde entrenas', 'Ej.: bajar grasa · gimnasio del barrio', 200),
    corta('registro', '¿Cómo registras hoy lo que comes?', 'Otra app (¿cuál?), papel o nada', 200),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('motivo').setLabel('¿Por qué quieres ser beta tester?')
        .setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(10).setMaxLength(600),
    ),
  )
}

/** Botón "Postular a beta tester" (panel de bienvenida). */
async function abrirPostulacion(interaction) {
  const cfg = await configServidor(interaction.guildId)
  if (!cfg) return interaction.reply({ content: 'El servidor aún no está configurado. Avísale al equipo.', ...efimero })
  if (cfg.tester_role_id && interaction.member.roles.cache.has(cfg.tester_role_id)) {
    return interaction.reply({ content: '🧪 ¡Ya eres beta tester! Puedes vincular tu cuenta con `/vincular`.', ...efimero })
  }
  const { data: previa } = await supabase()
    .from('discord_beta_applications').select('estado').eq('guild_id', interaction.guildId).eq('discord_user_id', interaction.user.id).maybeSingle()
  if (previa?.estado === 'pendiente') return interaction.reply({ content: '⏳ Ya postulaste. El equipo la está revisando y te avisaremos por mensaje directo.', ...efimero })
  return interaction.showModal(modalPostulacion())
}

function embedPostulacion(p, cupo) {
  const estado = { pendiente: '⏳ Pendiente', aprobada: '✅ Aprobada', rechazada: '❌ Rechazada' }[p.estado]
  const color = { pendiente: COLOR.info, aprobada: COLOR.exito, rechazada: COLOR.gris }[p.estado]
  const e = embedKaibu(color)
    .setTitle(`🧪 Postulación de ${truncar(p.discord_tag, 80)}`)
    .addFields(
      { name: 'Persona', value: `<@${p.discord_user_id}>`, inline: true },
      { name: 'Estado', value: estado, inline: true },
      { name: 'Cupo', value: `${cupo.quedan} de ${cupo.total} disponibles`, inline: true },
      { name: 'Días por semana', value: truncar(p.dias_por_semana, 1024), inline: true },
      { name: 'Dispositivo', value: truncar(p.dispositivo, 1024), inline: true },
      { name: 'Objetivo y gym', value: truncar(p.objetivo_gym, 1024) },
      { name: 'Cómo registra hoy', value: truncar(p.registro_actual, 1024) },
      { name: '¿Por qué quiere ser beta?', value: truncar(p.motivo, 1024) },
    )
    .setTimestamp(new Date(p.created_at || Date.now()))
  if (p.revisado_por) e.addFields({ name: 'Revisó', value: `<@${p.revisado_por}>`, inline: true })
  return e
}

const botonesPostulacion = (p) =>
  p.estado !== 'pendiente'
    ? []
    : [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`beta_ok_${p.id}`).setLabel('✅ Aprobar').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`beta_no_${p.id}`).setLabel('❌ Rechazar').setStyle(ButtonStyle.Secondary),
        ),
      ]

async function enviarPostulacion(interaction) {
  await interaction.deferReply(efimero)
  const cfg = await configServidor(interaction.guildId)
  if (!cfg) return interaction.editReply('El servidor aún no está configurado. Avísale al equipo.')
  const v = (id) => interaction.fields.getTextInputValue(id).trim()
  const { data: p, error } = await supabase()
    .from('discord_beta_applications')
    .upsert(
      {
        guild_id: interaction.guildId,
        discord_user_id: interaction.user.id,
        discord_tag: truncar(interaction.user.username, 100, 'usuario'),
        dias_por_semana: v('dias'),
        dispositivo: v('dispositivo'),
        objetivo_gym: v('objetivo'),
        registro_actual: v('registro'),
        motivo: v('motivo'),
        estado: 'pendiente',
        revisado_por: null,
        revisado_at: null,
      },
      { onConflict: 'guild_id,discord_user_id' },
    )
    .select()
    .single()
  if (error) throw error
  const total = cfg.cupo_beta ?? 20
  const cupo = { ...estadoCupo(await aprobadas(interaction.guildId), total), total }
  const canal = cfg.postulaciones_channel_id && (await interaction.client.channels.fetch(cfg.postulaciones_channel_id).catch(() => null))
  if (canal) await canal.send({ embeds: [embedPostulacion(p, cupo)], components: botonesPostulacion(p) })
  return interaction.editReply(
    cupo.lleno
      ? '✅ Recibimos tu postulación. Por ahora los cupos están llenos: quedas en lista de espera y te avisamos por mensaje directo si se abre uno.'
      : '✅ ¡Recibimos tu postulación! El equipo la revisa y te avisa por mensaje directo.',
  )
}

async function avisarPorDM(client, userId, texto) {
  const usuario = await client.users.fetch(userId).catch(() => null)
  await usuario?.send(texto).catch(() => null) // si tiene los mensajes directos cerrados, no pasa nada
}

/** Botones Aprobar / Rechazar (canal privado del equipo). */
async function revisarPostulacion(interaction) {
  const cfg = await configServidor(interaction.guildId)
  if (!esEquipo(interaction, cfg)) return interaction.reply({ content: 'Solo el 🛡️ Equipo Kaibu puede revisar postulaciones.', ...efimero })
  const aprobar = interaction.customId.startsWith('beta_ok_')
  const id = interaction.customId.replace(/^beta_(ok|no)_/, '')
  const { data: p } = await supabase().from('discord_beta_applications').select('*').eq('id', id).maybeSingle()
  if (!p) return interaction.reply({ content: 'No encontré esa postulación.', ...efimero })
  if (p.estado !== 'pendiente') return interaction.reply({ content: `Esa postulación ya está ${p.estado}.`, ...efimero })

  const total = cfg.cupo_beta ?? 20
  const yaAprobadas = await aprobadas(interaction.guildId)
  if (aprobar && estadoCupo(yaAprobadas, total).lleno) {
    return interaction.reply({ content: `El cupo está lleno (${yaAprobadas} de ${total}). Súbelo con \`/cupo-beta\` o rechaza otra postulación.`, ...efimero })
  }
  if (aprobar) {
    const miembro = await interaction.guild.members.fetch(p.discord_user_id).catch(() => null)
    if (!miembro) return interaction.reply({ content: 'Esa persona ya no está en el servidor.', ...efimero })
    await miembro.roles.add(cfg.tester_role_id, 'Kaibu: postulación beta aprobada')
  }

  const { data: actualizada, error } = await supabase()
    .from('discord_beta_applications')
    .update({ estado: aprobar ? 'aprobada' : 'rechazada', revisado_por: interaction.user.id, revisado_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  const cupo = { ...estadoCupo(yaAprobadas + (aprobar ? 1 : 0), total), total }
  await interaction.update({ embeds: [embedPostulacion(actualizada, cupo)], components: [] })
  if (aprobar) await refrescar(interaction.guild)

  // Al aprobar: código personal de un solo uso para crear la cuenta (la app está en beta cerrada).
  const codigo = aprobar ? await crearCodigoBeta({ discordUserId: p.discord_user_id, creadoPor: interaction.user.id }).catch((e) => {
    console.error('No pude crear el código de beta:', e.message)
    return null
  }) : null
  await avisarPorDM(
    interaction.client,
    p.discord_user_id,
    aprobar
      ? '🧪 **¡Quedaste en la beta de Kaibu!** Ya tienes el rol Beta Tester: ahora ves el chat de testers y el centro de feedback.\n\n' +
          (codigo
            ? `**Tu acceso personal** (sirve una sola vez): ${linkBeta(APP_URL, codigo)}\nÁbrelo, crea tu cuenta y listo. Tu código: \`${codigo}\`\n\n`
            : 'En un rato el equipo te manda tu código de acceso.\n\n') +
          'Después, para vincular tu cuenta: en la app ve a **Más → Comunidad → Generar código** y escribe `/vincular` en el servidor.'
      : 'Gracias por postular a la beta de Kaibu 🙏. Por ahora no quedó tu postulación, pero puedes volver a postular más adelante desde #información. ¡Sigue en la comunidad!',
  )
  if (aprobar && !codigo) {
    await interaction.followUp({ content: `⚠️ No pude crear el código de <@${p.discord_user_id}>. Usa \`/codigo-beta\` y mándaselo tú (¿corriste la migración 20261109?).`, ...efimero }).catch(() => null)
  }
}

/** /codigo-beta [nota]: código para alguien que no usa Discord (se entrega por WhatsApp). Solo el equipo. */
async function codigoManual(interaction) {
  const cfg = await configServidor(interaction.guildId)
  if (!esEquipo(interaction, cfg)) return interaction.reply({ content: 'Solo el 🛡️ Equipo Kaibu puede crear códigos de beta.', ...efimero })
  const nota = truncar(interaction.options.getString('nota'), 120) || null
  const codigo = await crearCodigoBeta({ nota, creadoPor: interaction.user.id })
  return interaction.reply({
    content:
      `🧪 Código de beta: \`${codigo}\`${nota ? ` (${nota})` : ''}\nSirve una sola vez. Mándale este link por WhatsApp:\n${linkBeta(APP_URL, codigo)}\n` +
      '_Recuerda: el cupo de la beta cuenta solo las postulaciones aprobadas en Discord._',
    ...efimero,
  })
}

/** /cupo-beta numero: cambia el máximo de beta testers. */
async function cambiarCupo(interaction) {
  const cfg = await configServidor(interaction.guildId)
  if (!cfg) return interaction.reply({ content: 'Primero ejecuta /setup.', ...efimero })
  const cupo = interaction.options.getInteger('cupo')
  const { error } = await supabase().from('discord_guild_config').update({ cupo_beta: cupo }).eq('guild_id', interaction.guildId)
  if (error) throw error
  const ya = await aprobadas(interaction.guildId)
  await refrescar(interaction.guild)
  return interaction.reply({ content: `✅ Cupo de beta testers: **${cupo}** (aprobados: ${ya}, quedan ${Math.max(0, cupo - ya)}).`, ...efimero })
}

module.exports = { abrirPostulacion, enviarPostulacion, revisarPostulacion, cambiarCupo, codigoManual, crearCodigoBeta, modalPostulacion, esEquipo }
