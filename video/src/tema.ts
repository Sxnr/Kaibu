// Colores y fuentes de Kaibu (los mismos tokens de src/styles/index.css).
import { loadFont } from '@remotion/fonts'
import { staticFile } from 'remotion'

export const C = {
  marca: '#b3202a',
  marcaIntensa: '#d1343c',
  marcaOscura: '#6e1217',
  textoMarca: '#a01c25',
  ambar: '#e8b04b',
  cielo: '#5ab0e6',
  verde: '#8cc084',
  proteina: '#2a7ab5',
  carbos: '#a8710f',
  grasas: '#4c8a43',
  exito: '#1f8155',
  // claro (pantallas de la app)
  fondo: '#faf7f6',
  superficie: '#ffffff',
  elevada: '#f3eeec',
  borde: '#e6dedb',
  texto: '#1a1414',
  secundario: '#6b605e',
  // oscuro (escenario del video)
  noche: '#0f0d0d',
  nocheSuperficie: '#1b1717',
  tinta: '#f4f1f0',
  tintaSuave: '#a39a98',
} as const

export const SANS = "'Inter', system-ui, sans-serif"
export const DISPLAY = "'Barlow Condensed', 'Arial Narrow', sans-serif"

// Las fuentes se cargan desde public/fuentes (copiadas de node_modules de la app).
void loadFont({ family: 'Inter', url: staticFile('fuentes/inter-latin-wght-normal.woff2'), weight: '100 900' })
for (const peso of ['600', '700', '800']) {
  void loadFont({ family: 'Barlow Condensed', url: staticFile(`fuentes/barlow-condensed-latin-${peso}-normal.woff2`), weight: peso })
}
