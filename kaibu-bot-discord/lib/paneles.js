// Paneles fijos del servidor con el formato nuevo de Discord: verificación, reglas, información,
// "Kaibu hoy" (roadmap), feedback y las plantillas de cada canal. Funciones puras: arman el mensaje.
const { ButtonBuilder, ButtonStyle } = require('discord.js')
const { APP_URL, COLOR } = require('./config')
const { mensajeV2 } = require('./v2')
const { textoCupos, panelEstado } = require('./reglas')
const { menuRegiones } = require('./regiones')

const canalO = (cfg, clave, texto) => (cfg?.[clave] ? `<#${cfg[clave]}>` : texto)
const sep = (grande = false) => ({ separador: true, grande })
const boton = (id, texto, estilo = ButtonStyle.Secondary) => new ButtonBuilder().setCustomId(id).setLabel(texto).setStyle(estilo)
const enlace = (texto, url) => new ButtonBuilder().setLabel(texto).setStyle(ButtonStyle.Link).setURL(url)

// Título de cada panel: así el bot lo reconoce para editarlo en vez de publicar otro.
const TITULOS = {
  verificacion: '# 👋 Bienvenido a Kaibu',
  reglas: '# 📜 Reglas de la comunidad',
  informacion: '# ℹ️ Todo sobre Kaibu',
  roadmap: '# 📍 Kaibu hoy',
  feedback: '# 🛠️ Centro de feedback',
  presentate: '# 🙋 Preséntate',
  recetas: '# 🥑 Mesa chilena y recetas',
  gym: '# 🏋️ Gym y cargas',
  preguntas: '# ❓ Preguntas',
  progreso: '# 📈 Tarjetas de progreso',
}

/* ---------- Reglas ---------- */

const ESENCIALES = [
  '**Respeto siempre.** Bajar, mantener o subir: todos los ritmos valen. Cero burlas sobre cuerpos o comidas.',
  '**Sin fotos corporales.** Comparte tus tarjetas de progreso de la app, no tu cuerpo.',
  '**Sin spam ni ventas.** Nada de publicidad, links raros, autopromoción ni venta de suplementos.',
  '**Cada cosa en su canal.** Dudas en preguntas, progreso en tarjetas, memes en off-topic.',
  '**Ayuda a quien empieza.** Todos partimos sin saber cuántas calorías tenía el arroz.',
  '**Nada +18, violento ni discriminatorio**, ni en mensajes, apodos ni fotos de perfil.',
  '**Cuida tus datos.** No compartas teléfonos, direcciones ni datos de salud de otras personas.',
  '**Sigue las normas de Discord** (discord.com/guidelines).',
]

function panelReglas() {
  return mensajeV2({
    acento: COLOR.marca,
    piezas: [
      { texto: `${TITULOS.reglas}\nQueremos un lugar donde dé gusto preguntar, compartir y avanzar. Aplican en todos los canales.` },
      sep(true),
      { texto: `## ✅ Lo esencial\n${ESENCIALES.map((r, i) => `${i + 1}. ${r}`).join('\n')}` },
      sep(),
      {
        texto:
          '## 🩺 Salud y privacidad\n' +
          '- Kaibu entrega **estimaciones**: no reemplaza a un nutricionista ni a un médico.\n' +
          '- No promovemos dietas extremas, ayunos peligrosos ni conductas de trastornos alimentarios. Si lo estás pasando mal, habla con un profesional o llama a **Salud Responde: 600 360 7777**.\n' +
          '- Tus datos son tuyos (Ley 21.719): puedes descargarlos o borrar tu cuenta cuando quieras.',
      },
      sep(),
      {
        texto:
          '## 🛡️ Moderación\n' +
          '**1.** Aviso del equipo → **2.** Silencio de 24 horas → **3.** Expulsión.\n' +
          'El acoso, el spam masivo o el contenido ilegal se expulsan de inmediato.\n' +
          '-# ¿Viste algo raro? Menciona a 🛡️ Equipo Kaibu o escríbele a alguien del equipo.',
      },
    ],
  })
}

/* ---------- Verificación ---------- */

function panelVerificacion(cfg) {
  return mensajeV2({
    acento: COLOR.marca,
    piezas: [
      { banner: 'verificacion' },
      { texto: `${TITULOS.verificacion}\nLa comunidad chilena para comer mejor, entrenar y avanzar por fases. 🇨🇱` },
      sep(),
      {
        texto:
          '**En corto:** respeto siempre · sin fotos corporales · sin spam ni ventas · Kaibu orienta, no diagnostica.\n' +
          `-# Las reglas completas están en ${canalO(cfg, 'reglas_channel_id', '#reglas')}.`,
      },
      sep(),
      { texto: '**¿Todo claro?** Acepta y se abren todos los canales.', boton: boton('aceptar_reglas', '✅ Acepto las reglas', ButtonStyle.Success) },
    ],
  })
}

/* ---------- Información ---------- */

