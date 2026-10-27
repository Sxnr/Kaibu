// Objetos 3D (Three.js): el candado del "plan premium" que se rompe y las figuras de fondo con los colores de Kaibu.
import { useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { random } from 'remotion'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { C } from './tema'

/** Luz ambiental de estudio para que los metales y el barniz brillen. */
export function Entorno() {
  const { gl, scene } = useThree()
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl)
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
  }, [gl, scene])
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 6, 6]} intensity={1.6} />
      <pointLight position={[-5, 2, 4]} intensity={40} color={C.marcaIntensa} />
      <pointLight position={[5, -3, 4]} intensity={25} color={C.cielo} />
    </>
  )
}

/* ---------- Candado ---------- */

export interface EstadoCandado {
  pos: [number, number, number]
  escala: number
  rotY: number
  rotZ: number
  /** 0..1: grietas que brillan antes de romperse. */
  grieta: number
  /** Frames desde la explosión (null = entero). */
  explosion: number | null
}

const cuerpoGeo = new RoundedBoxGeometry(2.0, 1.6, 0.7, 6, 0.2)
const arcoGeo = new THREE.TorusGeometry(0.62, 0.15, 24, 64, Math.PI)
const piernaGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.55, 24)
const trozoGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.12)
const papelGeo = new THREE.PlaneGeometry(0.11, 0.2)

const GRIETAS = Array.from({ length: 6 }, (_, i) => ({
  x: (random(`gx${i}`) - 0.5) * 1.4,
  y: (random(`gy${i}`) - 0.5) * 1.0 - 0.3,
  largo: 0.4 + random(`gl${i}`) * 0.6,
  ang: random(`ga${i}`) * Math.PI,
}))

const TROZOS = Array.from({ length: 42 }, (_, i) => {
  const p = new THREE.Vector3((random(`tx${i}`) - 0.5) * 1.9, (random(`ty${i}`) - 0.5) * 1.5 - 0.3, (random(`tz${i}`) - 0.5) * 0.6)
  const dir = p.clone().add(new THREE.Vector3(0, 0.3, 0.9)).normalize()
  return {
    p,
    dir,
    vel: 0.16 + random(`tv${i}`) * 0.22,
    tam: 0.16 + random(`ts${i}`) * 0.3,
    rot: new THREE.Vector3(random(`r1${i}`) - 0.5, random(`r2${i}`) - 0.5, random(`r3${i}`) - 0.5).multiplyScalar(0.5),
    metal: random(`tm${i}`) < 0.3,
  }
})

const COLORES_PAPEL = [C.marca, C.ambar, C.cielo, C.verde, '#ffffff', C.marcaIntensa]
const PAPELES = Array.from({ length: 150 }, (_, i) => {
  const th = random(`pa${i}`) * Math.PI * 2
  const ph = Math.acos(2 * random(`pb${i}`) - 1)
  return {
    dir: new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th) * 0.8 + 0.25, Math.abs(Math.cos(ph)) * 0.9),
    vel: 0.22 + random(`pv${i}`) * 0.4,
    color: COLORES_PAPEL[i % COLORES_PAPEL.length],
    giro: 0.15 + random(`pg${i}`) * 0.3,
    fase: random(`pf${i}`) * 6,
  }
})

/** Distancia recorrida con freno (aire) en t frames. */
const recorrido = (vel: number, t: number, freno = 16) => vel * freno * (1 - Math.exp(-t / freno))

export function Candado({ estado }: { estado: EstadoCandado }) {
  const { pos, escala, rotY, rotZ, grieta, explosion } = estado
  if (explosion !== null) return <Explosion t={explosion} pos={pos} escala={escala} />
  return (
    <group position={pos} scale={escala} rotation={[0.12, rotY, rotZ]}>
      <mesh geometry={cuerpoGeo} position={[0, -0.3, 0]}>
        <meshPhysicalMaterial color={C.marca} metalness={0.5} roughness={0.28} clearcoat={1} clearcoatRoughness={0.15} emissive={C.ambar} emissiveIntensity={grieta * 0.12} />
      </mesh>
      <mesh geometry={arcoGeo} position={[0, 0.78, 0]}>
        <meshStandardMaterial color="#e3dcda" metalness={1} roughness={0.18} />
      </mesh>
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} geometry={piernaGeo} position={[x, 0.52, 0]}>
          <meshStandardMaterial color="#e3dcda" metalness={1} roughness={0.18} />
        </mesh>
      ))}
      {/* Cerradura */}
      <mesh position={[0, -0.15, 0.36]}>
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial color="#1a0606" />
      </mesh>
      <mesh position={[0, -0.36, 0.36]}>
        <planeGeometry args={[0.12, 0.32]} />
        <meshBasicMaterial color="#1a0606" />
      </mesh>
      {/* Grietas de luz */}
      {grieta > 0 &&
        GRIETAS.map((g, i) => (
          <mesh key={i} position={[g.x, g.y, 0.362]} rotation={[0, 0, g.ang]} scale={[Math.max(0.001, g.largo * Math.min(1, grieta * 1.6 - i * 0.12)), 1, 1]}>
            <planeGeometry args={[1, 0.035]} />
            <meshBasicMaterial color="#ffe7b0" transparent opacity={Math.min(1, grieta * 1.5)} toneMapped={false} />
          </mesh>
        ))}
    </group>
  )
}

