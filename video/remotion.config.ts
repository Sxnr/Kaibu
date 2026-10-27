// Configuración de Remotion: 3D por software (sirve en equipos sin tarjeta de video) y buena calidad de imagen.
import { Config } from '@remotion/cli/config'

Config.setChromiumOpenGlRenderer('swangle')
Config.setVideoImageFormat('jpeg')
Config.setJpegQuality(92)
Config.setCodec('h264')
Config.setCrf(18)
if (process.env.REMOTION_NAVEGADOR) Config.setBrowserExecutable(process.env.REMOTION_NAVEGADOR)
