// /presentarme y el botón "Presentarme" de #preséntate: un formulario de 5 datos que el bot publica
// como tarjeta con la foto de perfil y un hilo para dar la bienvenida.
const { ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js')
const { configServidor, COLOR } = require('./config')
const { mensajeV2 } = require('./v2')

const efimero = { flags: MessageFlags.Ephemeral }
const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000
const ultima = new Map() // persona → cuándo se presentó (en memoria: evita tarjetas repetidas)

const CAMPOS = [
  { id: 'nombre', etiqueta: 'Nombre o apodo', ejemplo: 'Seba', max: 40, corto: true },
  { id: 'lugar', etiqueta: 'Comuna o región', ejemplo: 'Maipú, Santiago', max: 60, corto: true },
  { id: 'meta', etiqueta: 'Tu meta', ejemplo: 'Bajar 5 kg sin perder fuerza', max: 120, corto: true },
  { id: 'gym', etiqueta: 'Días de gym por semana', ejemplo: '4', max: 20, corto: true },
  { id: 'comida', etiqueta: 'Comida chilena favorita', ejemplo: 'Pastel de choclo', max: 60, corto: true },
]

function modalPresentacion() {
  const modal = new ModalBuilder().setCustomId('modal_presentacion').setTitle('🙋 Preséntate en Kaibu')
  for (const c of CAMPOS) {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId(c.id).setLabel(c.etiqueta).setPlaceholder(c.ejemplo).setStyle(TextInputStyle.Short).setMaxLength(c.max).setRequired(true),
      ),
    )
  }
  return modal
}

/** Limpia y valida lo escrito (lógica pura). Devuelve { ok, datos } o { ok: false, error }. */
function validarPresentacion(entrada) {
  const datos = {}
  for (const c of CAMPOS) {
    // Sin menciones ni links: la tarjeta es para conocerse, no para promocionar.
    const valor = String(entrada[c.id] ?? '').replace(/\s+/g, ' ').replace(/@/g, '').trim().slice(0, c.max)
    if (!valor) return { ok: false, error: `Falta: ${c.etiqueta}.` }
    if (/https?:\/\/|discord\.gg|www\./i.test(valor)) return { ok: false, error: 'Sin links en la presentación, por favor.' }
    datos[c.id] = valor
  }
  return { ok: true, datos }
}

/** Tarjeta de presentación (lógica pura). */
function tarjetaPresentacion(datos, usuarioId, avatarUrl) {
  return mensajeV2({
    acento: COLOR.ambar,
    piezas: [
      { texto: `## 👋 ¡Llegó ${datos.nombre}!\n<@${usuarioId}> · 📍 ${datos.lugar}`, miniatura: avatarUrl },
      { separador: true },
      { texto: `🎯 **Meta:** ${datos.meta}\n🏋️ **Gym:** ${datos.gym} días por semana\n🍲 **Comida chilena favorita:** ${datos.comida}` },
      { texto: '-# Dale la bienvenida en el hilo 👇' },
    ],
  })
}

/** Botón o comando: abre el formulario (si no se presentó hace poco). */
async function abrirPresentacion(interaction) {
  const antes = ultima.get(interaction.user.id)
  if (antes && Date.now() - antes < SIETE_DIAS) {
    return interaction.reply({ content: 'Ya te presentaste esta semana 🙌. Si quieres cambiar algo, cuéntalo en el hilo de tu tarjeta.', ...efimero })
  }
  return interaction.showModal(modalPresentacion())
}

async function enviarPresentacion(interaction) {
  const entrada = Object.fromEntries(CAMPOS.map((c) => [c.id, interaction.fields.getTextInputValue(c.id)]))
  const r = validarPresentacion(entrada)
  if (!r.ok) return interaction.reply({ content: `⚠️ ${r.error}`, ...efimero })
  const cfg = await configServidor(interaction.guildId)
  const canal = cfg?.presentate_channel_id && (await interaction.guild.channels.fetch(cfg.presentate_channel_id).catch(() => null))
  if (!canal) return interaction.reply({ content: 'No encuentro #preséntate. Avísale al equipo (/setup).', ...efimero })
  const avatar = interaction.user.displayAvatarURL({ extension: 'png', size: 256 })
  const mensaje = await canal.send(tarjetaPresentacion(r.datos, interaction.user.id, avatar))
  ultima.set(interaction.user.id, Date.now())
  await mensaje.react('👋').catch(() => null)
  await mensaje.startThread({ name: `👋 Bienvenida a ${r.datos.nombre}`.slice(0, 100), autoArchiveDuration: 10080 }).catch(() => null)
  return interaction.reply({ content: `🎉 ¡Listo! Tu presentación quedó en <#${canal.id}>.`, ...efimero })
}

module.exports = { CAMPOS, modalPresentacion, validarPresentacion, tarjetaPresentacion, abrirPresentacion, enviarPresentacion }
