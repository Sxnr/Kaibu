/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SENTRY_DSN?: string
  /** Link de invitación al Discord de Kaibu (público). */
  readonly VITE_DISCORD_INVITE?: string
}

/** Versión de la app (de package.json), fijada al compilar. */
declare const __VERSION__: string

interface ImportMeta {
  readonly env: ImportMetaEnv
}
