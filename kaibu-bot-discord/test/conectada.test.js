// Reglas de la comunidad conectada: seguimiento de testers, recordatorio, cupos, inactividad, tarjeta y novedades.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  hoyChile, diasEntre, proximoSeguimiento, MENSAJE_SEGUIMIENTO, debeRecordar, textoCupos,
  diasSinAnotar, debeAvisarInactivo, datosTarjetaSemana, novedadPendiente, rachasNuevas,
} = require('../lib/reglas')

test('hoyChile: usa la fecha de Chile, no la UTC', () => {
  // 02:00 UTC del 6 de noviembre = 23:00 del 5 de noviembre en Chile (UTC-3)
  assert.equal(hoyChile(new Date('2026-11-06T02:00:00Z')), '2026-11-05')
  assert.equal(hoyChile(new Date('2026-11-06T15:00:00Z')), '2026-11-06')
})

test('diasEntre: días completos de calendario entre dos fechas', () => {
  assert.equal(diasEntre('2026-11-01', '2026-11-01'), 0)
  assert.equal(diasEntre('2026-11-01', '2026-11-08'), 7)
  assert.equal(diasEntre('2026-10-30', '2026-11-02'), 3)
})

test('proximoSeguimiento: manda el mensaje del día que corresponde, una sola vez', () => {
  assert.equal(proximoSeguimiento(0, 0), null)
  assert.equal(proximoSeguimiento(1, 0), 1)
  assert.equal(proximoSeguimiento(2, 1), null)
  assert.equal(proximoSeguimiento(3, 1), 3)
  assert.equal(proximoSeguimiento(7, 3), 7)
  assert.equal(proximoSeguimiento(14, 7), 14)
  assert.equal(proximoSeguimiento(20, 14), null)
})

test('proximoSeguimiento: si el bot estuvo apagado, manda solo el más reciente (no 3 mensajes seguidos)', () => {
  assert.equal(proximoSeguimiento(8, 0), 7)
  assert.equal(proximoSeguimiento(4, 0), 3)
})

test('hay un mensaje para cada día de seguimiento', () => {
  for (const d of [1, 3, 7, 14]) assert.ok(MENSAJE_SEGUIMIENTO[d]?.length > 20, `falta el día ${d}`)
})

test('debeRecordar: solo si lo activó, no anotó hoy y no se le recordó hoy', () => {
  const hoy = '2026-11-05'
  assert.equal(debeRecordar({ recordatorio: true, anoto_hoy: false, recordado_el: null }, hoy), true)
  assert.equal(debeRecordar({ recordatorio: false, anoto_hoy: false, recordado_el: null }, hoy), false)
  assert.equal(debeRecordar({ recordatorio: true, anoto_hoy: true, recordado_el: null }, hoy), false)
  assert.equal(debeRecordar({ recordatorio: true, anoto_hoy: false, recordado_el: hoy }, hoy), false)
  assert.equal(debeRecordar({ recordatorio: true, anoto_hoy: false, recordado_el: '2026-11-04' }, hoy), true)
})

test('textoCupos: cuántos quedan, o lista de espera si está lleno', () => {
  assert.equal(textoCupos(0, 20), '🟢 Quedan **20 de 20** cupos')
  assert.equal(textoCupos(8, 20), '🟢 Quedan **12 de 20** cupos')
  assert.equal(textoCupos(19, 20), '🟠 ¡Queda **1** cupo!')
  assert.equal(textoCupos(20, 20), '🔴 Cupos llenos: si postulas quedas en lista de espera')
  assert.equal(textoCupos(25, 20), '🔴 Cupos llenos: si postulas quedas en lista de espera')
})

test('diasSinAnotar: desde su último registro, o desde que lo aprobaron si nunca anotó', () => {
  assert.equal(diasSinAnotar('2026-11-01', '2026-11-05', '2026-10-20'), 4)
  assert.equal(diasSinAnotar(null, '2026-11-05', '2026-10-31'), 5)
})

