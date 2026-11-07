// /ayuda: todos los comandos y los canales clave, en un bloque que solo ve quien lo pide.
const { MessageFlags } = require('discord.js')
const { configServidor, COLOR } = require('./config')
const { mensajeV2 } = require('./v2')

/** Mensaje de ayuda (lógica pura). */
function mensajeAyuda(cfg, esEquipo = false) {
  const c = (clave, texto) => (cfg?.[clave] ? `<#${cfg[clave]}>` : texto)
  const mensaje = mensajeV2({
    acento: COLOR.info,
    piezas: [
      { texto: '# 🧭 Ayuda de Kaibu' },
      { separador: true },
      {
        texto:
          '## 🍽️ Comida y gym\n' +
          '`/alimento` kcal y proteína de cualquier comida (cazuela, arroz con pollo, productos del súper)\n' +
          '`/calcular-plan` tu meta de kcal y macros\n' +
          '`/progresion-gym` cuánto subir en tu próximo entrenamiento\n' +
          '`/verificar-etiqueta` revisa la etiqueta de un producto',
      },
      { separador: true },
      {
        texto:
          '## 👥 Comunidad\n' +
          `\`/presentarme\` tu tarjeta en ${c('presentate_channel_id', '#preséntate')}\n` +
          '`/mi-invitacion` tu link para invitar (cada mes destacamos a quien trae más gente)\n' +
          '`/vincular` conecta tu cuenta de la app (beta testers) · `/desvincular`\n' +
          `-# Elige tu región y tus avisos en ${c('welcome_channel_id', '#información')}.`,
      },
      esEquipo ? { separador: true } : null,
      esEquipo
        ? { texto: '## 🛡️ Equipo\n`/anuncio` · `/video` · `/invitaciones` · `/codigo-beta` · `/cupo-beta` · `/metricas-beta` · `/setup` · `/invitacion`' }
        : null,
    ],
  })
  return { ...mensaje, flags: mensaje.flags | MessageFlags.Ephemeral }
}

async function ayuda(interaction) {
  const cfg = await configServidor(interaction.guildId)
  const { esDelEquipo } = require('./permisos')
  const equipo = esDelEquipo(interaction.member?.roles?.cache ?? new Map(), cfg, interaction.memberPermissions?.has('ManageGuild'))
  return interaction.reply(mensajeAyuda(cfg, equipo))
}

module.exports = { mensajeAyuda, ayuda }
