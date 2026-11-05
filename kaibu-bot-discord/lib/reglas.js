// Reglas puras de la comunidad conectada (sin Discord ni Supabase): fáciles de probar.

const DIA_MS = 24 * 60 * 60 * 1000
const DIAS_SEGUIMIENTO = [1, 3, 7, 14]
const DIAS_INACTIVO = 5
const MAX_VERSION = 40

/** Fecha de hoy en Chile (YYYY-MM-DD): el día termina a medianoche chilena, no en UTC. */
function hoyChile(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora)
}

/** Días de calendario entre dos fechas YYYY-MM-DD. */
function diasEntre(desde, hasta) {
  return Math.round((Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / DIA_MS)
}

/** Día de seguimiento que toca mandar (1, 3, 7 o 14) o null. Si se saltó alguno, solo el más reciente. */
function proximoSeguimiento(diasAprobado, ultimoEnviado) {
  const pendientes = DIAS_SEGUIMIENTO.filter((d) => d <= diasAprobado && d > ultimoEnviado)
  return pendientes.length ? pendientes[pendientes.length - 1] : null
}

const MENSAJE_SEGUIMIENTO = {
  1: '👋 ¡Hola! ¿Pudiste anotar tu primera comida en **Kaibu**? Si algo no se entendió, cuéntanos tal cual, sin filtro: para eso es la beta. Puedes responder en el chat de beta testers o desde la app (Más → Comunidad).',
  3: '💡 **Dato de la beta:** si un día comes parecido al anterior, en **Agregar** usa **Copiar de ayer** y anotas todo en un toque. Y si te olvidas, activa el recordatorio de las 21:00 en Más → Comunidad.',
  7: '🎉 **¡Una semana con Kaibu!** Si quieres, comparte tu semana en #tarjetas-de-progreso (Progreso → Compartir mi semana → Publicar en Discord). ¿Qué es lo que más te ha costado hasta ahora?',
  14: '🏁 **¡Terminaste las 2 semanas de la beta!** Te pedimos 2 minutos para la encuesta final: botón **📊 Encuesta** en el centro de feedback. Tu opinión decide qué construimos ahora. ¡Gracias por ayudar a Kaibu! 🙌',
}

/** Recordatorio de las 21:00: solo si la persona lo activó, no anotó hoy y no se le recordó hoy. */
function debeRecordar(fila, hoy) {
  return Boolean(fila.recordatorio) && !fila.anoto_hoy && fila.recordado_el !== hoy
}

/** Texto del contador de cupos del panel de bienvenida. */
function textoCupos(aprobadas, total) {
  const quedan = Math.max(0, total - aprobadas)
  if (quedan === 0) return '🔴 Cupos llenos: si postulas quedas en lista de espera'
  if (quedan === 1) return '🟠 ¡Queda **1** cupo!'
  return `🟢 Quedan **${quedan} de ${total}** cupos`
}

/** Días sin anotar: desde el último registro o, si nunca anotó, desde que lo aprobaron. */
function diasSinAnotar(ultimoRegistro, hoy, aprobadoEl) {
  return diasEntre(ultimoRegistro ?? aprobadoEl, hoy)
}

/** Avisar al equipo cuando un tester lleva 5 días sin anotar; una vez por cada racha de inactividad. */
function debeAvisarInactivo({ hoy, aprobadoEl, ultimoRegistro, avisadoEl }) {
  if (diasSinAnotar(ultimoRegistro, hoy, aprobadoEl) < DIAS_INACTIVO) return false
  if (!avisadoEl) return true
  // Solo si volvió a anotar después del último aviso (empezó una racha de inactividad nueva).
  return Boolean(ultimoRegistro) && ultimoRegistro > avisadoEl
}

const decimalCL = (n) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${Math.abs(n).toFixed(1).replace('.', ',')}`
const dias = (n) => `${n} ${n === 1 ? 'día' : 'días'}`

/** Contenido de la tarjeta "Mi semana" que se publica en #progreso (el peso solo si viene). */
function datosTarjetaSemana(s) {
  const semana = s.periodo === 'semana'
  const campos = [
    { name: '📅 Días anotados', value: `**${s.dias_anotados}** de ${dias(s.dias_total)}` },
    { name: '🔥 Calorías en rango', value: `**${s.dias_kcal}** de ${dias(s.dias_total)}` },
    { name: '🥩 Proteína cumplida', value: `**${s.dias_proteina}** de ${dias(s.dias_total)}` },
    { name: '⚡ Racha', value: dias(s.racha) },
  ]
  if (s.kg_avanzados !== null && s.kg_avanzados !== undefined) campos.push({ name: '📉 Avance', value: `${decimalCL(Number(s.kg_avanzados))} kg en esta fase` })
  if (s.peso_kg !== null && s.peso_kg !== undefined) campos.push({ name: '⚖️ Peso promedio', value: `${Number(s.peso_kg).toFixed(1).replace('.', ',')} kg` })
  const barra = semana ? '🟩'.repeat(s.dias_kcal) + '⬛'.repeat(Math.max(0, s.dias_total - s.dias_kcal)) : null
  return { titulo: semana ? 'Mi semana con Kaibu' : 'Mi mes con Kaibu', campos, barra }
}

/** ¿Hay una versión GRANDE nueva para anunciar en #novedades? Solo las marcadas con "anunciar: true". */
function novedadPendiente(novedad, anunciada) {
  if (!novedad || typeof novedad.version !== 'string') return false
  if (novedad.anunciar !== true) return false
  if (novedad.version.length === 0 || novedad.version.length > MAX_VERSION) return false
  if (!Array.isArray(novedad.puntos) || novedad.puntos.length === 0) return false
  return novedad.version !== anunciada
}

/** Rachas (7 o 30) cuyos roles se acaban de poner. */
function rachasNuevas(rolesPuestos, cfg) {
  const r = []
  if (cfg.racha7_role_id && rolesPuestos.includes(cfg.racha7_role_id)) r.push(7)
  if (cfg.racha30_role_id && rolesPuestos.includes(cfg.racha30_role_id)) r.push(30)
  return r
}

const AVISO_ESTADO = {
  en_sprint: '🛠️ Tu reporte entró al sprint: lo estamos arreglando.',
  resuelto: '✅ Tu reporte quedó resuelto en Kaibu. ¡Gracias por avisar!',
  planificada: '📋 Tu sugerencia quedó planificada en la hoja de ruta.',
  aprobada: '✅ Tu sugerencia fue aprobada para construirla.',
  fuera_alcance: '⛔ Tu sugerencia quedó fuera de alcance por ahora. La guardamos para más adelante.',
}

/** Mensaje privado cuando el equipo cambia el estado de algo que enviaste (null = no avisar). */
function textoAvisoEstado(estado, tipo, titulo) {
  const base = AVISO_ESTADO[estado]
  if (!base) return null
  const que = titulo ? ` **"${String(titulo).slice(0, 100)}"**` : ''
  return `${base}${que ? `\n${tipo === 'bug' ? 'Reporte' : 'Sugerencia'}:${que}` : ''}\n_Puedes apagar estos avisos en la app: Más → Comunidad._`
}

/** Elemento de la lista que toca hoy (uno distinto cada día, vuelve a empezar al terminar). */
function datoDelDia(fecha, lista) {
  const dia = Math.floor(Date.parse(`${fecha}T12:00:00Z`) / DIA_MS)
  return lista[((dia % lista.length) + lista.length) % lista.length]
}

/** Lunes de la semana de una fecha YYYY-MM-DD. */
function lunesDe(fecha) {
  const d = new Date(`${fecha}T12:00:00Z`)
  const desdeLunes = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - desdeLunes)
  return d.toISOString().slice(0, 10)
}

/** Desafío de la semana que empieza en ese lunes (rota cada semana). */
function desafioDeLaSemana(lunes, lista) {
  const semana = Math.floor(Date.parse(`${lunes}T12:00:00Z`) / (7 * DIA_MS))
  return lista[((semana % lista.length) + lista.length) % lista.length]
}

const HOSTS_VIDEO = new Set(['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'instagram.com', 'www.instagram.com', 'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'])

/** Solo links https de TikTok, Instagram o YouTube para #kaibu-en-redes. */
function urlVideoValida(texto) {
  try {
    const u = new URL(String(texto).trim())
    return u.protocol === 'https:' && HOSTS_VIDEO.has(u.hostname.toLowerCase())
  } catch {
    return false
  }
}

const MAX_NOMBRE_BANNER = 22

/** Nombre para el banner de bienvenida (los muy largos se acortan). */
function nombreBanner(nombre) {
  const t = String(nombre ?? '').trim()
  return t.length <= MAX_NOMBRE_BANNER ? t : `${t.slice(0, MAX_NOMBRE_BANNER - 2)}…`
}

/** Inicial para cuando la persona no tiene foto de perfil. */
function inicial(nombre) {
  const letra = String(nombre ?? '').trim().charAt(0)
  return letra ? letra.toLocaleUpperCase('es-CL') : 'K'
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const fechaLarga = (f) => {
  const [a, m, d] = String(f).split('-').map(Number)
  return a && m && d ? `${d} de ${MESES[m - 1]} de ${a}` : String(f ?? '')
}
const legible = (v) => {
  const [base, etiqueta] = String(v).split('-')
  return etiqueta ? `${base} · ${etiqueta}` : String(v)
}
const lista = (items, max) => {
  let texto = ''
  for (const i of items ?? []) {
    const linea = `• ${String(i).slice(0, 200)}\n`
    if ((texto + linea).length > max) break
    texto += linea
  }
  return texto.trim() || '—'
}

/** Contenido del embed fijo "Kaibu hoy" (se edita solo cuando cambia novedades.json). null si no hay datos. */
function panelEstado(n) {
  if (!n || typeof n.version !== 'string' || !Array.isArray(n.puntos)) return null
  const versiones = (n.versiones ?? []).slice(0, 8).map((v) => `${legible(v.version)} · ${v.titulo} (${fechaLarga(v.fecha)})`)
  return {
    titulo: `📍 Kaibu hoy: versión ${legible(n.version)}`,
    descripcion: `${n.titulo ?? ''} · ${fechaLarga(n.fecha)}\nEste mensaje se actualiza solo con cada versión.`,
    campos: [
      { name: '✅ Lo que ya puedes hacer', value: lista(n.puntos, 1024) },
      { name: '🔜 Lo que viene', value: lista(n.en_camino, 1024) },
      { name: '🕓 Versiones', value: versiones.join('\n').slice(0, 1024) || '—' },
    ],
  }
}

module.exports = {
  panelEstado,
  datoDelDia, lunesDe, desafioDeLaSemana, urlVideoValida, nombreBanner, inicial,
  hoyChile, diasEntre, proximoSeguimiento, MENSAJE_SEGUIMIENTO, debeRecordar, textoCupos,
  diasSinAnotar, debeAvisarInactivo, datosTarjetaSemana, novedadPendiente, rachasNuevas, textoAvisoEstado, DIAS_INACTIVO,
}
