// Respuestas de /calcular-plan, /progresion-gym y /verificar-etiqueta (fórmulas en calculos.js).
const { EmbedBuilder, MessageFlags } = require('discord.js')
const { COLOR } = require('./config')
const { calcularPlan, progresionGym, verificarEtiqueta } = require('./calculos')
const { numeroCL, truncar } = require('./texto')

const PIE = 'Kaibu entrega estimaciones y no reemplaza a un nutricionista ni a un médico.'
const responder = (interaction, embed) =>
  interaction.reply({ embeds: [embed], ...(interaction.options.getBoolean('compartir') ? {} : { flags: MessageFlags.Ephemeral }) })

function planCmd(interaction) {
  const o = interaction.options
  const [objetivo, kg] = o.getString('fase').split('_')
  const d = {
    sexo: o.getString('sexo'),
    edad: o.getInteger('edad'),
    peso: o.getNumber('peso'),
    estatura: o.getInteger('estatura'),
    factor: Number(o.getString('actividad')),
    objetivo,
    kgSemana: Number(kg),
  }
  const p = calcularPlan(d)
  const n = (v) => numeroCL(v)
  const avisos = []
  if (p.avisos.includes('kcal_bajo_minimo')) avisos.push(`⚠️ La meta queda bajo ${n(p.kcalMinima)} kcal, el mínimo recomendado. Elige un ritmo más lento.`)
  if (p.avisos.includes('ritmo_alto')) avisos.push('⚠️ Ese ritmo supera el 1 % de tu peso por semana. Te conviene uno más lento.')
  const embed = new EmbedBuilder()
    .setTitle('🧮 Tu plan calculado y explicado')
    .setDescription(['Fórmula de Mifflin-St Jeor (1990) y recomendaciones ISSN, igual que en la app.', ...avisos].join('\n'))
    .addFields(
      { name: 'Gasto en reposo (RN-01)', value: `${n(p.basal)} kcal`, inline: true },
      { name: 'Mantenimiento (RN-03)', value: `${n(p.mantenimiento)} kcal (× ${String(d.factor).replace('.', ',')})`, inline: true },
      { name: 'Meta diaria (RN-04)', value: `**${n(p.meta)} kcal** (${p.ajuste >= 0 ? '+' : '−'}${n(Math.abs(p.ajuste))} al día)\nRango: ${n(p.rango.min)}–${n(p.rango.max)} kcal`, inline: false },
      { name: 'Proteína (RN-06)', value: `${n(p.proteinaG)} g (${numeroCL(p.protFactor, 1)} g/kg)\nCumplida desde ${n(p.proteinaMinimaG)} g`, inline: true },
      { name: 'Grasas (RN-07)', value: `${n(p.grasasG)} g`, inline: true },
      { name: 'Carbohidratos (RN-08)', value: `${n(p.carbosG)} g`, inline: true },
      { name: 'Agua (RN-14)', value: `${n(p.aguaMl)} ml al día`, inline: false },
    )
    .setColor(COLOR.marca)
    .setFooter({ text: `${PIE} En la app, el plan se ajusta solo cada semana.` })
  return responder(interaction, embed)
}

function gymCmd(interaction) {
  const o = interaction.options
  const r = progresionGym({ tipo: o.getString('tipo'), peso: o.getNumber('peso_actual'), reps: o.getInteger('reps_logradas') })
  const ejercicio = truncar(o.getString('ejercicio'), 60)
  const embed = new EmbedBuilder()
    .setTitle(`🏋️ Progresión: ${ejercicio}`)
    .setDescription(
      r.sube
        ? `✅ Llegaste al tope de tu rango (${r.rango} reps). La próxima sesión sube a **${numeroCL(r.nuevoPeso, 1)} kg** (o el mínimo que permita la máquina) y vuelve a la base del rango.`
        : `💪 Mantén **${numeroCL(r.nuevoPeso, 1)} kg**. Lograste ${o.getInteger('reps_logradas')} reps; sube cuando llegues a ${r.tope} con buena técnica.`,
    )
    .setColor(r.sube ? COLOR.exito : COLOR.info)
  return responder(interaction, embed)
}

const NOMBRE_SELLO = { calorias: 'ALTO EN CALORÍAS', azucares: 'ALTO EN AZÚCARES', grasas_saturadas: 'ALTO EN GRASAS SATURADAS', sodio: 'ALTO EN SODIO' }

function etiquetaCmd(interaction) {
  const o = interaction.options
  const estado = o.getString('tipo')
  const r = verificarEtiqueta({
    estado,
    kcal: o.getNumber('kcal'),
    proteina: o.getNumber('proteina'),
    carbos: o.getNumber('carbos'),
    grasas: o.getNumber('grasas'),
    azucares: o.getNumber('azucares') ?? 0,
    saturadas: o.getNumber('saturadas') ?? 0,
    sodio: o.getNumber('sodio') ?? 0,
  })
  const unidad = estado === 'liquido' ? '100 ml' : '100 g'
  const sinDatos = ['azucares', 'saturadas', 'sodio'].filter((k) => o.getNumber(k) === null)
  const embed = new EmbedBuilder()
    .setTitle(`🏷️ Revisión de etiqueta (por ${unidad})`)
    .addFields(
      {
        name: 'Coherencia de calorías (RN-15)',
        value: `${r.coherente ? '✅ Coherente' : '❌ No cuadra'}: declara ${numeroCL(o.getNumber('kcal'))} kcal y sus macros (4 × proteína + 4 × carbos + 9 × grasas) suman ${numeroCL(r.calculadas)} kcal (diferencia ${numeroCL(r.diferenciaPct, 1)} %, máximo 15 %).`,
      },
      {
        name: 'Sellos ALTO EN (Ley 20.606)',
        value:
          (r.sellos.length ? r.sellos.map((s) => `⬛ **${NOMBRE_SELLO[s]}**`).join('\n') : '🟢 Sin sellos con los datos ingresados.') +
          (sinDatos.length ? `\n_Sin dato de: ${sinDatos.join(', ')}._` : ''),
      },
    )
    .setColor(r.coherente ? COLOR.exito : COLOR.marca)
  return responder(interaction, embed)
}

module.exports = { planCmd, gymCmd, etiquetaCmd }