function panelInformacion(cfg, aprobadas = 0) {
  const c = (clave, texto) => canalO(cfg, clave, texto)
  return mensajeV2({
    acento: COLOR.marca,
    piezas: [
      { banner: 'bienvenida' },
      { texto: `${TITULOS.informacion}\nKaibu es la app chilena para anotar lo que comes y ver tu progreso por fases. El plan, su explicación y el ajuste semanal son **gratis**.` },
      sep(true),
      {
        texto: `## 🧪 Beta privada\n${textoCupos(aprobadas, cfg?.cupo_beta ?? 20)}\n5 preguntas cortas. Si quedas, te llega tu acceso por mensaje privado.`,
        boton: boton('postular_beta', '🧪 Postular', ButtonStyle.Primary),
      },
      sep(),
      {
        texto:
          '## 🧭 Cómo moverte\n' +
          `📣 ${c('anuncios_channel_id', '#anuncios')} avisos · 📍 ${c('roadmap_channel_id', '#roadmap')} versión y lo que viene\n` +
          `🙋 ${c('presentate_channel_id', '#preséntate')} cuéntanos tu meta · 💬 ${c('general_channel_id', '#general')} conversa\n` +
          `☀️ ${c('dato_channel_id', '#dato-del-día')} un dato cada mañana · 🎯 ${c('desafio_channel_id', '#desafío-semanal')} el reto\n` +
          `📈 ${c('progress_channel_id', '#tarjetas-de-progreso')} tus semanas · ❓ ${c('preguntas_channel_id', '#preguntas')} dudas\n` +
          '-# Escribe `/ayuda` para ver todos los comandos.',
      },
      sep(),
      { texto: '## 📍 ¿De dónde eres?\nElige tu región para conocer gente de tu zona.' },
      { menu: menuRegiones() },
      sep(),
      { texto: '## 🔔 Avisos opcionales\nToca para recibir (o dejar de recibir) cada aviso.' },
      { botones: [boton('rol_novedades', '🔔 Novedades'), boton('rol_tiktok', '🎥 Videos nuevos'), boton('rol_lanzamiento', '📣 Lanzamiento')] },
      sep(),
      {
        texto:
          '## ❓ Preguntas frecuentes\n' +
          '**¿Es gratis?** Sí: el plan, el registro y el ajuste semanal.\n' +
          '**¿Reemplaza a un nutricionista?** No: es una guía para ordenarte.\n' +
          '**¿Tengo cuenta y soy beta?** En la app: Más → Comunidad → Generar código, y aquí `/vincular`.',
      },
      { botones: [enlace('Conocer Kaibu', APP_URL)] },
    ],
  })
}

/* ---------- Kaibu hoy (roadmap) ---------- */

const ETAPAS = [
  '🚧 **Etapa 2 · Progreso y hábitos:** recetas propias, recordatorios, suplementos, fotos y medidas, gym con progresión.',
  '📦 **Etapa 3 · Escáner y comunidad:** código de barras, sellos ALTO EN, micronutrientes y alimentos de la comunidad.',
  '🤖 **Etapa 4 · IA y tiendas:** Google Play y App Store, Salud, Kaibu+ y plan para gimnasios y nutris.',
]

function panelRoadmap(novedad = null) {
  const estado = panelEstado(novedad)
  const piezas = [{ banner: 'roadmap' }]
  if (estado) {
    const [hecho, viene, versiones] = estado.campos
    piezas.push(
      { texto: `${TITULOS.roadmap} · ${estado.titulo.replace('📍 Kaibu hoy: ', '')}\n${estado.descripcion.split('\n')[0]}` },
      sep(true),
      { texto: `## ✅ Lo que ya puedes hacer\n${hecho.value}` },
      sep(),
      { texto: `## 🔜 Lo que viene\n${viene.value}` },
      sep(),
      { texto: `## 🗺️ Etapas\n${ETAPAS.join('\n')}` },
      sep(),
      { texto: `-# 🕓 ${versiones.value.split('\n').join(' · ')}\n-# Este mensaje se actualiza solo con cada versión.` },
    )
  } else {
    piezas.push({ texto: `${TITULOS.roadmap}\nLo que viene, etapa por etapa.` }, sep(), { texto: ETAPAS.join('\n') })
  }
  piezas.push({ botones: [enlace('Ver Novedades en la app', `${APP_URL}/novedades`)] })
  return mensajeV2({ acento: COLOR.exito, piezas })
}

/* ---------- Feedback ---------- */

function panelFeedback(cfg) {
  const botones = [
    boton('abrir_bug', '🐛 Reportar bug', ButtonStyle.Danger),
    boton('abrir_sugerencia', '💡 Sugerencia', ButtonStyle.Primary),
    boton('abrir_encuesta', '📊 Encuesta Kaibu+', ButtonStyle.Success),
  ]
  if (process.env.FORM_URL) botones.push(enlace('Encuesta completa', process.env.FORM_URL))
  return mensajeV2({
    acento: COLOR.info,
    piezas: [
      { banner: 'feedback' },
      { texto: `${TITULOS.feedback}\nTu ayuda define el futuro de Kaibu. Todo llega directo al equipo.` },
      sep(true),
      { texto: '**🐛 Bug:** ¿algo falló en la web, la app instalada o el APK? Cuéntanos qué pasó y cómo repetirlo.' },
      { texto: `**💡 Sugerencia:** la comunidad la vota en ${canalO(cfg, 'suggestions_channel_id', '#sugerencias')}.` },
      { texto: '**📊 Encuesta:** 1 minuto para decidir qué extras y a qué precio.' },
      { botones },
      sep(),
      { texto: '-# 📱 También puedes enviar reportes y sugerencias desde la app: Más → Comunidad, incluso sin conexión.' },
    ],
  })
}

