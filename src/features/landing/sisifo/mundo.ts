// La montaña de Sísifo: cielo, ladera con repisas, piedras, cordilleras, nubes, luces y la roca de mármol rojo.
import * as THREE from 'three'
import { lerp } from '@/domain/landing/guion'
import { crestas, fbm, hash, mezclaRgb, ruido3, type Rgb } from './ruido'

/** Textura pintada píxel a píxel en un canvas (mármol, roca, piedra). */
function textura(ancho: number, alto: number, pixel: (u: number, v: number) => Rgb): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = ancho
  c.height = alto
  const g = c.getContext('2d')
  if (!g) throw new Error('Sin canvas 2D')
  const img = g.createImageData(ancho, alto)
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const [r, gr, b] = pixel(x / ancho, y / alto)
      const i = (y * ancho + x) * 4
      img.data[i] = r
      img.data[i + 1] = gr
      img.data[i + 2] = b
      img.data[i + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  return t
}

/** Mármol blanco cálido con vetas grises suaves (la estatua). */
export const texturaMarmol = (res: number) =>
  textura(res, res, (u, v) => {
    const vena = Math.pow(1 - Math.abs(2 * fbm(u * 6 + fbm(u * 3, v * 3) * 2.5, v * 6, 6) - 1), 14)
    const base = mezclaRgb([244, 236, 226], [226, 214, 202], fbm(u * 4 + 20, v * 4, 4))
    return mezclaRgb(base, [150, 136, 126], vena * 0.55)
  })

/** Mármol rojo (rosso antico) con vetas claras (la roca). */
const texturaRoca = (res: number) =>
  textura(res, res / 2, (u, v) => {
    const n = fbm(u * 8, v * 4, 6)
    let col = mezclaRgb([62, 12, 10], [168, 40, 34], Math.min(1, n * 1.35))
    col = mezclaRgb(col, [205, 92, 78], Math.max(0, fbm(u * 3 + 7, v * 2) - 0.55) * 1.8)
    const vena = Math.pow(1 - Math.abs(2 * fbm(u * 5 + n * 1.8, v * 3 + 3, 6) - 1), 26)
    return mezclaRgb(col, [240, 196, 184], vena * 0.6)
  })

/** Piedra caliza (la ladera y las piedras sueltas). */
const texturaPiedra = () =>
  textura(512, 512, (u, v) => {
    const n = fbm(u * 6, v * 6, 6)
    const g = Math.pow(crestas(u * 5 + 3, v * 5), 18)
    const col = mezclaRgb([108, 94, 86], [214, 202, 190], Math.min(1, Math.max(0, (n - 0.25) * 1.8)))
    const f = 1 - 0.35 * g + (hash(u * 999, v * 777) - 0.5) * 0.12
    return [col[0] * f, col[1] * f, col[2] * f]
  })

const PENDIENTE = Math.tan(THREE.MathUtils.degToRad(31))
const CUMBRE = 26

/** Altura de la ladera en (x, z): subida de 31° con repisas, afloramientos a los lados y una cumbre. */
export function altura(x: number, z: number): number {
  const zz = Math.min(z, CUMBRE) + (z > CUMBRE ? -Math.pow(z - CUMBRE, 1.6) * 0.25 : 0)
  let base = zz * PENDIENTE
  const paso = 0.62
  const t = base / paso
  const k = Math.floor(t)
  const escalon = (k + THREE.MathUtils.smootherstep(t - k, 0.62, 1)) * paso
  base = lerp(base, escalon, 0.5 + 0.3 * fbm(x * 0.2, z * 0.2, 2))
  const lado = Math.min(1, Math.abs(x) / 2.4)
  const afloramiento = Math.pow(crestas(x * 0.12 + 3, z * 0.12, 3), 3) * 1.6 * lado
  const n = (fbm(x * 0.3 + 11, z * 0.3) - 0.5) * 1.9 * (0.3 + lado) + (fbm(x * 1.5, z * 1.5 + 5) - 0.5) * 0.28
  return base - 0.045 * x * x + n + afloramiento
}

