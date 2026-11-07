// Discord 2.0: paneles con el formato nuevo, regiones, /alimento, presentaciones, invitaciones,
// encuesta semanal, comunidad de Discord, /ayuda, /anuncio, comandos y descripciones de canales.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { MessageFlags } = require('discord.js')
const P = require('../lib/paneles')
const { medirV2, mensajeV2 } = require('../lib/v2')

const cfg = {
  reglas_channel_id: '111', welcome_channel_id: '112', presentate_channel_id: '113', suggestions_channel_id: '114',
  updates_role_id: '901', tiktok_role_id: '902', lanzamiento_role_id: '903', cupo_beta: 20,
}
const novedad = {
  version: '0.2.1-beta', fecha: '2026-11-07', titulo: 'Catálogo ampliado', puntos: ['Platos fit', 'Cadenas'], en_camino: ['Recetas propias'],
  versiones: [{ version: '0.2.1-beta', titulo: 'Catálogo ampliado', fecha: '2026-11-07' }, { version: '0.2.0-beta', titulo: 'Beta privada', fecha: '2026-11-03' }],
}

/** Todos los custom_id del mensaje (Discord exige que no se repitan). */
function idsDe(mensaje) {
  const ids = []
  const recorrer = (n) => {
    if (!n || typeof n !== 'object') return
    if (Array.isArray(n)) return n.forEach(recorrer)
    if (n.custom_id) ids.push(n.custom_id)
    recorrer(n.components)
    recorrer(n.accessory)
  }
  recorrer(mensaje.components.map((c) => c.toJSON()))
  return ids
}

const textoDe = (m) => JSON.stringify(m.components.map((c) => c.toJSON()))

const todosLosPaneles = () => ({
  reglas: P.panelReglas(),
  verificacion: P.panelVerificacion(cfg),
  informacion: P.panelInformacion(cfg, 5),
  roadmap: P.panelRoadmap(novedad),
  roadmapSinDatos: P.panelRoadmap(null),
  feedback: P.panelFeedback(cfg),
  ...Object.fromEntries(Object.entries(P.PLANTILLAS).map(([k, f]) => [k, f()])),
})

test('cada panel usa el formato nuevo y cabe en los límites de Discord, sin ids repetidos', () => {
  for (const [nombre, m] of Object.entries(todosLosPaneles())) {
    assert.equal(m.flags, MessageFlags.IsComponentsV2, nombre)
    const medida = medirV2(m)
    assert.ok(medida.cabe, `${nombre}: ${JSON.stringify(medida)}`)
    const ids = idsDe(m)
    assert.equal(new Set(ids).size, ids.length, `${nombre} repite un id`)
    assert.deepEqual(m.allowedMentions, { parse: [] }, `${nombre} no debe mencionar a nadie`)
  }
})

test('cada panel lleva su título (así el bot lo encuentra para editarlo en vez de duplicarlo)', () => {
  const paneles = todosLosPaneles()
  for (const clave of ['reglas', 'verificacion', 'informacion', 'roadmap', 'feedback', 'presentate', 'recetas', 'gym', 'preguntas', 'progreso']) {
    assert.ok(textoDe(paneles[clave]).includes(P.TITULOS[clave]), clave)
  }
})

test('reglas: 8 reglas esenciales numeradas, salud con Salud Responde y moderación por pasos', () => {
  const texto = textoDe(P.panelReglas())
  assert.equal(P.ESENCIALES.length, 8)
  for (let i = 1; i <= 8; i++) assert.ok(texto.includes(`${i}. **`), `falta la regla ${i}`)
  assert.ok(texto.includes('Salud Responde: 600 360 7777'))
  assert.ok(texto.includes('Silencio de 24 horas'))
})

test('información: botones de beta, avisos y el menú de regiones', () => {
  const ids = idsDe(P.panelInformacion(cfg, 3))
  for (const id of ['postular_beta', 'rol_novedades', 'rol_tiktok', 'rol_lanzamiento', 'elegir_region']) assert.ok(ids.includes(id), id)
})

test('roadmap: muestra la versión, lo que ya se puede hacer y lo que viene', () => {
  const texto = textoDe(P.panelRoadmap(novedad))
  for (const parte of ['0.2.1 · beta', 'Platos fit', 'Recetas propias', 'Lo que viene', 'Etapas']) assert.ok(texto.includes(parte), parte)
})

test('preséntate: botón "Presentarme" y plantilla para copiar', () => {
  const m = P.PLANTILLAS.presentate()
  assert.ok(idsDe(m).includes('presentarme'))
  assert.ok(textoDe(m).includes('Comida chilena favorita'))
})

test('v2: mide componentes y texto, y avisa cuando no cabe', () => {
  const grande = mensajeV2({ acento: '#B3202A', piezas: Array.from({ length: 41 }, () => ({ texto: 'x' })) })
  assert.equal(medirV2(grande).cabe, false)
  const largo = mensajeV2({ acento: '#B3202A', piezas: [{ texto: 'a'.repeat(2500) }, { texto: 'b'.repeat(2500) }] })
  assert.equal(medirV2(largo).cabe, false)
})

