// Configuración del bot: variables de entorno, conexión a Supabase y constantes compartidas.
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const REQUERIDAS = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']

/** Si falta una variable, el bot se detiene al partir y dice cuál (en vez de fallar después). */
function revisarVariables() {
  const faltan = REQUERIDAS.filter((k) => !process.env[k])
  if (faltan.length > 0) {
    console.error(`❌ Faltan variables de entorno: ${faltan.join(', ')}. Agrégalas en .env (local) o en Render → Environment.`)
    process.exit(1)
  }
}

let cliente = null
/** Cliente de Supabase con service_role: solo vive en el servidor del bot, nunca en la app. */
function supabase() {
  cliente ??= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cliente
}

/** Configuración guardada por /setup para un servidor (o null si aún no se ejecuta). */
async function configServidor(guildId) {
  const { data, error } = await supabase().from('discord_guild_config').select('*').eq('guild_id', guildId).maybeSingle()
  if (error) throw error
  return data
}

const VERSION_APP = '0.2.0-beta'
const APP_URL = process.env.APP_URL || 'https://kaibu-nine.vercel.app'

// Colores de la marca Kaibu (los mismos tokens de la app).
const COLOR = {
  marca: '#B3202A',
  exito: '#3FBF7F',
  info: '#5AB0E6',
  ambar: '#E8B04B',
  gris: '#6B605E',
}

module.exports = { revisarVariables, supabase, configServidor, VERSION_APP, APP_URL, COLOR }
