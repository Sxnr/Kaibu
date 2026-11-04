require('dotenv').config();
const {
  Client, GatewayIntentBits, PermissionFlagsBits, ChannelType,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder,
  TextInputBuilder, TextInputStyle, EmbedBuilder, StringSelectMenuBuilder,
  SlashCommandBuilder, REST, Routes
} = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const cron = require('node-cron');

// Conexión a Supabase con Service Role Key (Solo en servidor - RNF-12)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// Servidor HTTP ligero para mantener vivo el hosting gratuito (OP-08 / R-01)
const app = express();
app.use(express.json());
app.get('/health', (req, res) => res.status(200).send('Kaibu Bot OK - v0.2.0-beta'));
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Healthcheck activo en puerto ${PORT}`));

// Definición de Comandos Slash
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Construye y configura automáticamente toda la comunidad de Kaibu')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('calcular-plan')
    .setDescription('Calcula tu meta nutricional explicada según las reglas científicas de Kaibu (RN-01 a RN-14)')
    .addStringOption(o => o.setName('sexo').setDescription('Sexo biológico para fórmula Mifflin-St Jeor').setRequired(true)
      .addChoices({ name: 'Hombre (+5)', value: 'hombre' }, { name: 'Mujer (-161)', value: 'mujer' }))
    .addIntegerOption(o => o.setName('edad').setDescription('Edad en años (14 a 100)').setRequired(true).setMinValue(14).setMaxValue(100))
    .addNumberOption(o => o.setName('peso').setDescription('Peso actual en kg (30 a 300)').setRequired(true).setMinValue(30).setMaxValue(300))
    .addIntegerOption(o => o.setName('estatura').setDescription('Estatura en cm (120 a 230)').setRequired(true).setMinValue(120).setMaxValue(230))
    .addStringOption(o => o.setName('actividad').setDescription('Factor de actividad (RN-02)').setRequired(true)
      .addChoices(
        { name: 'Sedentario (1,2)', value: '1.2' },
        { name: 'Ligero (1,375)', value: '1.375' },
        { name: 'Moderado (1,55)', value: '1.55' },
        { name: 'Alto (1,725)', value: '1.725' },
        { name: 'Muy alto (1,9)', value: '1.9' }
      ))
    .addStringOption(o => o.setName('fase').setDescription('Objetivo y velocidad semanal (RN-04)').setRequired(true)
      .addChoices(
        { name: 'Déficit ligero (-0,25 kg/sem)', value: 'deficit_-0.25' },
        { name: 'Déficit medio (-0,5 kg/sem)', value: 'deficit_-0.5' },
        { name: 'Déficit rápido (-0,75 kg/sem)', value: 'deficit_-0.75' },
        { name: 'Mantenimiento (0 kg/sem)', value: 'mantener_0' },
        { name: 'Volumen limpio (+0,2 kg/sem)', value: 'volumen_0.2' },
        { name: 'Volumen estándar (+0,3 kg/sem)', value: 'volumen_0.3' }
      )),

  new SlashCommandBuilder()
    .setName('progresion-gym')
    .setDescription('Evalúa si debes subir peso en tu ejercicio según la regla RN-20 de Kaibu')
    .addStringOption(o => o.setName('ejercicio').setDescription('Nombre del ejercicio (ej. Hack Squat, Press Banca)').setRequired(true))
    .addStringOption(o => o.setName('tipo').setDescription('Tipo de movimiento (RN-20)').setRequired(true)
      .addChoices(
        { name: 'Compuesto (Rango meta: 6 a 10 reps)', value: 'compuesto' },
        { name: 'Aislado (Rango meta: 8 a 12 reps)', value: 'aislado' }
      ))
    .addNumberOption(o => o.setName('peso_actual').setDescription('Peso utilizado en kg').setRequired(true))
    .addIntegerOption(o => o.setName('reps_logradas').setDescription('Repeticiones logradas en la serie').setRequired(true)),

  new SlashCommandBuilder()
    .setName('verificar-etiqueta')
    .setDescription('Verifica la coherencia de una tabla nutricional (RN-15) y sellos ALTO EN (Ley 20.606)')
    .addNumberOption(o => o.setName('kcal').setDescription('Calorías declaradas por 100g').setRequired(true))
    .addNumberOption(o => o.setName('proteina').setDescription('Proteínas en g por 100g').setRequired(true))
    .addNumberOption(o => o.setName('carbos').setDescription('Carbohidratos en g por 100g').setRequired(true))
    .addNumberOption(o => o.setName('grasas').setDescription('Grasas totales en g por 100g').setRequired(true))
    .addNumberOption(o => o.setName('azucares').setDescription('Azúcares totales en g por 100g (Opcional)').setRequired(false))
    .addNumberOption(o => o.setName('saturadas').setDescription('Grasas saturadas en g por 100g (Opcional)').setRequired(false))
    .addNumberOption(o => o.setName('sodio').setDescription('Sodio en mg por 100g (Opcional)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('metricas-beta')
    .setDescription('Muestra el estado de validación de la beta (ON-09), bugs y sugerencias')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(c => c.toJSON());

// Registro automático de comandos y tarea programada de ajuste semanal
client.once('ready', async () => {
  console.log(`🤖 Bot conectado localmente como ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    if (process.env.DISCORD_GUILD_ID) {
      // Registro instantáneo para pruebas locales en tu servidor
      await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
        { body: commands }
      );
      console.log('⚡ Comandos sincronizados al instante en tu servidor de pruebas.');
    } else {
      await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
      console.log('🌍 Comandos sincronizados globalmente.');
    }
  } catch (err) {
    console.error('Error registrando comandos:', err);
  }
});

  // Cron Job: Todos los domingos a las 20:00 (Hora de Chile) recuerda el Ajuste Semanal (RN-11)
  cron.schedule('0 20 * * 0', async () => {
    const { data: configs } = await supabase.from('discord_guild_config').select('*');
    if (!configs) return;

    for (const cfg of configs) {
      const ch = await client.channels.fetch(cfg.general_channel_id).catch(() => null);
      if (ch) {
        const embed = new EmbedBuilder()
          .setTitle('⚖️ ¡Domingo de Revisión y Ajuste Semanal en Kaibu!')
          .setDescription(
            'Recuerda que los pesos diarios varían por agua y sodio. Hoy Kaibu calcula tu **promedio de 7 días** (RN-10) y ajusta tu meta gratis si tu ritmo real se desvió durante 2 semanas (RN-11).\n\n' +
            '1️⃣ Registra tu peso de hoy y toca **"Terminar día"** para mantener tu racha.\n' +
            '2️⃣ Revisa la sugerencia de ajuste en **Mi Plan**.\n' +
            `3️⃣ Descarga tu tarjeta de progreso (1080×1920) y compártela en <#${cfg.progress_channel_id}>.`
          )
          .setColor('#ef4444')
          .setFooter({ text: 'Te cobran por que tu plan se adapte a ti. Kaibu lo adapta gratis.' });
        await ch.send({ embeds: [embed] });
      }
    }
  }, { timezone: 'America/Santiago' });

