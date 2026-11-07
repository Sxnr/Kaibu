// Servidor reorganizado: dato del día, desafío semanal, links de videos, banner de bienvenida y permisos nuevos.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { datoDelDia, lunesDe, desafioDeLaSemana, urlVideoValida, nombreBanner, inicial } = require('../lib/reglas')
const { DATOS, DESAFIOS } = require('../lib/contenido')
const { permisosCanal } = require('../lib/permisos')

test('hay 60 datos del día y 12 desafíos, sin repetirse y de largo razonable', () => {
  assert.equal(DATOS.length, 60)
  assert.equal(new Set(DATOS.map((d) => d.texto)).size, 60)
  for (const d of DATOS) {
    assert.ok(d.titulo.length > 3 && d.titulo.length <= 80, d.titulo)
    assert.ok(d.texto.length > 30 && d.texto.length <= 400, d.titulo)
  }
  assert.equal(DESAFIOS.length, 12)
  for (const d of DESAFIOS) assert.ok(d.titulo && d.detalle.length > 20)
})

test('datoDelDia: uno distinto cada día y vuelve a empezar después de 60', () => {
  const a = datoDelDia('2026-11-05', DATOS)
  const b = datoDelDia('2026-11-06', DATOS)
  assert.notEqual(a, b)
  assert.equal(datoDelDia('2027-01-04', DATOS), a) // 60 días después
})

test('lunesDe: el lunes de la semana (en Chile la semana parte el lunes)', () => {
  assert.equal(lunesDe('2026-11-05'), '2026-11-02') // jueves
  assert.equal(lunesDe('2026-11-02'), '2026-11-02') // lunes
  assert.equal(lunesDe('2026-11-08'), '2026-11-02') // domingo
})

test('desafioDeLaSemana: cambia cada semana', () => {
  assert.notEqual(desafioDeLaSemana('2026-11-02', DESAFIOS), desafioDeLaSemana('2026-11-09', DESAFIOS))
  assert.equal(desafioDeLaSemana('2026-11-02', DESAFIOS), desafioDeLaSemana('2027-01-25', DESAFIOS)) // 12 semanas después
})

test('urlVideoValida: solo links https de TikTok, Instagram y YouTube', () => {
  assert.equal(urlVideoValida('https://www.tiktok.com/@kaibu.app/video/123'), true)
  assert.equal(urlVideoValida('https://vm.tiktok.com/ZM123/'), true)
  assert.equal(urlVideoValida('https://www.instagram.com/reel/abc/'), true)
  assert.equal(urlVideoValida('https://youtube.com/shorts/abc'), true)
  assert.equal(urlVideoValida('https://youtu.be/abc'), true)
  assert.equal(urlVideoValida('http://www.tiktok.com/x'), false)
  assert.equal(urlVideoValida('https://tiktok.com.malo.cl/x'), false)
  assert.equal(urlVideoValida('no es un link'), false)
})

test('nombreBanner e inicial: nombres largos se acortan y siempre hay inicial', () => {
  assert.equal(nombreBanner('ana_fit'), 'ana_fit')
  assert.equal(nombreBanner('un_nombre_larguisimo_de_discord_32'), 'un_nombre_larguisimo…')
  assert.equal(inicial('ana_fit'), 'A')
  assert.equal(inicial('  '), 'K')
  assert.equal(inicial('ñandú'), 'Ñ')
})

const ids = { everyone: 'E', bot: 'B', miembro: 'M', tester: 'T', equipo: 'Q' }
const de = (lista, id) => lista.find((o) => o.id === id) ?? { allow: [], deny: [] }

test('publicoLectura: lo ve también quien recién entra (bienvenidas y reglas), nadie escribe', () => {
  const p = permisosCanal('publicoLectura', ids)
  assert.ok(de(p, 'E').allow.includes('ViewChannel'))
  assert.ok(de(p, 'E').deny.includes('SendMessages'))
  assert.ok(!de(p, 'M').deny.includes('ViewChannel'))
})

test('voz: solo miembros verificados pueden entrar y hablar', () => {
  const p = permisosCanal('voz', ids)
  assert.ok(de(p, 'E').deny.includes('ViewChannel'))
  for (const permiso of ['ViewChannel', 'Connect', 'Speak']) assert.ok(de(p, 'M').allow.includes(permiso), permiso)
})

test('comunidadLectura: los miembros pueden reaccionar (desafío semanal)', () => {
  assert.ok(de(permisosCanal('comunidadLectura', ids), 'M').allow.includes('AddReactions'))
})

test('panelEstado: versión actual, funciones, lo que viene e historial (para el embed fijo que se edita solo)', () => {
  const { panelEstado } = require('../lib/reglas')
  const p = panelEstado({
    version: '0.2.0-beta', fecha: '2026-11-03', titulo: 'Beta privada', puntos: ['Agua del día', 'Tu semana'],
    en_camino: ['Micronutrientes', 'Escáner de etiquetas'],
    versiones: [{ version: '0.2.0-beta', fecha: '2026-11-03', titulo: 'Beta privada' }, { version: '0.1.0', fecha: '2026-10-29', titulo: 'Primera versión' }],
  })
  assert.equal(p.titulo, '📍 Kaibu hoy: versión 0.2.0 · beta')
  assert.match(p.descripcion, /Beta privada · 3 de noviembre de 2026/)
  assert.deepEqual(p.campos.map((c) => c.name), ['✅ Lo que ya puedes hacer', '🔜 Lo que viene', '🕓 Versiones'])
  assert.match(p.campos[0].value, /• Agua del día\n• Tu semana/)
  assert.match(p.campos[2].value, /0\.1\.0 · Primera versión/)
  for (const c of p.campos) assert.ok(c.value.length <= 1024)
  // Sin datos (la app aún no publica novedades.json): no hay panel
  assert.equal(panelEstado(null), null)
  assert.equal(panelEstado({ version: 'x' }), null)
})

test('posicionesServidor: las categorías quedan en el orden de la lista (Kaibu al día arriba) y los canales en el suyo', () => {
  const { posicionesServidor } = require('../lib/reglas')
  const p = posicionesServidor([
    { categoria: 'C1', canales: ['a', 'b'] },
    { categoria: 'C2', canales: ['c'] },
    { categoria: 'C3', canales: [] },
  ])
  assert.deepEqual(p, [
    { channel: 'C1', position: 0 },
    { channel: 'C2', position: 1 },
    { channel: 'C3', position: 2 },
    { channel: 'a', position: 0 },
    { channel: 'b', position: 1 },
    { channel: 'c', position: 0 },
  ])
})

test('ESTRUCTURA: "Kaibu al día" va justo después de "Empieza aquí", antes de la comunidad', () => {
  const { ESTRUCTURA } = require('../lib/servidor')
  const nombres = ESTRUCTURA.map((c) => c.nombre)
  assert.equal(nombres.indexOf('📣 KAIBU AL DÍA'), 1)
  assert.ok(nombres.indexOf('📣 KAIBU AL DÍA') < nombres.indexOf('💪 COMUNIDAD & PROGRESO'))
})