test('regiones: 16 regiones de Chile + otro país, y elegir una reemplaza la anterior', () => {
  const { REGIONES, menuRegiones, cambioDeRegion, nombreRol } = require('../lib/regiones')
  assert.equal(REGIONES.length, 17)
  assert.equal(menuRegiones().toJSON().options.length, 17)
  assert.equal(nombreRol(REGIONES.find((r) => r.valor === 'metropolitana')), '📍 Metropolitana')
  assert.equal(nombreRol(REGIONES.find((r) => r.valor === 'otro')), '🌎 Otro país')
  const roles = new Map(REGIONES.map((r, i) => [nombreRol(r), `r${i}`]))
  const actuales = new Set(['r0', 'x'])
  const c = cambioDeRegion('biobio', actuales, roles)
  assert.equal(c.poner, roles.get('📍 Biobío'))
  assert.deepEqual(c.quitar, ['r0'])
  assert.equal(cambioDeRegion('no-existe', actuales, roles), null)
})

test('búsqueda: sinónimos, plurales y marca, igual que la app', () => {
  const { buscarAlimentos, porPorcion } = require('../lib/busqueda')
  const lista = [
    { n: 'Cazuela de ave', k: 71, p: 4.7, c: 6, g: 3, pn: '1 plato', pg: 450 },
    { n: 'Porotos cocidos', k: 127, p: 8.7, c: 22.8, g: 0.5, pn: '1 taza', pg: 170 },
    { n: 'Protein + Vainilla', m: 'Soprole', k: 68, p: 6.6, c: 7, g: 1, pn: '155 g', pg: 155 },
    { n: 'Harina de maíz precocida', k: 363, p: 8.5, c: 76.6, g: 3.7, pn: '1/2 taza', pg: 60, a: ['harina pan'] },
  ]
  assert.equal(buscarAlimentos(lista, 'cazuela')[0].n, 'Cazuela de ave')
  assert.equal(buscarAlimentos(lista, 'frijoles')[0].n, 'Porotos cocidos')
  assert.equal(buscarAlimentos(lista, 'soprole proteína')[0].m, 'Soprole')
  assert.equal(buscarAlimentos(lista, 'harina pan')[0].n, 'Harina de maíz precocida')
  assert.deepEqual(buscarAlimentos(lista, 'sushi'), [])
  assert.deepEqual(porPorcion(lista[0]), { kcal: 320, proteina: 21.2, carbos: 27, grasas: 13.5 })
})

test('/alimento: tarjeta con kcal por porción, por 100 g, fuente y botón para anotarlo', () => {
  const { tarjetaAlimento } = require('../lib/alimentos')
  const m = tarjetaAlimento({ n: 'Arroz con pollo (arroz y pechuga)', k: 153, p: 14.7, c: 15.9, g: 2.8, pn: '1 plato', pg: 283, f: 'Receta Kaibu' })
  const texto = textoDe(m)
  assert.ok(medirV2(m).cabe)
  assert.ok(texto.includes('433 kcal'))
  assert.ok(texto.includes('Por 100 g: 153 kcal'))
  assert.ok(texto.includes('agregar?q=Arroz%20con%20pollo'))
})

test('presentaciones: limpia lo escrito y no acepta links ni campos vacíos', () => {
  const { validarPresentacion, tarjetaPresentacion } = require('../lib/presentaciones')
  const ok = validarPresentacion({ nombre: '  Seba  ', lugar: 'Maipú', meta: 'Bajar 5 kg', gym: '4', comida: '@Pastel de choclo' })
  assert.equal(ok.ok, true)
  assert.equal(ok.datos.nombre, 'Seba')
  assert.equal(ok.datos.comida, 'Pastel de choclo')
  assert.equal(validarPresentacion({ nombre: 'A', lugar: 'B', meta: 'mira https://spam.cl', gym: '3', comida: 'C' }).ok, false)
  assert.equal(validarPresentacion({ nombre: 'A', lugar: '', meta: 'M', gym: '3', comida: 'C' }).ok, false)
  const tarjeta = tarjetaPresentacion(ok.datos, '123', 'https://cdn.discordapp.com/avatar.png')
  assert.ok(medirV2(tarjeta).cabe)
  assert.deepEqual(tarjeta.allowedMentions, { parse: [] })
})

test('invitaciones: detecta el link usado, el mes anterior y el ranking solo con gente verificada', () => {
  const { detectarInvitacion, mesAnterior, ranking, REDES } = require('../lib/invitaciones')
  assert.deepEqual(Object.values(REDES).sort(), ['instagram', 'tiktok', 'youtube'])
  const antes = new Map([['aaa', 3], ['bbb', 1]])
  assert.equal(detectarInvitacion(antes, [{ code: 'aaa', uses: 3 }, { code: 'bbb', uses: 2 }]), 'bbb')
  assert.equal(detectarInvitacion(antes, [{ code: 'nuevo', uses: 1 }]), 'nuevo')
  assert.equal(detectarInvitacion(antes, [{ code: 'aaa', uses: 3 }]), null)
  assert.deepEqual(mesAnterior('2026-12-01'), { desde: '2026-11-01', hasta: '2026-12-01', nombre: 'noviembre 2026' })
  assert.deepEqual(mesAnterior('2027-01-01'), { desde: '2026-12-01', hasta: '2027-01-01', nombre: 'diciembre 2026' })
  const duenos = new Map([['l1', 'ana'], ['l2', 'beto']])
  const entradas = [
    { code: 'l1', verificado_at: 'x' }, { code: 'l1', verificado_at: 'x' }, { code: 'l1', verificado_at: null },
    { code: 'l2', verificado_at: 'x' }, { code: 'RzVeSeDnu', verificado_at: 'x' },
  ]
  assert.deepEqual(ranking(entradas, duenos), [{ id: 'ana', n: 2 }, { id: 'beto', n: 1 }])
})