export const pendienteEn = (x: number, z: number): number => (altura(x, z + 0.2) - altura(x, z - 0.2)) / 0.4

function cielo(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(1200, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { sol: { value: new THREE.Vector3(-0.35, 0.16, 0.92).normalize() } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `varying vec3 vDir; uniform vec3 sol;
        void main(){
          float h = clamp(vDir.y, -0.2, 1.0);
          vec3 alto = vec3(0.13, 0.10, 0.14), medio = vec3(0.62, 0.30, 0.28), horizonte = vec3(0.98, 0.74, 0.60);
          vec3 c = mix(horizonte, medio, smoothstep(0.0, 0.22, h));
          c = mix(c, alto, smoothstep(0.18, 0.75, h));
          float s = max(dot(normalize(vDir), sol), 0.0);
          c += vec3(1.0, 0.72, 0.52) * pow(s, 18.0) * 0.9 + vec3(1.0, 0.85, 0.7) * pow(s, 600.0) * 3.0;
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  )
}

function ladera(texPiedra: THREE.Texture, celular: boolean): THREE.Mesh {
  const tex = texPiedra.clone()
  tex.repeat.set(42, 56)
  tex.needsUpdate = true
  const geo = new THREE.PlaneGeometry(70, 90, celular ? 160 : 300, celular ? 200 : 380)
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 0, 18)
  const pos = geo.attributes.position!
  const colores: number[] = []
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    pos.setY(i, altura(x, z))
    colores.push(...mezclaRgb([0.78, 0.72, 0.68], [1, 0.95, 0.9], fbm(x * 0.5, z * 0.5)))
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3))
  geo.computeVertexNormals()
  const malla = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 0.96, metalness: 0 }))
  malla.receiveShadow = true
  return malla
}

function geoPiedra(semilla: number, detalle: number): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, detalle)
  const p = g.attributes.position!
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    v.multiplyScalar(0.78 + ruido3(v.x * 1.3 + semilla, v.y * 1.3, v.z * 1.3) * 0.5)
    v.y *= 0.7
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
}

/** Piedras sueltas o gravilla: instancias, una sola llamada de dibujo por tipo. */
function sembrar(geo: THREE.BufferGeometry, material: THREE.Material, cantidad: number, tamMin: number, tamMax: number, sesgo: number) {
  const m = new THREE.InstancedMesh(geo, material, cantidad)
  const o = new THREE.Object3D()
  for (let i = 0; i < cantidad; i++) {
    const x = (hash(i, sesgo) - 0.5) * 26 * (sesgo === 2 ? 0.25 : 1)
    const z = -6 + hash(i, sesgo + 1) * 40
    const s = lerp(tamMin, tamMax, Math.pow(hash(i, sesgo + 2), 2.2))
    // Las piedras grandes no tapan el camino de Sísifo.
    if (sesgo !== 2 && Math.abs(x) < 1.1 && s > 0.12) {
      o.scale.setScalar(0)
    } else {
      o.position.set(x, altura(x, z) - s * 0.25, z)
      o.rotation.set(hash(i, 9) * 6, hash(i, 10) * 6, hash(i, 11) * 6)
      o.scale.set(s * (0.8 + hash(i, 12) * 0.5), s, s * (0.8 + hash(i, 13) * 0.5))
    }
    o.updateMatrix()
    m.setMatrixAt(i, o.matrix)
  }
  m.castShadow = m.receiveShadow = true
  return m
}

function cordilleras(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(1600, 1600, 200, 200)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position!
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const pico = Math.pow(crestas(x * 0.006, z * 0.006), 2.2) * 120 + fbm(x * 0.02, z * 0.02) * 30
    pos.setY(i, -60 + pico * THREE.MathUtils.smoothstep(Math.hypot(x, z - 10), 60, 260))
  }
  geo.computeVertexNormals()
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x8a6a64, roughness: 1 }))
}

function nubes(): THREE.Group {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  if (g) {
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(255,236,226,0.9)')
    grad.addColorStop(1, 'rgba(255,236,226,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
  }
  const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0.5 })
  const grupo = new THREE.Group()
  for (let i = 0; i < 60; i++) {
    const s = new THREE.Sprite(mat)
    const a = hash(i, 3) * Math.PI * 2
    const r = 30 + hash(i, 4) * 160
    s.position.set(Math.cos(a) * r, 2 + hash(i, 5) * 8, 30 + Math.sin(a) * r)
    const k = 25 + hash(i, 6) * 45
    s.scale.set(k * 1.8, k * 0.55, 1)
    grupo.add(s)
  }
  return grupo
}

/** Roca de mármol rojo con caras talladas (radio 1; se escala al dibujar). */
function roca(celular: boolean): THREE.Mesh {
  const geo = new THREE.IcosahedronGeometry(1, celular ? 32 : 64)
  const p = geo.attributes.position!
  const v = new THREE.Vector3()
  const caras: [number, number, number, number][] = [
    [0.7, 0.5, 0.5, 0.88],
    [-0.6, 0.3, -0.7, 0.9],
    [0.1, -0.9, 0.4, 0.86],
    [-0.3, 0.8, 0.5, 0.9],
  ]
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    let d = 1 + (ruido3(v.x * 1.3 + 5, v.y * 1.3, v.z * 1.3) - 0.5) * 0.22
    d += (ruido3(v.x * 4 + 2, v.y * 4, v.z * 4) - 0.5) * 0.05
    // Caras talladas: aplana suavemente la piedra en algunas direcciones.
    for (const [cx, cy, cz, k] of caras) {
      const proyeccion = (v.x * cx + v.y * cy + v.z * cz) / Math.hypot(cx, cy, cz)
      if (proyeccion * d > k) d = lerp(d, k / proyeccion, 0.85)
    }
    v.multiplyScalar(d)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  const malla = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({ map: texturaRoca(celular ? 512 : 1024), roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.4 }),
  )
  malla.castShadow = malla.receiveShadow = true
  return malla
}

export interface Mundo {
  roca: THREE.Mesh
  sol: THREE.DirectionalLight
  relleno: THREE.DirectionalLight
}

/** Arma la montaña completa dentro de la escena. */
export function crearMundo(escena: THREE.Scene, celular: boolean): Mundo {
  const texPiedra = texturaPiedra()
  const piedra = new THREE.MeshStandardMaterial({ map: texPiedra, roughness: 0.94, metalness: 0 })
  escena.fog = new THREE.FogExp2(0xd7a291, 0.0042)
  escena.add(cielo(), ladera(texPiedra, celular), cordilleras(), nubes())
  escena.add(sembrar(geoPiedra(1, 3), piedra, celular ? 60 : 140, 0.08, 0.75, 5))
  escena.add(sembrar(geoPiedra(7, 1), piedra, celular ? 200 : 600, 0.02, 0.07, 2))

  escena.add(new THREE.HemisphereLight(0xffe6d8, 0x5a3f38, 0.9))
  const sol = new THREE.DirectionalLight(0xffd6b5, 3.1)
  sol.castShadow = true
  sol.shadow.mapSize.set(1024, 1024)
  sol.shadow.bias = -0.0005
  sol.shadow.normalBias = 0.03
  const sc = sol.shadow.camera
  sc.left = sc.bottom = -6
  sc.right = sc.top = 6
  sc.near = 1
  sc.far = 45
  const relleno = new THREE.DirectionalLight(0xbfc8ff, 0.35)
  escena.add(sol, sol.target, relleno)

  const laRoca = roca(celular)
  escena.add(laRoca)
  return { roca: laRoca, sol, relleno }
}
