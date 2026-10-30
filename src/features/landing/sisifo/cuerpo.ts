// Sísifo, estatua de mármol: posa el esqueleto según el avance (pasos, torso, manos apoyadas en la roca).
import * as THREE from 'three'
import { lerp, pisada, ZANCADA } from '@/domain/landing/guion'
import { altura, pendienteEn } from './mundo'

type Dir = [number, number, number]

// Torso: inclinado empujando (como la foto) o erguido en la cumbre.
const EMPUJE: Record<string, Dir> = { Spine: [0, 0.5, 1], Spine1: [0, 0.47, 1], Spine2: [0, 0.44, 1], Neck: [0, 0.3, 1], Head: [0, 0.08, 1] }
const ERGUIDO: Record<string, Dir> = { Spine: [0, 1, 0.08], Spine1: [0, 1, 0.06], Spine2: [0, 1, 0.05], Neck: [0, 1, 0.12], Head: [0, 1, 0.25] }
const HIJO: Record<string, string> = { Spine: 'Spine1', Spine1: 'Spine2', Spine2: 'Neck', Neck: 'Head', Head: 'HeadTop_End' }
const DEDOS: [string, number][] = [
  ['Index', 0.1],
  ['Middle', 0],
  ['Ring', -0.08],
  ['Pinky', -0.16],
]
const CURVA_DEDOS = [0.12, 0.22, 0.2]
const LADOS = ['Left', 'Right'] as const
type Lado = (typeof LADOS)[number]

const mezclaDir = (a: Dir, b: Dir, t: number): Dir => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

export interface Sisifo {
  modelo: THREE.Object3D
  /** Posa a Sísifo en el avance z con postura e (0 empuja, 1 erguido) y ubica la roca de radio R. */
  animar: (z: number, e: number, R: number) => void
  /** Posición del pecho (para encuadrar la cámara). */
  pecho: (v: THREE.Vector3) => THREE.Vector3
}