test('debeAvisarInactivo: con 5 días sin anotar, una vez por cada racha de inactividad', () => {
  const base = { hoy: '2026-11-10', aprobadoEl: '2026-11-01' }
  assert.equal(debeAvisarInactivo({ ...base, ultimoRegistro: '2026-11-06', avisadoEl: null }), false)
  assert.equal(debeAvisarInactivo({ ...base, ultimoRegistro: '2026-11-05', avisadoEl: null }), true)
  // Ya se avisó y no ha vuelto a anotar: no repetir
  assert.equal(debeAvisarInactivo({ ...base, ultimoRegistro: '2026-11-05', avisadoEl: '2026-11-10' }), false)
  // Volvió a anotar después del aviso y otra vez dejó de hacerlo: se avisa de nuevo
  assert.equal(debeAvisarInactivo({ hoy: '2026-11-20', aprobadoEl: '2026-11-01', ultimoRegistro: '2026-11-14', avisadoEl: '2026-11-10' }), true)
  // Nunca anotó: cuenta desde la aprobación
  assert.equal(debeAvisarInactivo({ ...base, ultimoRegistro: null, avisadoEl: null }), true)
})

test('datosTarjetaSemana: números de la semana y el peso solo si la persona lo activó', () => {
  const t = datosTarjetaSemana({ periodo: 'semana', dias_anotados: 5, dias_total: 7, dias_kcal: 4, dias_proteina: 3, racha: 12, kg_avanzados: null, peso_kg: null })
  assert.equal(t.titulo, 'Mi semana con Kaibu')
  assert.deepEqual(t.campos.map((c) => c.name), ['📅 Días anotados', '🔥 Calorías en rango', '🥩 Proteína cumplida', '⚡ Racha'])
  assert.equal(t.campos[1].value, '**4** de 7 días')
  assert.equal(t.barra, '🟩🟩🟩🟩⬛⬛⬛')
  const conPeso = datosTarjetaSemana({ periodo: 'mes', dias_anotados: 20, dias_total: 30, dias_kcal: 15, dias_proteina: 12, racha: 1, kg_avanzados: -2.4, peso_kg: 68.5 })
  assert.equal(conPeso.titulo, 'Mi mes con Kaibu')
  assert.ok(conPeso.campos.some((c) => c.value === '−2,4 kg en esta fase'))
  assert.ok(conPeso.campos.some((c) => c.value === '68,5 kg'))
  assert.equal(conPeso.barra, null, 'la barra solo es para la semana')
  assert.equal(conPeso.campos.find((c) => c.name === '⚡ Racha').value, '1 día')
})

test('novedadPendiente: anuncia solo versiones grandes marcadas para anunciar, una vez', () => {
  assert.equal(novedadPendiente({ version: '0.3.0-beta', anunciar: true, puntos: ['a'] }, '0.2.0-beta'), true)
  // Cambios chicos (sin "anunciar") nunca se anuncian: evita el spam de cada subida al repositorio.
  assert.equal(novedadPendiente({ version: '0.3.0-beta', puntos: ['a'] }, '0.2.0-beta'), false)
  assert.equal(novedadPendiente({ version: '0.3.0-beta', anunciar: false, puntos: ['a'] }, null), false)
  assert.equal(novedadPendiente({ version: '0.2.0-beta', anunciar: true, puntos: ['a'] }, '0.2.0-beta'), false)
  assert.equal(novedadPendiente({ version: '0.3.0-beta', anunciar: true, puntos: [] }, null), false)
  assert.equal(novedadPendiente(null, null), false)
  assert.equal(novedadPendiente({ version: 'x'.repeat(50), anunciar: true, puntos: ['a'] }, null), false)
})

test('rachasNuevas: celebra solo los roles de racha que recién se ganaron', () => {
  const cfg = { racha7_role_id: 'R7', racha30_role_id: 'R30', atleta_role_id: 'A' }
  assert.deepEqual(rachasNuevas(['A', 'R7'], cfg), [7])
  assert.deepEqual(rachasNuevas(['R30'], cfg), [30])
  assert.deepEqual(rachasNuevas(['A'], cfg), [])
})

test('textoAvisoEstado: mensaje claro según el estado, y nada para estados internos', () => {
  const { textoAvisoEstado } = require('../lib/reglas')
  assert.match(textoAvisoEstado('resuelto', 'bug', null), /resuelto/i)
  assert.match(textoAvisoEstado('aprobada', 'sugerencia', 'Modo oscuro'), /Modo oscuro/)
  assert.match(textoAvisoEstado('fuera_alcance', 'sugerencia', 'Algo'), /por ahora/i)
  assert.match(textoAvisoEstado('en_sprint', 'bug', null), /sprint/i)
  assert.equal(textoAvisoEstado('publicado', 'bug', null), null)
  assert.equal(textoAvisoEstado('enviado', 'sugerencia', 'x'), null)
})
