// Recorrido por la app: un mismo teléfono 3D que gira entre escenas, con desplazamientos fluidos
// de pantallas reales y tarjetas que se elevan para destacar lo especial.
import { Ban, Moon, ShieldCheck, Smartphone, UtensilsCrossed, WifiOff, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { Aparece, BARRA_ESTADO, Elevar, Pantalla, type Parte, type Pose, Telefono, Titulo, Toque } from './componentes'
import { entre, mezclar, suave } from './util'
import type { Ritmo, Seccion } from './ritmo'
import { Aviso, ChipRacha, ChipRitmo, TarjetaAlimento, TarjetaCadena, TarjetaKcal, TarjetaMacros, TarjetaMeta, TarjetaPeso } from './Tarjetas'
import { C, DISPLAY, SANS } from './tema'

/** Interpola por tramos con curva suave. */
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
  [-18, -10],
  [16, 9],
  [-16, -9],
]

export function Recorrido({ ritmo, secciones }: { ritmo: Ritmo; secciones: Seccion[] }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const v = ritmo.formato === 'vertical'
  const base = secciones[0].desde
  const S: Tramo[] = secciones.map((s) => ({ a: s.desde - base, d: s.dur }))
  const fin = S[3].a + S[3].d
  const k = v ? 1.25 : 0.92
  const latido = ritmo.latido(frame + base)

  // ¿En qué tramo estamos y cuánto llevamos (0..1)?
  const idx = frame < S[1].a ? 0 : frame < S[2].a ? 1 : frame < S[3].a ? 2 : 3
  const p = (i: number) => entre((frame - S[i].a) / S[i].d, 0, 1)
  const en = (i: number, x: number) => Math.round(S[i].a + S[i].d * x)

  /* ---------- Pose del teléfono ---------- */
  const xBase = v ? 0 : 340
  const yBase = v ? 300 : 20
  let ry: number
  let x = xBase
  let y = yBase
  if (idx < 3) {
    const [g0, g1] = GIROS[idx]
    const previo = idx === 0 ? -60 : GIROS[idx - 1][1]
    const cambio = suave(frame, S[idx].a, 18)
    ry = mezclar(previo, mezclar(g0, g1, p(idx)), cambio)
  } else {
    const centro = suave(frame, S[3].a, 18)
    x = mezclar(xBase, 0, centro)
    y = mezclar(yBase, v ? 330 : 40, centro)
    ry = mezclar(GIROS[2][1], 0, centro) + 360 * suave(frame, S[3].a + 8, 26)
  }
  const transicion = idx > 0 ? Math.sin(entre((frame - S[idx].a) / 18, 0, 1) * Math.PI) : 0
  const entrada = spring({ frame, fps, config: { damping: 15, mass: 1.1 } })
  const salida = suave(frame, fin - 16, 16)
  const pose: Pose = {
    x: x + (1 - entrada) * 700,
    y: y + (1 - entrada) * 900 + salida * 1400,
    z: (1 - entrada) * -900 - transicion * 140,
    rx: (1 - entrada) * 55 + (v ? 4 : 6) + salida * 35,
    ry: ry + (1 - entrada) * -40,
    rz: (1 - entrada) * 8,
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
        <Elevar k={k} de={{ x: 20, y: 133, w: 350 }} a={v ? { dx: 110, dy: 40, z: 300, ry: -10 } : { dx: 250, dy: -60, z: 230, ry: 12 }} en={en(0, 0.08)} hasta={en(0, 0.52)} flotar={1}>
          <TarjetaMeta k={k} t={frame - en(0, 0.08)} />
        </Elevar>
        <Elevar k={k} de={{ x: 20, y: 470, w: 350 }} a={v ? { dx: -70, dy: -170, z: 300, ry: 10 } : { dx: 250, dy: 60, z: 250, ry: 12 }} en={en(0, 0.26)} hasta={en(0, 0.56)} flotar={1}>
          <TarjetaCadena k={k} t={frame - en(0, 0.26)} />
        </Elevar>
        <Elevar k={k} de={{ x: 20, y: 75, w: 350 }} a={v ? { dx: 110, dy: 380, z: 300, ry: -10 } : { dx: 250, dy: 60, z: 240, ry: 12 }} en={en(0, 0.66)} hasta={en(0, 0.99)} flotar={1}>
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
    const aviso = spring({ frame: frame - en(1, 0.63), fps, config: { damping: 14 } }) * (1 - entre((q - 0.9) * 12, 0, 1))
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
          <div style={{ position: 'absolute', left: 16 * k, right: 16 * k, bottom: 80 * k, transform: `translateY(${(1 - aviso) * 140 * k}px)`, opacity: aviso }}>
            <Aviso k={k} texto="Marraqueta agregado a Cena" detalle="1 unidad · 275 kcal" />
          </div>
        )}
      </>
    )
    const alimentos = [
      { n: 'Marraqueta', d: '1 unidad (100 g) · 275 kcal', y: 565, h: v ? { dx: -120, dy: -580, z: 320 } : { dx: 240, dy: -380, z: 220, ry: 12 } },
      { n: 'Palta', d: '1/4 de palta (40 g) · 64 kcal', y: 509, h: v ? { dx: 120, dy: -360, z: 340 } : { dx: 260, dy: -180, z: 250, ry: 12 } },
      { n: 'Huevo', d: '1 unidad (50 g) · 72 kcal', y: 453, h: v ? { dx: -120, dy: -140, z: 360 } : { dx: 240, dy: 20, z: 280, ry: 12 } },
    ]
    encima = alimentos.map((a, i) => (
      <Elevar key={a.n} k={k} de={{ x: 16, y: a.y, w: 358 }} a={a.h} en={en(1, 0.68 + i * 0.07)} hasta={en(1, 0.99)} flotar={1}>
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
        <Elevar k={k} de={{ x: 278, y: 22, w: 96 }} a={v ? { dx: -40, dy: 10, z: 320, escala: 1.6 } : { dx: 120, dy: 30, z: 260, ry: 12, escala: 1.6 }} en={en(2, 0.05)} hasta={en(2, 0.42)} flotar={1}>
          <ChipRacha k={k} t={frame - en(2, 0.05)} />
        </Elevar>
        <Elevar k={k} de={{ x: 16, y: 193, w: 358 }} a={v ? { dx: -60, dy: 220, z: 280, ry: 8 } : { dx: 250, dy: 80, z: 240, ry: 12 }} en={en(2, 0.13)} hasta={en(2, 0.42)} flotar={1}>
          <TarjetaKcal k={k} t={frame - en(2, 0.13)} />
        </Elevar>
        <Elevar k={k} de={{ x: 16, y: 74, w: 358 }} a={v ? { dx: 90, dy: 300, z: 300, ry: -8 } : { dx: 250, dy: 40, z: 250, ry: 12 }} en={en(2, 0.46)} hasta={en(2, 0.74)} flotar={1}>
          <TarjetaPeso k={k} t={frame - en(2, 0.46)} />
        </Elevar>
        <Elevar k={k} de={{ x: 16, y: 427, w: 358 }} a={v ? { dx: -60, dy: 200, z: 280, ry: 8 } : { dx: 250, dy: 60, z: 250, ry: 12 }} en={en(2, 0.76)} hasta={en(2, 0.99)} flotar={1}>
          <ChipRitmo k={k} t={frame - en(2, 0.76)} />
        </Elevar>
      </>
    )
  } else {
    pantalla = enEspiral ? <Pantalla k={k} src="hoy-oscuro" oscuro /> : <Pantalla k={k} src="hoy-pantalla" />
  }

  return (
    <AbsoluteFill>
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
        if (q <= 0.001) return null
        const Icono = b.icono
        const lado = v ? (i % 2 ? 1 : -1) : i < 3 ? -1 : 1
        return (
          <div
            key={b.titulo}
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
        )
      })}
    </AbsoluteFill>
  )
}