/* ---------- Plantillas de los canales ---------- */

const bloqueCodigo = (lineas) => `\`\`\`\n${lineas.join('\n')}\n\`\`\``

function panelPresentate() {
  return mensajeV2({
    acento: COLOR.ambar,
    piezas: [
      { texto: `${TITULOS.presentate}\n¡Queremos conocerte! Cuéntanos quién eres y qué meta tienes.` },
      sep(),
      { texto: '**La forma rápida:** toca el botón, llena 5 datos y el bot publica tu tarjeta con un hilo para saludarte.', boton: boton('presentarme', '🙋 Presentarme', ButtonStyle.Primary) },
      sep(),
      {
        texto:
          '**O escribe tu mensaje con esta plantilla:**\n' +
          bloqueCodigo(['👋 Nombre o apodo:', '📍 Comuna o región:', '🎯 Meta (bajar, mantener o subir):', '🏋️ Días de gym por semana:', '🍲 Comida chilena favorita:']),
      },
      { texto: '-# Saluda a quien se presente: un 👋 hace la diferencia.' },
    ],
  })
}

function panelRecetas() {
  return mensajeV2({
    acento: COLOR.exito,
    piezas: [
      { texto: `${TITULOS.recetas}\nComparte tus preparaciones: lo casero, lo fit y lo de la abuela con un giro.` },
      sep(),
      {
        texto:
          '**Plantilla para compartir una receta:**\n' +
          bloqueCodigo(['🍽️ Plato:', '👥 Porciones:', '🧾 Ingredientes (con gramos):', '🔥 Kcal y proteína por porción:', '💡 Tip fit:']),
      },
      { texto: '-# Calcula cada ingrediente con `/alimento` (ej.: `/alimento arroz blanco cocido`) y súmalos.' },
    ],
  })
}

function panelGym() {
  return mensajeV2({
    acento: COLOR.marca,
    piezas: [
      { texto: `${TITULOS.gym}\nRutinas, técnica y tus PR. Aquí celebramos cada kilo extra en la barra.` },
      sep(),
      {
        texto:
          '**Plantilla para tu PR o tu sesión:**\n' +
          bloqueCodigo(['🏋️ Ejercicio:', '📈 Hoy: __ kg × __ reps (antes: __ kg × __)', '😮‍💨 ¿Cómo te sentiste? (1 a 10):', '🎯 Próxima meta:']),
      },
      { texto: '-# ¿Cuánto subir la próxima vez? Prueba `/progresion-gym`.' },
    ],
  })
}

function panelPreguntas() {
  return mensajeV2({
    acento: COLOR.info,
    piezas: [
      { texto: `${TITULOS.preguntas}\nNo hay preguntas tontas: todos empezamos sin saber.` },
      sep(),
      {
        texto:
          '**Para que te respondan mejor:**\n' +
          '1. Di tu meta (bajar, mantener o subir) y cuántos días entrenas.\n' +
          '2. Cuenta qué probaste y qué pasó.\n' +
          '3. Si es de la app, di si usas web, app instalada o APK.',
      },
      sep(),
      { texto: '**Atajos:** `/alimento` kcal y proteína de cualquier comida · `/calcular-plan` tu meta de kcal · `/verificar-etiqueta` revisa una etiqueta.' },
      { texto: '-# Las respuestas de la comunidad son orientación, no consejo médico.' },
    ],
  })
}

function panelProgreso() {
  return mensajeV2({
    acento: COLOR.exito,
    piezas: [
      { texto: `${TITULOS.progreso}\nTus semanas y tus rachas, para celebrarlas en comunidad.` },
      sep(),
      {
        texto:
          '**Cómo publicar tu semana:**\n' +
          '1. Vincula tu cuenta (Más → Comunidad → Generar código, y aquí `/vincular`).\n' +
          '2. En la app: Progreso → Compartir mi semana → **Publicar en Discord**.\n' +
          '3. El bot la publica aquí. Tu peso solo aparece si lo activas.',
      },
      { texto: '-# 🔥 Al llegar a 7 y ⚡ a 30 días seguidos, el bot te celebra aquí mismo.' },
    ],
  })
}

const PLANTILLAS = { presentate: panelPresentate, recetas: panelRecetas, gym: panelGym, preguntas: panelPreguntas, progreso: panelProgreso }

module.exports = {
  TITULOS,
  ESENCIALES,
  panelReglas,
  panelVerificacion,
  panelInformacion,
  panelRoadmap,
  panelFeedback,
  PLANTILLAS,
}
