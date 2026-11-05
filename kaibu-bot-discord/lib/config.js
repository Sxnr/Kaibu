// Configuración del bot: variables de entorno, conexión a Supabase y constantes compartidas.
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const { tipoDeClave, limpiarClave } = require('./clave')

const REQUERIDAS = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']

/** Si falta una variable, el bot se detiene al partir y dice cuál (en vez de fallar después). */
function revisarVariables() {
  // Un salto de línea pegado por error dentro de una clave rompe la conexión: se limpian antes de usarlas.
  for (const k of ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_GUILD_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GITHUB_TOKEN']) {
    if (process.env[k]) process.env[k] = limpiarClave(process.env[k])
  }
  const faltan = REQUERIDAS.filter((k) => !process.env[k])
  if (faltan.length > 0) {
    console.error(`❌ Faltan variables de entorno: ${faltan.join(', ')}. Agrégalas en .env (local) o en Render → Environment.`)
    process.exit(1)
  }
  // Con la clave pública (anon) Supabase niega el acceso a las tablas del bot: se avisa claro y se detiene.
  const tipo = tipoDeClave(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (tipo === 'publica') {
    console.error(
      '❌ SUPABASE_SERVICE_ROLE_KEY tiene la clave PÚBLICA (anon o publishable). El bot necesita la SECRETA: ' +
        'Supabase → Project Settings → API Keys → "service_role" (pestaña Legacy) o una "Secret key" (sb_secret_…). Cámbiala en Render → Environment.',
    )
    process.exit(1)
  }
  if (tipo === 'desconocida') console.warn('⚠️ No reconozco el formato de SUPABASE_SERVICE_ROLE_KEY. Revisa que sea la clave secreta de Supabase.')
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
