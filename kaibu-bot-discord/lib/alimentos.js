// /alimento: kcal y macros de cualquier comida del catálogo de Kaibu (el mismo de la app),
// con autocompletar mientras se escribe. El catálogo se lee de la app (/catalogo.json) y se guarda 6 horas.
const { ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js')
const { APP_URL, COLOR } = require('./config')
const { mensajeV2 } = require('./v2')
const { buscarAlimentos, porPorcion } = require('./busqueda')

const SEIS_HORAS = 6 * 60 * 60 * 1000
let cache = { lista: null, cuando: 0 }

/** Catálogo compacto [{ n, m?, k, p, c, g, pn, pg, f, a? }] (o la última copia si la app no responde). */
async function cargarCatalogo() {
  if (cache.lista && Date.now() - cache.cuando < SEIS_HORAS) return cache.lista
  try {
    const res = await fetch(`${APP_URL}/catalogo.json`, { signal: AbortSignal.timeout(15_000) })
    if (res.ok) {
      const lista = await res.json()
      if (Array.isArray(lista) && lista.length > 0) cache = { lista, cuando: Date.now() }
    }
  } catch (e) {
    console.error('No pude leer el catálogo de la app:', e.message)
  }
  return cache.lista ?? []
}

const coma = (n) => String(n).replace('.', ',')
const etiqueta = (a) => (a.m ? `${a.n} · ${a.m}` : a.n)

/** Tarjeta del alimento (lógica pura). */
function tarjetaAlimento(a) {
  const v = porPorcion(a)
  return mensajeV2({
    acento: COLOR.ambar,
    piezas: [
      { texto: `## 🍽️ ${etiqueta(a)}\n**${coma(a.pn)}** (${coma(a.pg)} g)` },
      { separador: true },
      { texto: `🔥 **${v.kcal} kcal** · 💪 **${coma(v.proteina)} g** proteína\n🍚 ${coma(v.carbos)} g carbos · 🥑 ${coma(v.grasas)} g grasas` },
      { texto: `-# Por 100 g: ${a.k} kcal · P ${coma(a.p)} g · C ${coma(a.c)} g · G ${coma(a.g)} g\n-# Fuente: ${a.f}` },
      { botones: [new ButtonBuilder().setLabel('Anotarlo en Kaibu').setStyle(ButtonStyle.Link).setURL(`${APP_URL}/agregar?q=${encodeURIComponent(a.n)}`)] },
    ],
  })
}

/** Sugerencias mientras se escribe (máximo 25, nombres de hasta 100 caracteres). */
async function autocompletar(interaction) {
  const texto = interaction.options.getFocused()
  const lista = await cargarCatalogo()
  const resultados = texto.trim() ? buscarAlimentos(lista, texto, 25) : []
  await interaction.respond(resultados.map((a) => ({ name: etiqueta(a).slice(0, 100), value: etiqueta(a).slice(0, 100) })))
}

async function alimento(interaction) {
  const texto = interaction.options.getString('nombre', true)
  await interaction.deferReply()
  const lista = await cargarCatalogo()
  if (lista.length === 0) return interaction.editReply({ content: '😕 No pude leer el catálogo ahora. Intenta en un rato.' })
  // Si eligió una sugerencia, se toma esa exacta; si escribió libre, el mejor resultado.
  const elegido = lista.find((a) => etiqueta(a).slice(0, 100) === texto) ?? buscarAlimentos(lista, texto, 1)[0]
  if (!elegido) {
    await interaction.deleteReply().catch(() => null)
    return interaction.followUp({
      content: `No encontré "${texto}" en el catálogo de Kaibu. Prueba con otra palabra (ej.: "arroz blanco", "pechuga") o créalo en la app.`,
      flags: MessageFlags.Ephemeral,
    })
  }
  return interaction.editReply(tarjetaAlimento(elegido))
}

module.exports = { cargarCatalogo, tarjetaAlimento, autocompletar, alimento }
