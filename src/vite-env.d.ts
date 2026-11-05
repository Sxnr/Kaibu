/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SENTRY_DSN?: string
  /** Link de invitación al Discord de Kaibu (público). */
  readonly VITE_DISCORD_INVITE?: string
  /** Solo sin Supabase (modo local, pruebas): "1" muestra la web como beta cerrada. Con Supabase manda la base de datos. */
  readonly VITE_BETA_CERRADA?: string
}

/** Versión de la app (de package.json), fijada al compilar. */
declare const __VERSION__: string

interface ImportMeta {
  readonly env: ImportMetaEnv
}
