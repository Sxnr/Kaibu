// Recorrido por la app: un mismo teléfono 3D que gira entre escenas, con desplazamientos fluidos
// de pantallas reales y tarjetas que se elevan para destacar lo especial.
import { Ban, Moon, ShieldCheck, Smartphone, UtensilsCrossed, WifiOff, type LucideIcon } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { ANTICIPO, Aparece, BARRA_ESTADO, Elevar, Pantalla, PANTALLA_H, type Parte, Sonido, type Pose, Telefono, Titulo, Toque } from './componentes'
import { entre, mezclar, suave } from './util'
import type { Ritmo, Seccion } from './ritmo'
import { Aviso, ChipRacha, ChipRitmo, TarjetaAlimento, TarjetaCadena, TarjetaKcal, TarjetaMacros, TarjetaMeta, TarjetaPeso } from './Tarjetas'
import { C, DISPLAY, SANS } from './tema'

/** Interpola por tramos con curva suave. */
const entrada0 = (frame: number, fps: number) => spring({ frame, fps, config: { damping: 15, mass: 1.1 } })

function tramos(x: number, puntos: [number, number][]) {
  return interpolate(
    x,
    puntos.map((p) => p[0]),
    puntos.map((p) => p[1]),
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.65, 0, 0.35, 1) },
  )
}

interface Tramo {
  a: number
  d: number
}

const GIROS = [
  [-7, -3],
  [6, 3],
  [-6, -3],
]