function Explosion({ t, pos, escala }: { t: number; pos: [number, number, number]; escala: number }) {
  const caida = 0.0045 * t * t
  const fundido = Math.max(0, 1 - Math.max(0, t - 30) / 40)
  if (t > 95) return null
  return (
    <group position={pos} scale={escala}>
      {TROZOS.map((z, i) => {
        const d = recorrido(z.vel, t)
        return (
          <mesh
            key={i}
            geometry={trozoGeo}
            position={[z.p.x + z.dir.x * d, z.p.y + z.dir.y * d - caida, z.p.z + z.dir.z * d]}
            rotation={[z.rot.x * t, z.rot.y * t, z.rot.z * t]}
            scale={z.tam}
          >
            <meshPhysicalMaterial color={z.metal ? '#e3dcda' : C.marca} metalness={z.metal ? 1 : 0.5} roughness={0.25} clearcoat={1} transparent opacity={fundido} />
          </mesh>
        )
      })}
      {PAPELES.map((p, i) => {
        const d = recorrido(p.vel, t, 22)
        const op = Math.max(0, 1 - Math.max(0, t - 45) / 45)
        return (
          <mesh
            key={`p${i}`}
            geometry={papelGeo}
            position={[p.dir.x * d, p.dir.y * d - 0.0028 * t * t, p.dir.z * d]}
            rotation={[t * p.giro + p.fase, t * p.giro * 0.7, p.fase]}
          >
            <meshStandardMaterial color={p.color} side={THREE.DoubleSide} roughness={0.5} transparent opacity={op} />
          </mesh>
        )
      })}
    </group>
  )
}

/* ---------- Figuras de fondo ---------- */

type Tipo = 'caja' | 'esfera' | 'toro' | 'capsula'
const cajaGeo = new RoundedBoxGeometry(1.5, 0.95, 0.16, 4, 0.12)
const esferaGeo = new THREE.SphereGeometry(0.5, 48, 48)
const toroGeo = new THREE.TorusGeometry(0.5, 0.17, 32, 80)
const capsulaGeo = new THREE.CapsuleGeometry(0.28, 0.7, 12, 32)
const GEOS: Record<Tipo, THREE.BufferGeometry> = { caja: cajaGeo, esfera: esferaGeo, toro: toroGeo, capsula: capsulaGeo }

interface Figura {
  tipo: Tipo
  color: string
  pos: [number, number, number]
  tam: number
}

// Posiciones pensadas para dejar libre el centro (texto y teléfono).
const FIGURAS_H: Figura[] = [
  { tipo: 'toro', color: C.marca, pos: [-9.8, 4.4, -4], tam: 1.3 },
  { tipo: 'esfera', color: C.cielo, pos: [7.8, 3.4, -6], tam: 1.4 },
  { tipo: 'caja', color: '#ffffff', pos: [-10.8, -4.6, -5], tam: 1.3 },
  { tipo: 'capsula', color: C.verde, pos: [8.4, -3.0, -3.5], tam: 1.2 },
  { tipo: 'esfera', color: C.ambar, pos: [-9.5, -5.2, -7], tam: 1.1 },
  { tipo: 'caja', color: C.ambar, pos: [4.2, 5.6, -9], tam: 1.4 },
  { tipo: 'toro', color: C.cielo, pos: [3.0, -6.6, -8], tam: 1.0 },
  { tipo: 'esfera', color: C.marcaIntensa, pos: [10.5, 0.4, -9], tam: 0.9 },
  { tipo: 'capsula', color: C.ambar, pos: [-11, 1.0, -9], tam: 1.1 },
  { tipo: 'caja', color: C.verde, pos: [-1.2, 5.6, -11], tam: 1.5 },
]
const FIGURAS_V: Figura[] = [
  { tipo: 'toro', color: C.marca, pos: [-3.2, 6.6, -4], tam: 1.2 },
  { tipo: 'esfera', color: C.cielo, pos: [3.5, 7.2, -6], tam: 1.3 },
  { tipo: 'caja', color: '#ffffff', pos: [-4.4, -6.4, -5], tam: 1.2 },
  { tipo: 'capsula', color: C.verde, pos: [4.0, -5.8, -3.5], tam: 1.1 },
  { tipo: 'esfera', color: C.ambar, pos: [-4.6, 1.2, -8], tam: 1.0 },
  { tipo: 'caja', color: C.ambar, pos: [4.8, 2.4, -9], tam: 1.3 },
  { tipo: 'toro', color: C.cielo, pos: [0.6, -9.4, -8], tam: 1.0 },
  { tipo: 'esfera', color: C.marcaIntensa, pos: [-1.5, 9.6, -9], tam: 0.9 },
]

export function Figuras({ frame, latido, vertical, entrada }: { frame: number; latido: number; vertical: boolean; entrada: number }) {
  const lista = vertical ? FIGURAS_V : FIGURAS_H
  return (
    <>
      {lista.map((f, i) => {
        const e = Math.min(1, Math.max(0, entrada * 1.6 - i * 0.06))
        const s = Math.max(0.001, f.tam * e * (1 + latido * 0.06))
        return (
          <mesh
            key={i}
            geometry={GEOS[f.tipo]}
            position={[f.pos[0], f.pos[1] + Math.sin(frame / 45 + i) * 0.3, f.pos[2] + (1 - e) * -6]}
            rotation={[frame * 0.006 * (i % 2 ? 1 : -1) + i, frame * 0.009 + i * 0.7, i * 0.4]}
            scale={s}
          >
            <meshPhysicalMaterial color={f.color} roughness={0.22} metalness={0.05} clearcoat={1} clearcoatRoughness={0.1} />
          </mesh>
        )
      })}
    </>
  )
}