export function crearSisifo(modelo: THREE.Object3D, marmol: THREE.Material, roca: THREE.Mesh): Sisifo {
  modelo.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    o.material = marmol
    o.castShadow = o.receiveShadow = true
    // La malla con esqueleto se deforma: su caja original no sirve para descartarla fuera de cámara.
    o.frustumCulled = false
  })

  const porNombre = new Map<string, THREE.Object3D>()
  const reposo: [THREE.Object3D, THREE.Quaternion][] = []
  modelo.traverse((o) => {
    porNombre.set(o.name, o)
    if (o instanceof THREE.Bone) reposo.push([o, o.quaternion.clone()])
  })
  const hueso = (n: string): THREE.Object3D => {
    const b = porNombre.get('mixamorig' + n)
    if (!b) throw new Error(`Falta el hueso ${n}`)
    return b
  }
  const pos = (n: string, v = new THREE.Vector3()) => hueso(n).getWorldPosition(v)

  const v1 = new THREE.Vector3()
  const v2 = new THREE.Vector3()
  const vDir = new THREE.Vector3()
  const qW = new THREE.Quaternion()
  const qP = new THREE.Quaternion()
  const qD = new THREE.Quaternion()

  /** Gira un hueso para que apunte (hacia su hijo) en la dirección dada, en coordenadas del mundo. */
  function apuntar(nombre: string, hijo: string, dir: THREE.Vector3 | Dir) {
    const b = hueso(nombre)
    const padre = b.parent
    if (!padre) return
    b.updateWorldMatrix(true, true)
    b.getWorldPosition(v1)
    hueso(hijo).getWorldPosition(v2)
    if (Array.isArray(dir)) vDir.set(dir[0], dir[1], dir[2])
    else vDir.copy(dir)
    qD.setFromUnitVectors(v2.sub(v1).normalize(), vDir.normalize())
    b.getWorldQuaternion(qW)
    padre.getWorldQuaternion(qP)
    b.quaternion.copy(qP.invert().multiply(qD.multiply(qW)))
  }

  modelo.updateMatrixWorld(true)
  const largo = (a: string, b: string) => pos(a).distanceTo(pos(b))
  const LARGO: Record<string, number> = {}
  for (const L of LADOS) {
    LARGO[L + 'UpLeg'] = largo(L + 'UpLeg', L + 'Leg')
    LARGO[L + 'Leg'] = largo(L + 'Leg', L + 'Foot')
    LARGO[L + 'Arm'] = largo(L + 'Arm', L + 'ForeArm')
    LARGO[L + 'ForeArm'] = largo(L + 'ForeArm', L + 'Hand')
  }
  const PIERNA = LARGO.LeftUpLeg! + LARGO.LeftLeg!
  const caderaReposo = pos('Hips')

  // Orientación de cada mano en reposo: hacia los dedos (F) y hacia la palma (N, el lado del pulgar).
  const MANO0 = {} as Record<Lado, { F: THREE.Vector3; N: THREE.Vector3; q: THREE.Quaternion }>
  for (const L of LADOS) {
    const h = pos(L + 'Hand')
    const F = pos(L + 'HandMiddle1').sub(h).normalize()
    const lat = pos(L + 'HandIndex1').sub(pos(L + 'HandPinky1')).normalize()
    const N = new THREE.Vector3().crossVectors(F, lat).normalize()
    if (pos(L + 'HandThumb3').sub(h).dot(N) < 0) N.negate()
    MANO0[L] = { F, N, q: hueso(L + 'Hand').getWorldQuaternion(new THREE.Quaternion()) }
  }

  const mB = new THREE.Matrix4()
  const mD = new THREE.Matrix4()
  const qR = new THREE.Quaternion()
  /** Gira la mano para que los dedos apunten a F y la palma mire hacia N. */
  function orientarMano(L: Lado, F: THREE.Vector3, N: THREE.Vector3) {
    const m0 = MANO0[L]
    const b = hueso(L + 'Hand')
    const padre = b.parent
    if (!padre) return
    mB.makeBasis(m0.F, m0.N, new THREE.Vector3().crossVectors(m0.F, m0.N))
    const f = F.clone().normalize()
    const n = N.clone().sub(f.clone().multiplyScalar(N.dot(f))).normalize()
    mD.makeBasis(f, n, new THREE.Vector3().crossVectors(f, n))
    qR.setFromRotationMatrix(mD.multiply(mB.transpose()))
    padre.updateWorldMatrix(true, false)
    padre.getWorldQuaternion(qP)
    b.quaternion.copy(qP.invert().multiply(qR.multiply(m0.q)))
  }

  /** Cinemática inversa de dos huesos (pierna o brazo): llega al objetivo doblando hacia el polo. */
  function ik(raiz: string, medio: string, fin: string, objetivo: THREE.Vector3, polo: THREE.Vector3) {
    const A = pos(raiz)
    const L1 = LARGO[raiz]!
    const L2 = LARGO[medio]!
    const d = objetivo.clone().sub(A)
    const dist = THREE.MathUtils.clamp(d.length(), 0.05, (L1 + L2) * 0.998)
    d.normalize()
    const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist)
    const h = Math.sqrt(Math.max(0, L1 * L1 - a * a))
    const perp = polo.clone().sub(d.clone().multiplyScalar(polo.dot(d))).normalize()
    const M = A.clone().addScaledVector(d, a).addScaledVector(perp, h)
    apuntar(raiz, medio, M.clone().sub(A))
    apuntar(medio, fin, A.clone().addScaledVector(d, dist).sub(M))
  }

  function piernas(z: number, e: number) {
    LADOS.forEach((L, i) => {
      const lado = i === 0 ? 1 : -1
      const pi = pisada(z, i * 0.5, lado, e)
      const suelo = altura(pi.x, pi.z)
      const tobillo = new THREE.Vector3(pi.x, suelo + 0.085 + pi.talon * 0.07 + pi.alza, pi.z)
      ik(L + 'UpLeg', L + 'Leg', L + 'Foot', tobillo, new THREE.Vector3(lado * 0.15, 0.1, 1))
      apuntar(L + 'Foot', L + 'ToeBase', new THREE.Vector3(0, pendienteEn(pi.x, pi.z) - pi.talon * 0.9 + pi.alza * 1.5, 1).normalize())
    })
  }

  /** Centro de la roca: frente a los hombros, apoyada en la ladera (o a un costado en la cumbre). */
  function ubicarRoca(hombros: THREE.Vector3, z: number, e: number, R: number): THREE.Vector3 {
    const centro = new THREE.Vector3()
    let a = 0
    let b = 3
    for (let i = 0; i < 30; i++) {
      const dz = (a + b) / 2
      centro.set(0, 0, hombros.z + dz)
      centro.y = altura(0, centro.z) + R * 0.94
      if (centro.distanceTo(hombros) - R < 0.55) a = dz
      else b = dz
    }
    const costado = new THREE.Vector3(0.85, 0, z + 0.3)
    costado.y = altura(costado.x, costado.z) + R * 0.94
    centro.lerp(costado, e)
    roca.position.copy(centro)
    roca.scale.setScalar(R)
    roca.rotation.set(z / R + 0.6, 1.2, 0.3)
    roca.updateMatrixWorld(true)
    return centro
  }

  const rayo = new THREE.Raycaster()
  /** Brazos y manos: palmas planas contra la roca, dedos hacia arriba, codos hacia abajo y afuera. */
  function brazos(centro: THREE.Vector3, hombros: Record<Lado, THREE.Vector3>, e: number, R: number) {
    LADOS.forEach((L, i) => {
      const s = i === 0 ? 1 : -1
      const hombro = hombros[L]
      const n = hombro.clone().sub(centro).setY(0).normalize().add(new THREE.Vector3(0, -0.22, 0)).normalize()
      // Punto exacto de la superficie (la roca tiene caras talladas): un rayo desde afuera hacia el centro.
      rayo.set(centro.clone().addScaledVector(n, R * 2), n.clone().negate())
      const choque = rayo.intersectObject(roca, false)[0]
      const contacto = choque ? choque.point : centro.clone().addScaledVector(n, R * 0.97)
      const F = new THREE.Vector3(0, 1, 0).addScaledVector(n, -n.y).normalize()
      let muneca = contacto.clone().addScaledVector(n, 0.025).addScaledVector(F, -0.085)
      let Fm = F
      let Nm = n.clone().negate()
      // En la cumbre la mano derecha suelta la roca y cuelga.
      if (L === 'Right' && e > 0) {
        muneca = muneca.lerp(hombro.clone().add(new THREE.Vector3(-0.06, -0.5, 0.06)), e)
        Fm = F.clone().lerp(new THREE.Vector3(0, -1, 0.1), e).normalize()
        Nm = Nm.clone().lerp(new THREE.Vector3(1, 0, 0), e).normalize()
      }
      ik(L + 'Arm', L + 'ForeArm', L + 'Hand', muneca, new THREE.Vector3(s * 0.7, -1, -0.2))
      orientarMano(L, Fm, Nm)
      const lat = new THREE.Vector3().crossVectors(Nm, Fm).normalize().multiplyScalar(s)
      for (const [dedo, abre] of DEDOS) {
        for (let k = 1; k <= 3; k++) {
          const curva = CURVA_DEDOS[k - 1]! * (k === 1 ? 1 : 1.2)
          const d = Fm.clone()
            .multiplyScalar(Math.cos(curva * k))
            .addScaledVector(Nm, Math.sin(curva * k))
            .addScaledVector(lat, k === 1 ? abre : 0)
            .normalize()
          apuntar(L + 'Hand' + dedo + k, L + 'Hand' + dedo + (k + 1), d)
        }
      }
    })
  }

  function animar(z: number, e: number, R: number) {
    for (const [b, q] of reposo) b.quaternion.copy(q)
    const fase = z / ZANCADA
    const cadera = new THREE.Vector3(0, 0, z)
    cadera.y = altura(0, z - 0.2) + PIERNA * lerp(0.9, 0.97, e) - (1 - e) * 0.025 * Math.cos(fase * Math.PI * 4)
    modelo.position.copy(cadera).sub(caderaReposo)
    modelo.updateMatrixWorld(true)
    // Torso y cabeza: balanceo con cada paso y pulso de esfuerzo.
    const vaiven = Math.sin(fase * Math.PI * 2) * (1 - e)
    const esfuerzo = Math.cos(fase * Math.PI * 4) * (1 - e)
    for (const n of Object.keys(EMPUJE)) {
      const d = mezclaDir(EMPUJE[n]!, ERGUIDO[n]!, e)
      apuntar(n, HIJO[n]!, [d[0] + vaiven * (n === 'Head' ? 0.1 : 0.05), d[1] + esfuerzo * 0.03, d[2]])
    }
    piernas(z, e)
    const hombros = { Left: pos('LeftArm'), Right: pos('RightArm') }
    const centro = ubicarRoca(hombros.Left.clone().add(hombros.Right).multiplyScalar(0.5), z, e, R)
    brazos(centro, hombros, e, R)
    modelo.updateMatrixWorld(true)
  }

  return { modelo, animar, pecho: (v) => pos('Spine2', v) }
}
