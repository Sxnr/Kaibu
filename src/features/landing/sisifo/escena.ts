// Escena 3D de la landing: arma el mundo, carga a Sísifo y dibuja cada avance p (0 a 1) del scroll.
// Se carga aparte (import dinámico) para que three.js no pese en la primera carga de la página.
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { avanceZ, CAPITULOS, erguido, escalaRoca, FICHAS_COMIDA, lerp, suave } from '@/domain/landing/guion'
import { crearSisifo } from './cuerpo'
import { crearMundo, texturaMarmol } from './mundo'

const MODELO = '/landing/sisifo/xbot.glb'
const R0 = 0.74

interface Toma {
  pos: [number, number, number]
  mira: [number, number, number]
  lente: number
}
/** Una toma por capítulo (posición y mirada relativas al foco, y lente). */
const TOMAS: Toma[] = [
  { pos: [6.2, 0.7, -1.8], mira: [0, 0.35, 0.5], lente: 32 },
  { pos: [3.5, 0.55, -0.7], mira: [0, 0.3, -0.2], lente: 30 },
  { pos: [6.5, 3.4, 0.4], mira: [0, 0.1, 0.8], lente: 34 },
  { pos: [9.5, 7.5, -8], mira: [0, -0.6, 2.5], lente: 30 },
  { pos: [-3.2, 1.2, -4.2], mira: [0.4, 0.7, 2.5], lente: 34 },
]

export interface Punto {
  x: number
  y: number
}

export interface EscenaSisifo {
  /** Dibuja el avance p y devuelve dónde quedan (en px del canvas) las comidas pegadas a la roca. */
  dibujar: (p: number) => Punto[]
  /** Vuelve a medir el canvas (al cambiar el tamaño de la ventana). */
  ajustar: () => void
  destruir: () => void
}

function liberar(escena: THREE.Scene) {
  escena.traverse((o) => {
    if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
      o.geometry.dispose()
      const materiales: THREE.Material[] = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of materiales) {
        for (const valor of Object.values(m)) if (valor instanceof THREE.Texture) valor.dispose()
        m.dispose()
      }
    }
  })
}

/** Falla si el navegador no tiene WebGL o no se pudo cargar la estatua: quien llama muestra imágenes fijas. */
export async function crearEscena(canvas: HTMLCanvasElement, { celular }: { celular: boolean }): Promise<EscenaSisifo> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, celular ? 1 : 1.5))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = !celular
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const escena = new THREE.Scene()
  const camara = new THREE.PerspectiveCamera(32, 1, 0.1, 2400)
  const { roca, sol, relleno } = crearMundo(escena, celular)

  let gltf
  try {
    gltf = await new GLTFLoader().loadAsync(MODELO)
  } catch (error) {
    liberar(escena)
    renderer.dispose()
    throw error
  }
  const marmol = new THREE.MeshPhysicalMaterial({
    map: texturaMarmol(celular ? 512 : 1024),
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.5,
    sheen: 0.4,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0xfff2ea),
  })
  const sisifo = crearSisifo(gltf.scene, marmol, roca)
  escena.add(sisifo.modelo)

  const foco = new THREE.Vector3()
  const tmp = new THREE.Vector3()

  function ajustar() {
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    renderer.setSize(W, H, false)
    camara.aspect = W / Math.max(1, H)
    camara.updateProjectionMatrix()
  }

  /** Cámara: interpola entre las tomas de los capítulos, siguiendo a Sísifo. En pantallas verticales se aleja. */
  function encuadrar(p: number) {
    sisifo.pecho(foco).lerp(roca.position, 0.45)
    const s = p * (CAPITULOS - 1)
    const i = Math.min(CAPITULOS - 2, Math.floor(s))
    const t = suave(s - i)
    const A = TOMAS[i]!
    const B = TOMAS[i + 1]!
    const vertical = camara.aspect < 1
    camara.position
      .set(lerp(A.pos[0], B.pos[0], t), lerp(A.pos[1], B.pos[1], t), lerp(A.pos[2], B.pos[2], t))
      .multiplyScalar(vertical ? 1.35 : 1)
      .add(foco)
    camara.lookAt(tmp.set(lerp(A.mira[0], B.mira[0], t), lerp(A.mira[1], B.mira[1], t), lerp(A.mira[2], B.mira[2], t)).add(foco))
    camara.fov = lerp(A.lente, B.lente, t) + (vertical ? 10 : 0)
    camara.updateProjectionMatrix()
    sol.position.copy(foco).add(tmp.set(-6, 7, 14))
    sol.target.position.copy(foco)
    sol.target.updateMatrixWorld()
    relleno.position.copy(camara.position).add(tmp.set(0, 3, 0))
  }

  function dibujar(p: number): Punto[] {
    const R = R0 * escalaRoca(p)
    sisifo.animar(avanceZ(p), erguido(p), R)
    encuadrar(p)
    renderer.render(escena, camara)
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    return FICHAS_COMIDA.map((f) => {
      tmp.set(0.45, Math.sin(f.angulo), Math.cos(f.angulo)).normalize().multiplyScalar(R * 1.05).add(roca.position).project(camara)
      return { x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H }
    })
  }

  ajustar()
  return {
    dibujar,
    ajustar,
    destruir() {
      liberar(escena)
      renderer.dispose()
    },
  }
}
