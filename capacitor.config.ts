// App de Android con la web de Kaibu empaquetada adentro (funciona sin internet y sin Chrome).
// Mismo paquete que el APK anterior (cl.kaibu.app): se instala encima sin perder datos si se firma con la misma llave.
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'cl.kaibu.app',
  appName: 'Kaibu',
  webDir: 'dist',
  backgroundColor: '#0F0D0D',
  android: {
    // La web corre en https://localhost: Supabase y el resto funcionan igual que en el navegador.
    allowMixedContent: false,
  },
  server: { androidScheme: 'https' },
}

export default config