// Manejador central de Interacciones
client.on('interactionCreate', async (interaction) => {
  try {
    // =========================================================================
    // 1. COMANDO /SETUP: Auto-configuración completa de la comunidad
    // =========================================================================
    if (interaction.isChatInputCommand() && interaction.commandName === 'setup') {
      await interaction.deferReply({ ephemeral: true });
      const guild = interaction.guild;

      const { data: existing } = await supabase
        .from('discord_guild_config')
        .select('*')
        .eq('guild_id', guild.id)
        .single();

      if (existing) {
        return interaction.editReply('⚠️ Este servidor ya fue configurado. Borra la fila en `discord_guild_config` de Supabase si deseas regenerarlo desde cero.');
      }

      // Crear Roles alineados con el SRS
      const testerRole = await guild.roles.create({ name: '🧪 Beta Tester', color: '#3b82f6', hoist: true });
      const updatesRole = await guild.roles.create({ name: '🔔 Ping Novedades', color: '#10b981' });
      await guild.roles.create({ name: '🔥 Racha 7+ Días', color: '#f97316' });
      await guild.roles.create({ name: '⚡ Racha 30+ Días', color: '#eab308' });
      await guild.roles.create({ name: '💪 Atleta Kaibu', color: '#ef4444' });

      // Categoría 1: Información Oficial
      const infoCat = await guild.channels.create({ name: '📌 INFORMACIÓN KAIBU', type: ChannelType.GuildCategory });
      const readOnlyPerms = [
        { id: guild.id, deny: [PermissionFlagsBits.SendMessages], allow: [PermissionFlagsBits.ViewChannel] }
      ];

      const welcomeCh = await guild.channels.create({ name: '👋・bienvenida-y-reglas', type: ChannelType.GuildText, parent: infoCat.id, permissionOverwrites: readOnlyPerms });
      const updatesCh = await guild.channels.create({ name: '🚀・novedades-app', type: ChannelType.GuildText, parent: infoCat.id, permissionOverwrites: readOnlyPerms });
      const roadmapCh = await guild.channels.create({ name: '🗺️・roadmap-sprints', type: ChannelType.GuildText, parent: infoCat.id, permissionOverwrites: readOnlyPerms });

      // Categoría 2: Beta Privada y Feedback
      const betaCat = await guild.channels.create({ name: '🧪 BETA & FEEDBACK', type: ChannelType.GuildCategory });
      const feedbackCh = await guild.channels.create({ name: '🛠️・centro-de-feedback', type: ChannelType.GuildText, parent: betaCat.id, permissionOverwrites: readOnlyPerms });
      const suggestionsCh = await guild.channels.create({ name: '💡・sugerencias-comunidad', type: ChannelType.GuildText, parent: betaCat.id, permissionOverwrites: readOnlyPerms });
      await guild.channels.create({ name: '💬・chat-beta-testers', type: ChannelType.GuildText, parent: betaCat.id });

      // Categoría 3: Comunidad y Gym
      const commCat = await guild.channels.create({ name: '💪 COMUNIDAD & PROGRESO', type: ChannelType.GuildCategory });
      const generalCh = await guild.channels.create({ name: '💬・general', type: ChannelType.GuildText, parent: commCat.id });
      const progressCh = await guild.channels.create({ name: '📈・tarjetas-de-progreso', type: ChannelType.GuildText, parent: commCat.id });
      await guild.channels.create({ name: '🏋️・gym-y-cargas', type: ChannelType.GuildText, parent: commCat.id });
      await guild.channels.create({ name: '🥑・mesa-chilena-y-recetas', type: ChannelType.GuildText, parent: commCat.id });

      // Categoría 4: Staff y Triaje (Privada)
      const staffCat = await guild.channels.create({
        name: '🔒 STAFF & TRIAJE',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [{ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }]
      });
      const bugTriageCh = await guild.channels.create({ name: '🐛・triaje-bugs', type: ChannelType.GuildText, parent: staffCat.id });
      const surveyLogsCh = await guild.channels.create({ name: '📊・resultados-on09', type: ChannelType.GuildText, parent: staffCat.id });

      // Poblar #bienvenida-y-reglas
      const welcomeEmbed = new EmbedBuilder()
        .setTitle('Bienvenido a la Comunidad Oficial de Kaibu 🇨🇱')
        .setDescription(
          '**"Te cobran por que tu plan se adapte a ti. Kaibu lo adapta gratis."**\n\n' +
          'Kaibu es la aplicación de nutrición y progreso hecha para la mesa chilena. Nuestro cálculo científico (Mifflin-St Jeor + ISSN), su explicación paso a paso y el ajuste semanal según tu promedio real de 7 días son y serán **100 % gratis para siempre** (RN-17).\n\n' +
          '**📜 Reglas de la Comunidad y Privacidad (Ley 21.719):**\n' +
          '• **Orientación, no diagnóstico:** Kaibu entrega estimaciones y no reemplaza a un nutricionista ni a un médico.\n' +
          '• **Cero fotos corporales de "antes y después":** Tus fotos de progreso en la app son estrictamente privadas. En el servidor solo compartimos las tarjetas gráficas de resumen semanal (`1080×1920`).\n' +
          '• **Respeto en cada fase:** Todos los ritmos de déficit, mantenimiento o volumen son válidos.'
        )
        .setColor('#ef4444');

      const roleRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('toggle_updates_role').setLabel('🔔 Recibir Avisos de Novedades').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('claim_tester_role').setLabel('🧪 Soy Beta Tester').setStyle(ButtonStyle.Primary)
      );
      await welcomeCh.send({ embeds: [welcomeEmbed], components: [roleRow] });

      // Poblar #roadmap-sprints
      const roadmapEmbed = new EmbedBuilder()
        .setTitle('🗺️ Hoja de Ruta de Kaibu (SRS v2.4 · 10 Sprints)')
        .addFields(
          { name: '✅ Etapa 1 y MVP (Sprints 0 a 2 - Versión actual 0.2.0-beta)', value: 'Plan explicado, registro rápido (<10s), catálogo chileno, promedio de 7 días, ajuste semanal gratis, agua, notas, score semanal, exportar/borrar datos (Ley 21.719) y compartir progreso como historia.' },
          { name: '🚧 Etapa 2: Progreso y Hábitos (Sprints 3 y 4)', value: 'Suplementos, fotos privadas en línea de tiempo, medidas corporales, recordatorios, módulo de Gym con progresión de cargas (RN-20), recetas, ayuno e informe PDF.' },
          { name: '📦 Etapa 3: Escáner y Comunidad (Sprints 5 y 6)', value: 'Escáner de códigos de barras EAN-13/8, conexión con Open Food Facts, sellos chilenos "ALTO EN" (Ley 20.606), fibra/azúcar/sodio y base comunitaria verificada.' },
          { name: '🤖 Etapa 4: IA y Tiendas Nativas (Sprints 7 a 10)', value: 'Apps en Google Play y App Store, conexión con Health Connect y Apple HealthKit, Kaibu+ ($2.490/mes: registro por voz, texto y foto + Coach IA) y Panel Profesional.' }
        )
        .setColor('#10b981');
      await roadmapCh.send({ embeds: [roadmapEmbed] });

      // Poblar #centro-de-feedback
      const feedbackEmbed = new EmbedBuilder()
        .setTitle('🛠️ Centro de Feedback, Sugerencias y Validación Beta')
        .setDescription(
          'Tu ayuda en esta beta privada define el futuro de Kaibu:\n\n' +
          '🐛 **Reportar un Bug:** ¿Algo falló en PC, PWA o Android APK? Avísanos para resolverlo en el sprint actual.\n' +
          '💡 **Enviar Sugerencia:** Propón mejoras para que la comunidad las vote en <#' + suggestionsCh.id + '>.\n' +
          '📊 **Encuesta Beta (ON-09):** Responde 2 preguntas rápidas sobre el futuro plan opcional Kaibu+.'
        )
        .setColor('#3b82f6');

      const feedbackRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_open_bug').setLabel('🐛 Reportar Bug').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('btn_open_sug').setLabel('💡 Enviar Sugerencia').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('btn_open_survey').setLabel('📊 Encuesta Kaibu+').setStyle(ButtonStyle.Success)
      );
      await feedbackCh.send({ embeds: [feedbackEmbed], components: [feedbackRow] });

      // Guardar IDs en Supabase
      await supabase.from('discord_guild_config').insert({
        guild_id: guild.id,
        feedback_channel_id: feedbackCh.id,
        suggestions_channel_id: suggestionsCh.id,
        bug_triage_channel_id: bugTriageCh.id,
        survey_logs_channel_id: surveyLogsCh.id,
        general_channel_id: generalCh.id,
        progress_channel_id: progressCh.id,
        updates_role_id: updatesRole.id,
        tester_role_id: testerRole.id
      });

      return interaction.editReply(
        `✅ **Comunidad Kaibu configurada con éxito.**\n` +
        `Para activar las actualizaciones automáticas en <#${updatesCh.id}>, crea un Webhook en ese canal y pégalo en los ajustes de tu repo de GitHub agregando \`/github\` al final.`
      );
    }

    // =========================================================================
    // 2. AUTO-ROLES DE BIENVENIDA
    // =========================================================================
    if (interaction.isButton() && (interaction.customId === 'toggle_updates_role' || interaction.customId === 'claim_tester_role')) {
      const { data: cfg } = await supabase.from('discord_guild_config').select('*').eq('guild_id', interaction.guildId).single();
      if (!cfg) return interaction.reply({ content: 'Configuración no encontrada.', ephemeral: true });

      const roleId = interaction.customId === 'toggle_updates_role' ? cfg.updates_role_id : cfg.tester_role_id;
      const member = interaction.member;

      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId);
        return interaction.reply({ content: `Se quitó el rol <@&${roleId}> de tu perfil.`, ephemeral: true });
      } else {
        await member.roles.add(roleId);
        return interaction.reply({ content: `¡Listo! Ya tienes el rol <@&${roleId}>.`, ephemeral: true });
      }
    }

    // =========================================================================
    // 3. FLUJO DE REPORTE DE BUGS + CREACIÓN DE ISSUE EN GITHUB
    // =========================================================================
    if (interaction.isButton() && interaction.customId === 'btn_open_bug') {
      const modal = new ModalBuilder().setCustomId('modal_bug_submit').setTitle('🐛 Reportar Bug en Kaibu (v0.2.0-beta)');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('platform')
            .setLabel('Plataforma (Web PC, PWA iPhone/Android, APK)')
            .setPlaceholder('Ej: PWA en iPhone iOS 17 / APK Android 14')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('offline')
            .setLabel('¿Ocurrió sin conexión a internet? (RF-51)')
            .setPlaceholder('Sí / No / Al reconectar')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('description')
            .setLabel('¿Qué ocurrió y cómo podemos reproducirlo?')
            .setPlaceholder('Detalla en qué pantalla estabas (Hoy, Mi Plan, Progreso) y qué botón tocaste...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );
      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_bug_submit') {
      await interaction.deferReply({ ephemeral: true });
      const platform = interaction.fields.getTextInputValue('platform');
      const offline = interaction.fields.getTextInputValue('offline');
      const description = interaction.fields.getTextInputValue('description');

      const { data: bug, error } = await supabase.from('discord_bug_reports').insert({
        user_id: interaction.user.id,
        user_tag: interaction.user.tag,
        platform,
        offline_mode: offline,
        description
      }).select().single();

      if (error) return interaction.editReply('Error al guardar el reporte en Supabase.');

      const { data: cfg } = await supabase.from('discord_guild_config').select('*').eq('guild_id', interaction.guildId).single();
      const triageCh = await client.channels.fetch(cfg.bug_triage_channel_id).catch(() => null);

      if (triageCh) {
        const embed = new EmbedBuilder()
          .setTitle(`🐛 Bug #${bug.id.slice(0, 8)} · ${interaction.user.tag}`)
          .addFields(
            { name: '📱 Plataforma', value: platform, inline: true },
            { name: '📡 Modo Offline', value: offline, inline: true },
            { name: '📌 Estado', value: '⏳ Pendiente de revisión', inline: true },
            { name: '📝 Descripción y pasos', value: description }
          )
          .setColor('#ef4444')
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`bug_gh_${bug.id}`).setLabel('🐙 Crear Issue en GitHub').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`bug_ok_${bug.id}`).setLabel('✅ Marcar Resuelto').setStyle(ButtonStyle.Success)
        );
        await triageCh.send({ embeds: [embed], components: [row] });
      }

      return interaction.editReply('✅ ¡Gracias! Tu reporte fue registrado en la base de datos y enviado al equipo de desarrollo.');
    }

    if (interaction.isButton() && interaction.customId.startsWith('bug_gh_')) {
      await interaction.deferReply({ ephemeral: true });
      const bugId = interaction.customId.replace('bug_gh_', '');
      const { data: bug } = await supabase.from('discord_bug_reports').select('*').eq('id', bugId).single();

      if (!process.env.GITHUB_TOKEN) {
        return interaction.editReply('⚠️ Configura `GITHUB_TOKEN` en tu `.env` para crear Issues automáticamente en `Sxnr/Kaibu`.');
      }

      const response = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO || 'Sxnr/Kaibu'}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `[Bug Beta] ${bug.platform}: ${bug.description.slice(0, 50)}...`,
          body: `**Reportado por:** ${bug.user_tag} en Discord\n**Plataforma:** ${bug.platform}\n**Sin conexión (RF-51):** ${bug.offline_mode}\n\n### Descripción\n${bug.description}`,
          labels: ['bug', 'beta']
        })
      });

      if (!response.ok) return interaction.editReply('❌ Error al conectar con la API de GitHub. Verifica los permisos del token.');
      const issue = await response.json();

      await supabase.from('discord_bug_reports').update({ status: 'en_sprint', github_issue_url: issue.html_url }).eq('id', bugId);
      return interaction.editReply(`✅ Issue creado en GitHub: ${issue.html_url}`);
    }

    if (interaction.isButton() && interaction.customId.startsWith('bug_ok_')) {
      const bugId = interaction.customId.replace('bug_ok_', '');
      await supabase.from('discord_bug_reports').update({ status: 'resuelto' }).eq('id', bugId);
      const oldEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setColor('#10b981');
      oldEmbed.spliceFields(2, 1, { name: '📌 Estado', value: '✅ Resuelto', inline: true });
      await interaction.update({ embeds: [oldEmbed], components: [] });
    }

    // =========================================================================
    // 4. FLUJO DE SUGERENCIAS CON VOTOS EN SUPABASE E HILOS AUTOMÁTICOS
    // =========================================================================
    if (interaction.isButton() && interaction.customId === 'btn_open_sug') {
      const modal = new ModalBuilder().setCustomId('modal_sug_submit').setTitle('💡 Enviar Sugerencia para Kaibu');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('title').setLabel('Título corto de la idea').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('description').setLabel('¿Cómo ayudaría a mejorar tu registro o plan?').setStyle(TextInputStyle.Paragraph).setRequired(true)
        )
      );
      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_sug_submit') {
      await interaction.deferReply({ ephemeral: true });
      const title = interaction.fields.getTextInputValue('title');
      const description = interaction.fields.getTextInputValue('description');

      const { data: cfg } = await supabase.from('discord_guild_config').select('*').eq('guild_id', interaction.guildId).single();
      const sugCh = await client.channels.fetch(cfg.suggestions_channel_id).catch(() => null);
      if (!sugCh) return interaction.editReply('Canal de sugerencias no encontrado.');

      const { data: sug } = await supabase.from('discord_suggestions').insert({
        user_id: interaction.user.id,
        user_tag: interaction.user.tag,
        title,
        description,
        upvotes: [interaction.user.id]
      }).select().single();

      const embed = new EmbedBuilder()
        .setTitle(`💡 ${title}`)
        .setDescription(description)
        .addFields(
          { name: 'Autor', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Estado SRS', value: '⏳ En votación comunitaria', inline: true },
          { name: 'Votos', value: '🔼 `1`   |   🔽 `0`', inline: true }
        )
        .setColor('#3b82f6')
        .setTimestamp();

      const voteRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`sug_up_${sug.id}`).setLabel('🔼 Apoyar (1)').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`sug_down_${sug.id}`).setLabel('🔽 En contra (0)').setStyle(ButtonStyle.Secondary)
      );

      const adminRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`sug_status_${sug.id}`)
          .setPlaceholder('🛠️ Staff: Cambiar estado en SRS')
          .addOptions([
            { label: 'Ya está en la SRS (Próximos Sprints)', value: 'en_srs', emoji: '📋' },
            { label: 'Aprobada para siguiente versión', value: 'aprobada', emoji: '✅' },
            { label: 'Fuera de alcance (Sección 2.3 / RN-17)', value: 'fuera_alcance', emoji: '⛔' }
          ])
      );

      const msg = await sugCh.send({ embeds: [embed], components: [voteRow, adminRow] });
      const thread = await msg.startThread({ name: `Debate: ${title.slice(0, 40)}`, autoArchiveDuration: 1440 });

      await supabase.from('discord_suggestions').update({ message_id: msg.id, thread_id: thread.id }).eq('id', sug.id);
      return interaction.editReply(`✅ ¡Sugerencia publicada en <#${sugCh.id}>!`);
    }

    if (interaction.isButton() && (interaction.customId.startsWith('sug_up_') || interaction.customId.startsWith('sug_down_'))) {
      const isUp = interaction.customId.startsWith('sug_up_');
      const sugId = interaction.customId.replace(isUp ? 'sug_up_' : 'sug_down_', '');
      const userId = interaction.user.id;

      const { data: sug } = await supabase.from('discord_suggestions').select('*').eq('id', sugId).single();
      if (!sug) return interaction.reply({ content: 'Sugerencia no encontrada.', ephemeral: true });

      let up = sug.upvotes || [];
      let down = sug.downvotes || [];

      if (isUp) {
        down = down.filter(id => id !== userId);
        up = up.includes(userId) ? up.filter(id => id !== userId) : [...up, userId];
      } else {
        up = up.filter(id => id !== userId);
        down = down.includes(userId) ? down.filter(id => id !== userId) : [...down, userId];
      }

      await supabase.from('discord_suggestions').update({ upvotes: up, downvotes: down }).eq('id', sugId);

      const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
      updatedEmbed.spliceFields(2, 1, { name: 'Votos', value: `🔼 \`${up.length}\`   |   🔽 \`${down.length}\``, inline: true });

      const newVoteRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`sug_up_${sug.id}`).setLabel(`🔼 Apoyar (${up.length})`).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`sug_down_${sug.id}`).setLabel(`🔽 En contra (${down.length})`).setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ embeds: [updatedEmbed], components: [newVoteRow, interaction.message.components[1]] });
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('sug_status_')) {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: 'Solo el dueño del producto puede cambiar el estado en la SRS.', ephemeral: true });
      }
      const sugId = interaction.customId.replace('sug_status_', '');
      const status = interaction.values[0];

      const statusMap = {
        en_srs: { text: '📋 Planificada en SRS (Etapas 2-4)', color: '#eab308' },
        aprobada: { text: '✅ Aprobada para construir', color: '#10b981' },
        fuera_alcance: { text: '⛔ Fuera de alcance de esta versión', color: '#6b7280' }
      };

      await supabase.from('discord_suggestions').update({ status }).eq('id', sugId);
      const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setColor(statusMap[status].color);
      updatedEmbed.spliceFields(1, 1, { name: 'Estado SRS', value: statusMap[status].text, inline: true });

      return interaction.update({ embeds: [updatedEmbed] });
    }

    // =========================================================================
    // 5. ENCUESTA DE VALIDACIÓN DE PAGO (OBJETIVO DE NEGOCIO ON-09)
    // =========================================================================
    if (interaction.isButton() && interaction.customId === 'btn_open_survey') {
      const modal = new ModalBuilder().setCustomId('modal_survey_submit').setTitle('📊 Encuesta Beta Kaibu+ (Meta ON-09)');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('would_pay')
            .setLabel('¿Pagarías $2.490/mes por IA (Foto/Voz/Coach)?')
            .setPlaceholder('Responde: SI o NO (Lo básico seguirá 100% gratis siempre)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('fav_feature')
            .setLabel('¿Qué función de IA te ahorraría más tiempo?')
            .setPlaceholder('Foto del plato / Dictar por voz / Coach IA / Escáner')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('comments')
            .setLabel('¿Qué es lo que más te ha gustado de la beta?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        )
      );
      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_survey_submit') {
      await interaction.deferReply({ ephemeral: true });
      const rawPay = interaction.fields.getTextInputValue('would_pay').trim().toUpperCase();
      const wouldPay = rawPay.startsWith('S') || rawPay.includes('YES');
      const favFeature = interaction.fields.getTextInputValue('fav_feature');
      const comments = interaction.fields.getTextInputValue('comments') || 'Sin comentarios adicionales';

      await supabase.from('discord_beta_survey').upsert({
        user_id: interaction.user.id,
        user_tag: interaction.user.tag,
        would_pay: wouldPay,
        favorite_feature: favFeature,
        comments
      });

      const { data: allResponses } = await supabase.from('discord_beta_survey').select('would_pay');
      const total = allResponses ? allResponses.length : 1;
      const yesCount = allResponses ? allResponses.filter(r => r.would_pay).length : (wouldPay ? 1 : 0);
      const pct = ((yesCount / total) * 100).toFixed(1);

      const { data: cfg } = await supabase.from('discord_guild_config').select('*').eq('guild_id', interaction.guildId).single();
      const logCh = await client.channels.fetch(cfg.survey_logs_channel_id).catch(() => null);

      if (logCh) {
        const embed = new EmbedBuilder()
          .setTitle(`📊 Nueva Respuesta ON-09 · ${interaction.user.tag}`)
          .addFields(
            { name: '¿Pagaría $2.490/mes?', value: wouldPay ? '✅ SÍ' : '❌ NO', inline: true },
            { name: 'Función favorita', value: favFeature, inline: true },
            { name: 'Progreso Meta ON-09 (≥ 30%)', value: `**${pct}%** (${yesCount}/${total} testers)`, inline: true },
            { name: 'Comentarios', value: comments }
          )
          .setColor(pct >= 30 ? '#10b981' : '#eab308');
        await logCh.send({ embeds: [embed] });
      }

      return interaction.editReply('🙌 ¡Muchas gracias! Tu respuesta quedó registrada para validar la Etapa 4 de Kaibu.');
    }

    // =========================================================================
    // 6. CALCULADORAS CIENTÍFICAS DE KAIBU (RN-01 a RN-20)
    // =========================================================================
    if (interaction.isChatInputCommand() && interaction.commandName === 'calcular-plan') {
      const sexo = interaction.options.getString('sexo');
      const edad = interaction.options.getInteger('edad');
      const peso = interaction.options.getNumber('peso');
      const estatura = interaction.options.getInteger('estatura');
      const factor = parseFloat(interaction.options.getString('actividad'));
      const [faseNombre, velStr] = interaction.options.getString('fase').split('_');
      const velocidad = parseFloat(velStr);

      // RN-01: Mifflin-St Jeor (1990)
      const s = sexo === 'hombre' ? 5 : -161;
      const bmr = Math.round(10 * peso + 6.25 * estatura - 5 * edad + s);

      // RN-03: Mantenimiento
      const mantenimiento = Math.round(bmr * factor);

      // RN-04: Meta diaria (velocidad * 7700 / 7)
      const ajusteKcal = Math.round((velocidad * 7700) / 7);
      const meta = mantenimiento + ajusteKcal;

      // RN-05: Rango aceptable ±10%
      const rangoMin = Math.round(meta * 0.9);
      const rangoMax = Math.round(meta * 1.1);

      // RN-06, RN-07, RN-08: Macros
      const protFactor = faseNombre === 'deficit' ? 2.0 : 1.8;
      const proteinaG = Math.round(peso * protFactor);
      const grasasG = Math.round(peso * 0.8);
      const carbosG = Math.max(0, Math.round((meta - proteinaG * 4 - grasasG * 9) / 4));

      // RN-14: Agua 35 ml/kg
      const aguaMl = Math.round(peso * 35);

      // RN-12: Aviso de seguridad
      const minSeguro = sexo === 'hombre' ? 1500 : 1200;
      const alertaSeguridad = meta < minSeguro || Math.abs(velocidad) > peso * 0.01
        ? `\n⚠️ **Aviso de Seguridad (RN-12):** Tu meta calculada (${meta} kcal) queda bajo el umbral recomendado (${minSeguro} kcal) o supera el 1% de tu peso semanal. Te sugerimos elegir una velocidad más moderada.`
        : '';

      const embed = new EmbedBuilder()
        .setTitle('🧮 Tu Plan Calculado y Explicado (Reglas RN-01 a RN-14)')
        .setDescription(`Cálculo transparente basado en Mifflin-St Jeor (1990) e ISSN (2017):${alertaSeguridad}`)
        .addFields(
          { name: '🔥 Gasto en Reposo (RN-01)', value: `\`${bmr} kcal\`\n(10×${peso} + 6,25×${estatura} - 5×${edad} ${s >= 0 ? '+' + s : s})`, inline: true },
          { name: '⚖️ Mantenimiento (RN-03)', value: `\`${mantenimiento} kcal\`\n(BMR × factor ${factor})`, inline: true },
          { name: '🎯 Meta Diaria (RN-04)', value: `**\`${meta} kcal\`** (${ajusteKcal >= 0 ? '+' : ''}${ajusteKcal} kcal/día)\nRango cumplido (RN-05): \`${rangoMin} – ${rangoMax} kcal\``, inline: false },
          { name: '🥩 Proteína (RN-06)', value: `\`${proteinaG} g\` (${protFactor} g/kg)\nCumplida desde \`${Math.round(proteinaG * 0.9)} g\` (RN-21)`, inline: true },
          { name: '🥑 Grasas (RN-07)', value: `\`${grasasG} g\` (0,8 g/kg)`, inline: true },
          { name: '🍚 Carbohidratos (RN-08)', value: `\`${carbosG} g\` (Resto de kcal)`, inline: true },
          { name: '💧 Agua Recomendada (RN-14)', value: `\`${aguaMl} ml/día\` (35 ml × ${peso} kg)`, inline: false }
        )
        .setColor('#ef4444')
        .setFooter({ text: 'Kaibu entrega estimaciones y no reemplaza a un nutricionista ni a un médico.' });

      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'progresion-gym') {
      const ejercicio = interaction.options.getString('ejercicio');
      const tipo = interaction.options.getString('tipo');
      const pesoActual = interaction.options.getNumber('peso_actual');
      const reps = interaction.options.getInteger('reps_logradas');

      const tope = tipo === 'compuesto' ? 10 : 12;
      const rangoTexto = tipo === 'compuesto' ? '6 a 10' : '8 a 12';
      const sube = reps >= tope;

      const embed = new EmbedBuilder()
        .setTitle(`🏋️ Evaluación de Sobrecarga Progresiva (RN-20): ${ejercicio}`)
        .setDescription(
          sube
            ? `✅ **¡Llegaste al tope de tu rango (${rangoTexto} reps)!**\nEn tu próxima sesión sube a **\`${pesoActual + 2.5} kg\`** (+2,5 kg o el mínimo que permita la máquina) y busca iniciar en la base del rango.`
            : `💪 **Mantén el peso actual (\`${pesoActual} kg\`).**\nLograste **${reps} repeticiones**. Tu meta en las siguientes sesiones es llegar a **${tope} repeticiones** con técnica estricta antes de subir la carga.`
        )
        .setColor(sube ? '#10b981' : '#3b82f6');

      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'verificar-etiqueta') {
      const kcal = interaction.options.getNumber('kcal');
      const p = interaction.options.getNumber('proteina');
      const c = interaction.options.getNumber('carbos');
      const g = interaction.options.getNumber('grasas');
      const azucar = interaction.options.getNumber('azucares') || 0;
      const sat = interaction.options.getNumber('saturadas') || 0;
      const sodio = interaction.options.getNumber('sodio') || 0;

      // RN-15: Coherencia dentro de ±15% de 4P + 4C + 9G
      const kcalTeoricas = 4 * p + 4 * c + 9 * g;
      const diffPct = kcalTeoricas > 0 ? Math.abs(kcal - kcalTeoricas) / kcalTeoricas : 0;
      const esCoherente = diffPct <= 0.15;

      // Ley 20.606: Sellos ALTO EN (Límites sólidos por 100g vigentes en Chile)
      const sellos = [];
      if (kcal > 275) sellos.push('⬛ **ALTO EN CALORÍAS** (> 275 kcal/100g)');
      if (azucar > 10) sellos.push('⬛ **ALTO EN AZÚCARES** (> 10 g/100g)');
      if (sat > 4) sellos.push('⬛ **ALTO EN GRASAS SATURADAS** (> 4 g/100g)');
      if (sodio > 400) sellos.push('⬛ **ALTO EN SODIO** (> 400 mg/100g)');

      const embed = new EmbedBuilder()
        .setTitle('🏷️ Auditoría de Etiqueta Nutricional (RN-15 y Ley 20.606)')
        .addFields(
          {
            name: '🔬 Coherencia de Macros (RN-15)',
            value: esCoherente
              ? `✅ **Válido:** Declara \`${kcal} kcal\` y la suma de macros ($4P+4C+9G$) da \`${Math.round(kcalTeoricas)} kcal\` (desviación del ${(diffPct * 100).toFixed(1)}%, dentro del ±15%).`
              : `❌ **Rechazado por RN-15:** Declara \`${kcal} kcal\`, pero sus macros suman \`${Math.round(kcalTeoricas)} kcal\` (desviación del ${(diffPct * 100).toFixed(1)}%, supera el ±15%).`
          },
          {
            name: '🇨🇱 Sellos de Advertencia (RF-39 · Ley 20.606)',
            value: sellos.length > 0 ? sellos.join('\n') : '🟢 Libre de sellos "ALTO EN" (según los datos ingresados para 100g sólidos).'
          }
        )
        .setColor(esCoherente ? '#10b981' : '#ef4444');

      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'metricas-beta') {
      await interaction.deferReply({ ephemeral: true });
      const { data: bugs } = await supabase.from('discord_bug_reports').select('status');
      const { data: sugs } = await supabase.from('discord_suggestions').select('status');
      const { data: survey } = await supabase.from('discord_beta_survey').select('would_pay');

      const bugsPendientes = bugs ? bugs.filter(b => b.status === 'pendiente').length : 0;
      const totalSurvey = survey ? survey.length : 0;
      const yesSurvey = survey ? survey.filter(s => s.would_pay).length : 0;
      const pctSurvey = totalSurvey > 0 ? ((yesSurvey / totalSurvey) * 100).toFixed(1) : '0.0';

      const embed = new EmbedBuilder()
        .setTitle('📈 Tablero de Control Beta - Kaibu (OP-01 & ON-09)')
        .addFields(
          { name: '🐛 Bugs Reportados', value: `Pendientes: \`${bugsPendientes}\` / Total: \`${bugs ? bugs.length : 0}\``, inline: true },
          { name: '💡 Sugerencias', value: `Total registradas: \`${sugs ? sugs.length : 0}\``, inline: true },
          { name: '📊 Validación de Pago ON-09 (Meta ≥ 30%)', value: `**${pctSurvey}%** pagaría $2.490/mes (${yesSurvey} de ${totalSurvey} respuestas)`, inline: false }
        )
        .setColor('#10b981');

      return interaction.editReply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error en interacción:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Ocurrió un error al procesar la solicitud.', ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);