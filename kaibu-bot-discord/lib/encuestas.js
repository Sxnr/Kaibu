// Encuesta chilena de los miércoles (13:00) en #general: encuesta nativa de Discord de 24 horas.
// Rota cada semana como el desafío; da conversación fácil y nos dice qué come la comunidad.
const { configPrincipal } = require('./conectada')
const { ENCUESTAS } = require('./contenido')
const R = require('./reglas')

/** Encuesta de la semana (lógica pura, misma rotación que el desafío). */
function encuestaDeLaSemana(fecha, lista = ENCUESTAS) {
  return R.desafioDeLaSemana(R.lunesDe(fecha), lista)
}

/** Datos para channel.send({ poll }) (lógica pura). */
function datosEncuesta(e) {
  return {
    question: { text: e.pregunta.slice(0, 300) },
    answers: e.respuestas.map(([emoji, texto]) => ({ text: texto.slice(0, 55), emoji })),
    duration: 24,
    allowMultiselect: false,
  }
}

let ultimaSemana = null // en memoria: el cron corre una vez por semana

async function publicarEncuesta(client) {
  try {
    const cfg = await configPrincipal()
    if (!cfg?.general_channel_id) return
    const hoy = R.hoyChile()
    const semana = R.lunesDe(hoy)
    if (ultimaSemana === semana) return
    const canal = await client.channels.fetch(cfg.general_channel_id).catch(() => null)
    if (!canal) return
    ultimaSemana = semana
    await canal.send({ content: '🇨🇱 **Encuesta de la semana** · vota y comenta 👇', poll: datosEncuesta(encuestaDeLaSemana(hoy)) })
  } catch (e) {
    console.error('Error publicando la encuesta semanal:', e)
  }
}

module.exports = { encuestaDeLaSemana, datosEncuesta, publicarEncuesta }