test('encuesta semanal: 12 encuestas válidas que rotan cada semana', () => {
  const { ENCUESTAS } = require('../lib/contenido')
  const { encuestaDeLaSemana, datosEncuesta } = require('../lib/encuestas')
  assert.equal(ENCUESTAS.length, 12)
  for (const e of ENCUESTAS) {
    const d = datosEncuesta(e)
    assert.ok(d.answers.length >= 2 && d.answers.length <= 4, e.pregunta)
    assert.ok(d.answers.every((a) => a.text.length <= 55 && a.emoji), e.pregunta)
    assert.equal(d.duration, 24)
  }
  assert.equal(encuestaDeLaSemana('2026-11-11'), encuestaDeLaSemana('2026-11-15'))
  assert.notEqual(encuestaDeLaSemana('2026-11-11'), encuestaDeLaSemana('2026-11-18'))
})

test('comunidad de Discord: reglas, avisos, idioma, seguridad y pantalla de bienvenida', () => {
  const { ajustesComunidad, pantallaBienvenida, DESCRIPCION } = require('../lib/comunidad-discord')
  const a = ajustesComunidad({ reglas: 'R', avisos: 'A', bienvenidas: 'B' })
  assert.equal(a.rulesChannel, 'R')
  assert.equal(a.publicUpdatesChannel, 'A')
  assert.equal(a.systemChannel, 'B')
  assert.equal(a.preferredLocale, 'es-419')
  assert.ok(DESCRIPCION.length <= 300)
  const p = pantallaBienvenida({ verificacion: 'V', reglas: 'R', bienvenidas: 'B' })
  assert.deepEqual(p.welcomeChannels.map((c) => c.channel), ['V', 'R', 'B'])
  assert.ok(p.description.length <= 140)
})

test('/ayuda: solo la ve quien la pide; el equipo ve sus comandos', () => {
  const { mensajeAyuda } = require('../lib/ayuda')
  const normal = mensajeAyuda(cfg, false)
  const equipo = mensajeAyuda(cfg, true)
  assert.ok(normal.flags & MessageFlags.Ephemeral)
  assert.ok(normal.flags & MessageFlags.IsComponentsV2)
  assert.ok(!textoDe(normal).includes('/anuncio'))
  assert.ok(textoDe(equipo).includes('/anuncio'))
  assert.ok(medirV2(equipo).cabe)
})

test('/anuncio: respeta los saltos de línea y solo menciona el rol elegido', () => {
  const { mensajeAnuncio } = require('../lib/anuncios')
  const m = mensajeAnuncio({ titulo: 'Beta abierta', texto: 'Línea 1\\nLínea 2', rolId: '901', imagenUrl: null })
  const texto = textoDe(m)
  assert.ok(texto.includes('Línea 1\\nLínea 2'))
  assert.ok(texto.includes('<@&901>'))
  assert.deepEqual(m.allowedMentions, { roles: ['901'] })
  assert.deepEqual(mensajeAnuncio({ titulo: 'T', texto: 'X', rolId: null }).allowedMentions, { roles: [] })
})

test('comandos: nombres únicos, descripciones válidas y los nuevos registrados', () => {
  const { COMANDOS } = require('../lib/comandos')
  const nombres = COMANDOS.map((c) => c.name)
  assert.equal(new Set(nombres).size, nombres.length)
  for (const n of ['ayuda', 'alimento', 'presentarme', 'mi-invitacion', 'invitaciones', 'anuncio']) assert.ok(nombres.includes(n), n)
  for (const c of COMANDOS) assert.ok(c.description.length <= 100, c.name)
  assert.equal(COMANDOS.find((c) => c.name === 'alimento').options[0].autocomplete, true)
})

test('canales: cada canal de texto público tiene descripción y las plantillas existen', () => {
  const { ESTRUCTURA } = require('../lib/servidor')
  for (const cat of ESTRUCTURA) {
    for (const c of cat.canales) {
      if (c.plantilla) assert.ok(P.PLANTILLAS[c.plantilla], c.nombre)
      if (c.tema) assert.ok(c.tema.length <= 1024, c.nombre)
      if (!c.voz && cat.tipo !== 'staff') assert.ok(c.tema, `${c.nombre} sin descripción`)
    }
  }
  const staff = ESTRUCTURA.find((c) => c.tipo === 'staff')
  assert.ok(staff.canales.some((c) => c.nombre === '🛡️・avisos-discord'))
})