export function Recorrido({ ritmo, secciones }: { ritmo: Ritmo; secciones: Seccion[] }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const v = ritmo.formato === 'vertical'
  const base = secciones[0].desde
  const S: Tramo[] = secciones.map((s) => ({ a: s.desde - base, d: s.dur }))
  const fin = S[3].a + S[3].d
  const k = v ? 1.08 : 0.92
  const latido = ritmo.latido(frame + base)

  // ¿En qué tramo estamos y cuánto llevamos (0..1)?
  const idx = frame < S[1].a ? 0 : frame < S[2].a ? 1 : frame < S[3].a ? 2 : 3
  const p = (i: number) => entre((frame - S[i].a) / S[i].d, 0, 1)
  const en = (i: number, x: number) => Math.round(S[i].a + S[i].d * x)

  /* ---------- Pose del teléfono ---------- */
  const xBase = v ? 0 : 340
  const yBase = v ? 330 : 20
  let ry: number
  let x = xBase
  let y = yBase
  if (idx < 3) {
    const [g0, g1] = GIROS[idx]
    const previo = idx === 0 ? -30 : GIROS[idx - 1][1]
    const cambio = suave(frame, S[idx].a, 18)
    ry = mezclar(previo, mezclar(g0, g1, p(idx)), cambio)
  } else {
    const centro = suave(frame, S[3].a, 18)
    x = mezclar(xBase, 0, centro)
    y = mezclar(yBase, v ? 360 : 40, centro)
    ry = mezclar(GIROS[2][1], 0, centro) + 360 * suave(frame, S[3].a + 8, 26)
  }
  // Zonas que se destacan (centro vertical en px de la app): el teléfono se acerca y las centra.
  const FOCOS: { en: number; hasta: number; y: number }[] = [
    { en: en(0, 0.08), hasta: en(0, 0.52), y: 218 },
    { en: en(0, 0.26), hasta: en(0, 0.56), y: 530 },
    { en: en(0, 0.66), hasta: en(0, 0.99), y: 255 },
    { en: en(1, 0.06), hasta: en(1, 0.3), y: 195 },
    { en: en(1, 0.36), hasta: en(1, 0.44), y: 405 },
    { en: en(1, 0.5), hasta: en(1, 0.6), y: 760 },
    { en: en(1, 0.68), hasta: en(1, 0.99), y: 530 },
    { en: en(2, 0.05), hasta: en(2, 0.42), y: 60 },
    { en: en(2, 0.13), hasta: en(2, 0.42), y: 335 },
    { en: en(2, 0.46), hasta: en(2, 0.74), y: 184 },
    { en: en(2, 0.76), hasta: en(2, 0.99), y: 520 },
  ]
  let fuerza = 0
  let suma = 0
  let ySuma = 0
  for (const f of FOCOS) {
    const e = suave(frame, f.en - ANTICIPO - 6, 16) * (1 - suave(frame, f.hasta - 4, 18))
    fuerza = Math.max(fuerza, e)
    suma += e
    ySuma += e * f.y
  }
  const yFoco = suma > 0 ? ySuma / suma : PANTALLA_H / 2
  const vivo = entrada0(frame, fps) * (1 - suave(frame, fin - 16, 16))
  const acerca = {
    x: (v ? 0 : -70) * fuerza + Math.sin(frame / 41) * 12 * vivo,
    y: (PANTALLA_H / 2 - (yFoco + BARRA_ESTADO)) * k * (v ? 0.22 : 0.5) * fuerza + Math.sin(frame / 26) * (v ? 9 : 14) * vivo,
    z: (v ? 90 : 210) * fuerza,
    rx: -6 * fuerza + Math.sin(frame / 45) * 2.2 * vivo,
    ry: (v ? 0 : 3) * fuerza + Math.sin(frame / 53) * 2 * vivo,
    rz: Math.sin(frame / 37) * 1.6 * vivo,
  }
  const transicion = idx > 0 ? Math.sin(entre((frame - S[idx].a) / 18, 0, 1) * Math.PI) : 0
  const entrada = entrada0(frame, fps)
  const salida = suave(frame, fin - 16, 16)
  const pose: Pose = {
    x: x + (1 - entrada) * 700 + acerca.x,
    y: y + (1 - entrada) * 900 + salida * 1400 + acerca.y,
    z: (1 - entrada) * -900 - transicion * 140 + acerca.z,
    rx: (1 - entrada) * 55 + (v ? 4 : 6) + salida * 35 + acerca.rx,
    ry: ry + (1 - entrada) * -25 + acerca.ry,
    rz: (1 - entrada) * 8 + acerca.rz,
  }
  const enEspiral = idx === 3 && suave(frame, S[3].a + 8, 26) > 0.5

  /* ---------- Pantalla según el tramo ---------- */
  let pantalla: ReactNode
  let encima: ReactNode = null
  if (idx === 0) {
    const q = p(0)
    const atenuar = Math.max(entre((q - 0.06) * 10, 0, 1) * (q < 0.55 ? 1 : 0), q > 0.64 ? 1 : 0)
    pantalla = <Pantalla k={k} src="tu-plan" scroll={tramos(q, [[0, 0], [0.4, 0], [0.64, 620], [1, 640]])} atenuar={atenuar} />
    encima = (
      <>
        <Elevar k={k} de={{ x: 20, y: 133, w: 350 }} alto={170} conteo a={v ? { dx: 110, dy: 40, z: 300, ry: -4 } : { dx: 250, dy: -60, z: 230, ry: 5 }} en={en(0, 0.08)} hasta={en(0, 0.52)} flotar={1}>
          <TarjetaMeta k={k} t={frame - en(0, 0.08)} />
        </Elevar>
        <Elevar k={k} de={{ x: 20, y: 470, w: 350 }} alto={120} a={v ? { dx: -70, dy: -170, z: 300, ry: 4 } : { dx: 250, dy: 60, z: 250, ry: 5 }} en={en(0, 0.26)} hasta={en(0, 0.56)} flotar={1}>
          <TarjetaCadena k={k} t={frame - en(0, 0.26)} />
        </Elevar>
        <Elevar k={k} de={{ x: 20, y: 75, w: 350 }} alto={360} conteo a={v ? { dx: 110, dy: 380, z: 300, ry: -4 } : { dx: 250, dy: 60, z: 240, ry: 5 }} en={en(0, 0.66)} hasta={en(0, 0.99)} flotar={1}>
          <TarjetaMacros k={k} t={frame - en(0, 0.66)} />
        </Elevar>
      </>
    )
  } else if (idx === 1) {
    const q = p(1)
    const tecleado = 'marraq'.slice(0, Math.floor(entre((q - 0.08) / 0.17, 0, 1) * 6))
    const busqueda = entre((q - 0.3) * 30, 0, 1)
    const ficha = entre((q - 0.42) * 30, 0, 1)
    const vuelta = entre((q - 0.62) * 30, 0, 1)
    const avisoEntra = spring({ frame: frame - en(1, 0.63), fps, config: { damping: 14 } })
    const aviso = avisoEntra * (1 - entre((q - 0.86) * 16, 0, 1))
    const atenuar = q > 0.66 ? 1 : 0
    pantalla = (
      <>
        <Pantalla k={k} src="agregar" barra="barra-agregar" atenuar={atenuar}>
          {/* Texto que se va escribiendo en el buscador */}
          <div style={{ position: 'absolute', left: 60 * k, top: (BARRA_ESTADO + 172) * k, width: 290 * k, height: 46 * k, background: C.superficie, display: 'flex', alignItems: 'center', fontFamily: SANS, fontSize: 18 * k, color: C.texto }}>
            {tecleado || <span style={{ color: C.secundario }}>Busca: marraqueta, pollo, palta..</span>}
            {tecleado && <span style={{ width: 2 * k, height: 22 * k, marginLeft: 2 * k, background: C.marca, opacity: Math.floor(frame / 8) % 2 ? 1 : 0.2 }} />}
          </div>
        </Pantalla>
        {busqueda > 0 && vuelta < 1 && <Pantalla k={k} src="agregar-busqueda" opacidad={busqueda * (1 - vuelta)} />}
        {ficha > 0 && vuelta < 1 && (
          <div style={{ position: 'absolute', inset: 0, opacity: ficha * (1 - vuelta), transform: `translateY(${(1 - ficha) * 12}%)` }}>
            <Pantalla k={k} src="ficha" />
          </div>
        )}
        <Toque k={k} x={195} y={405} en={en(1, 0.37)} />
        <Toque k={k} x={221} y={799} en={en(1, 0.56)} />
        {aviso > 0.01 && (
          <div style={{ position: 'absolute', left: 16 * k, right: 16 * k, bottom: 80 * k, transform: `translateY(${(1 - avisoEntra) * 140 * k}px)`, opacity: aviso }}>
            <Aviso k={k} texto="Marraqueta agregado a Cena" detalle="1 unidad · 275 kcal" />
          </div>
        )}
      </>
    )
    const alimentos = [
      { n: 'Marraqueta', d: '1 unidad (100 g) · 275 kcal', y: 565, h: v ? { dx: -120, dy: -580, z: 320 } : { dx: 240, dy: -380, z: 220, ry: 5 } },
      { n: 'Palta', d: '1/4 de palta (40 g) · 64 kcal', y: 509, h: v ? { dx: 120, dy: -360, z: 340 } : { dx: 260, dy: -180, z: 250, ry: 5 } },
      { n: 'Huevo', d: '1 unidad (50 g) · 72 kcal', y: 453, h: v ? { dx: -120, dy: -140, z: 360 } : { dx: 240, dy: 20, z: 280, ry: 5 } },
    ]
    encima = alimentos.map((a, i) => (
      <Elevar key={a.n} k={k} de={{ x: 16, y: a.y, w: 358 }} alto={52} a={a.h} en={en(1, 0.68 + i * 0.07)} hasta={en(1, 0.99)} flotar={1}>
        <TarjetaAlimento k={k} t={frame - en(1, 0.68 + i * 0.07)} nombre={a.n} detalle={a.d} />
      </Elevar>
    ))
  } else if (idx === 2) {
    const q = p(2)
    const desliza = entre((q - 0.56) / 0.08, 0, 1)
    const curva = Easing.bezier(0.65, 0, 0.35, 1)(desliza)
    const atenuar = q > 0.05 && q < 0.42 ? 1 : q > 0.46 && q < 0.56 ? 1 : q > 0.72 ? 1 : 0
    pantalla = (
      <>
        <Pantalla k={k} src="hoy" barra="barra-hoy" scroll={tramos(q, [[0, 0], [0.32, 0], [0.45, 420]])} x={-100 * curva} atenuar={atenuar} />
        {desliza > 0 && <Pantalla k={k} src="progreso" barra="barra-progreso" scroll={tramos(q, [[0.64, 0], [0.86, 0], [1, 240]])} x={100 - 100 * curva} atenuar={atenuar} />}
        <Toque k={k} x={242} y={810} en={en(2, 0.54)} />
      </>
    )
    encima = (
      <>
        <Elevar k={k} de={{ x: 278, y: 22, w: 96 }} alto={36} conteo a={v ? { dx: -40, dy: 10, z: 320, escala: 1.6 } : { dx: 120, dy: 30, z: 260, ry: 5, escala: 1.6 }} en={en(2, 0.05)} hasta={en(2, 0.42)} flotar={1}>
          <ChipRacha k={k} t={frame - en(2, 0.05)} />
        </Elevar>
        <Elevar k={k} de={{ x: 16, y: 193, w: 358 }} alto={285} conteo a={v ? { dx: -60, dy: 220, z: 280, ry: 4 } : { dx: 250, dy: 80, z: 240, ry: 5 }} en={en(2, 0.13)} hasta={en(2, 0.42)} flotar={1}>
          <TarjetaKcal k={k} t={frame - en(2, 0.13)} />
        </Elevar>
        <Elevar k={k} de={{ x: 16, y: 74, w: 358 }} alto={220} conteo a={v ? { dx: 90, dy: 300, z: 300, ry: -4 } : { dx: 250, dy: 40, z: 250, ry: 5 }} en={en(2, 0.46)} hasta={en(2, 0.74)} flotar={1}>
          <TarjetaPeso k={k} t={frame - en(2, 0.46)} />
        </Elevar>
        <Elevar k={k} de={{ x: 16, y: 427, w: 358 }} alto={190} conteo a={v ? { dx: -60, dy: 200, z: 280, ry: 4 } : { dx: 250, dy: 60, z: 250, ry: 5 }} en={en(2, 0.76)} hasta={en(2, 0.99)} flotar={1}>
          <ChipRitmo k={k} t={frame - en(2, 0.76)} />
        </Elevar>
      </>
    )
  } else {
    pantalla = enEspiral ? <Pantalla k={k} src="hoy-oscuro" oscuro /> : <Pantalla k={k} src="hoy-pantalla" />
  }

  const teclas = [1, 2, 3, 4, 5, 6].map((n) => en(1, 0.08 + (n * 0.17) / 6))
  const sonidos = (
    <>
      <Sonido efecto="whoosh-grave" en={0} vol={0.5} />
      <Sonido efecto="whoosh" en={S[1].a - 2} vol={0.45} />
      <Sonido efecto="whoosh" en={S[2].a - 2} vol={0.45} />
      <Sonido efecto="whoosh-grave" en={S[3].a} vol={0.45} />
      <Sonido efecto="swish" en={S[3].a + 12} vol={0.4} />
      <Sonido efecto="brillo" en={S[3].a + 21} vol={0.22} />
      <Sonido efecto="whoosh-grave" en={fin - 16} vol={0.4} />
      {/* Desplazamientos */}
      <Sonido efecto="whoosh-corto" en={en(0, 0.4)} vol={0.2} />
      <Sonido efecto="whoosh-corto" en={en(2, 0.32)} vol={0.2} />
      <Sonido efecto="swish" en={en(2, 0.56)} vol={0.32} />
      <Sonido efecto="whoosh-corto" en={en(2, 0.86)} vol={0.2} />
      {/* Registrar: escribir, buscar, agregar */}
      {teclas.map((t, n) => (
        <Sonido key={n} efecto="tecla" en={t} vol={0.6} tono={1 + (n % 3) * 0.08} />
      ))}
      <Sonido efecto="swish" en={en(1, 0.3)} vol={0.22} />
      <Sonido efecto="whoosh-corto" en={en(1, 0.42)} vol={0.3} />
      <Sonido efecto="pop" en={en(1, 0.63)} vol={0.45} tono={0.8} />
      {[0, 1, 2].map((n) => (
        <Sonido key={n} efecto="ding" en={en(1, 0.68 + n * 0.07) + 12} vol={0.22} tono={1.2 + n * 0.12} />
      ))}
    </>
  )

  return (
    <AbsoluteFill>
      {sonidos}
      {/* Textos de cada escena */}
      {idx < 3 && <Textos idx={idx} S={S} v={v} />}
      {idx === 3 && <Beneficios desde={S[3].a} hasta={fin} v={v} pulso={Math.round(ritmo.pulso * 30)} latido={latido} />}

      {/* Sombra en el piso */}
      <div
        style={{
          position: 'absolute',
          left: `calc(50% + ${pose.x}px)`,
          top: `calc(50% + ${pose.y + (v ? 600 : 410)}px)`,
          width: v ? 620 : 500,
          height: 90,
          marginLeft: v ? -310 : -250,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(0,0,0,0.55), transparent)',
          opacity: entrada * (1 - salida),
        }}
      />
      <AbsoluteFill style={{ perspective: v ? 2600 : 2200, transformStyle: 'preserve-3d' }}>
        <Telefono k={k} pose={{ ...pose, y: pose.y - latido * 4 }} pantalla={pantalla} encima={encima} />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ---------- Textos ---------- */

const TEXTOS: { rotulo: string; titulo: Parte[]; sub: string }[] = [
  {
    rotulo: '01 · Tu plan',
    titulo: [{ t: 'Tu plan, con' }, { t: 'cada número', pildora: C.marca }, { t: 'explicado.' }],
    sub: 'La misma fórmula, pero gratis. Y te mostramos de dónde sale cada valor.',
  },
  {
    rotulo: '02 · Registrar',
    titulo: [{ t: 'Anota una comida' }, { t: 'en segundos.', pildora: C.ambar, colorPildora: C.texto }],
    sub: 'Marraqueta, palta, once: más de 100 alimentos chilenos, con su fuente.',
  },
  {
    rotulo: '03 · Progreso',
    titulo: [{ t: 'Mira tu' }, { t: 'avance real.', pildora: C.verde, colorPildora: C.texto }],
    sub: 'Tu racha, tu promedio de 7 días y cuándo llegas a tu meta.',
  },
]

function Textos({ idx, S, v }: { idx: number; S: Tramo[]; v: boolean }) {
  const x = TEXTOS[idx]
  const desde = S[idx].a + 6
  const hasta = S[idx].a + S[idx].d
  const caja = v
    ? { position: 'absolute' as const, top: 130, left: 70, right: 70, textAlign: 'center' as const }
    : { position: 'absolute' as const, top: 300, left: 120, width: 720 }
  return (
    <div style={caja}>
      <Aparece desde={desde} hasta={hasta} style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: v ? 36 : 32, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#e8555c', marginBottom: 18 }}>
        {x.rotulo}
      </Aparece>
      <Titulo partes={x.titulo} desde={desde + 3} hasta={hasta} tam={v ? 84 : 76} alinear={v ? 'center' : 'left'} />
      <Aparece desde={desde + 16} hasta={hasta} style={{ marginTop: 26, fontFamily: SANS, fontSize: v ? 34 : 30, lineHeight: 1.4, color: C.tintaSuave, maxWidth: v ? 'none' : 640 }}>
        {x.sub}
      </Aparece>
    </div>
  )
}

/* ---------- Beneficios ---------- */

const BENEFICIOS: { icono: LucideIcon; titulo: string; sub: string; color: string }[] = [
  { icono: UtensilsCrossed, titulo: 'Hecha en Chile', sub: 'Marraqueta, once y colaciones', color: C.marca },
  { icono: WifiOff, titulo: 'Funciona sin internet', sub: 'Se sincroniza al volver', color: C.cielo },
  { icono: ShieldCheck, titulo: 'Tus datos son tuyos', sub: 'Solo tú los ves', color: C.verde },
  { icono: Ban, titulo: 'Sin publicidad', sub: 'Nada de anuncios', color: C.ambar },
  { icono: Moon, titulo: 'Claro u oscuro', sub: 'Como prefieras', color: '#8b7cf6' },
  { icono: Smartphone, titulo: 'Web y Android', sub: 'Misma cuenta, mismos datos', color: C.marcaIntensa },
]

function Beneficios({ desde, hasta, v, pulso, latido }: { desde: number; hasta: number; v: boolean; pulso: number; latido: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const salida = suave(frame, hasta - 12, 12)
  const ancho = v ? 470 : 400
  const lugar = (i: number) =>
    v ? { left: i % 2 ? 560 : 50, top: 130 + Math.floor(i / 2) * 170 } : { left: i < 3 ? 110 : 1410, top: 230 + (i % 3) * 220 }
  return (
    <AbsoluteFill style={{ perspective: 1800 }}>
      {BENEFICIOS.map((b, i) => {
        const en = desde + 6 + i * Math.max(4, Math.round(pulso / 2))
        const q = spring({ frame: frame - en, fps, config: { damping: 13 } })
        const sonido = <Sonido key={`s${i}`} efecto="pop" en={en} vol={0.42} tono={0.9 + i * 0.06} />
        if (q <= 0.001) return sonido
        const Icono = b.icono
        const lado = v ? (i % 2 ? 1 : -1) : i < 3 ? -1 : 1
        return (
          <Fragment key={b.titulo}>
          {sonido}
          <div
            style={{
              position: 'absolute',
              ...lugar(i),
              width: ancho,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: v ? '22px 24px' : '24px 26px',
              borderRadius: 28,
              background: 'rgba(32,27,27,0.78)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
              opacity: q * (1 - salida),
              transform: `translateZ(${(1 - q) * -400}px) rotateY(${(1 - q) * 80 * lado + Math.sin((frame + i * 9) / 30) * 4}deg) translateY(${Math.sin((frame + i * 13) / 26) * 6 - salida * 40}px) scale(${1 + latido * 0.02})`,
            }}
          >
            <span style={{ width: 64, height: 64, borderRadius: 18, background: b.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icono size={34} color="#fff" />
            </span>
            <span>
              <span style={{ display: 'block', fontFamily: SANS, fontWeight: 650, fontSize: v ? 32 : 30, color: C.tinta, letterSpacing: '-0.02em' }}>{b.titulo}</span>
              <span style={{ display: 'block', fontFamily: SANS, fontSize: v ? 24 : 22, color: C.tintaSuave, marginTop: 4 }}>{b.sub}</span>
            </span>
          </div>
          </Fragment>
        )
      })}
    </AbsoluteFill>
  )
}
