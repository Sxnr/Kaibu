// Video 4 · Carne molida 5 % vs 10 %: "quiz". Pregunta con opciones A/B, cuenta regresiva para
// que la gente piense (y comente) y luego la revelación con los números de Kaibu.
import { Beef, PiggyBank } from 'lucide-react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Sonido } from '../componentes'
import { C, DISPLAY, SANS } from '../tema'
import { entre } from '../util'
import { Fondo, Grande, Momento, Sello, TelefonoKaibu, s, useConteo, useResorte, useTramo } from './comunes'

function Opcion({ letra, titulo, color, kcal, prote, lado, gana }: { letra: string; titulo: string; color: string; kcal: number; prote: string; lado: 'izq' | 'der'; gana: boolean }) {
  const frame = useCurrentFrame()
  const p = useResorte(lado === 'izq' ? 0.76 : 1.6, { damping: 12 })
  const giro = useTramo(5.82, 6.3)
  const verdicto = useResorte(23.62, { damping: 10 })
  const enDeficit = frame >= s(23.62)
  return (
    <div style={{ position: 'absolute', top: 330, width: 450, [lado === 'izq' ? 'left' : 'right']: 60, transform: `translateY(${(1 - p) * 300}px) rotateY(${Math.sin(giro * Math.PI) * 25}deg) scale(${enDeficit ? (gana ? 1 + 0.06 * verdicto : 1 - 0.08 * verdicto) : 1})`, opacity: entre(p * 1.5, 0, 1) * (enDeficit && !gana ? 1 - 0.45 * verdicto : 1) }}>
      <div style={{ borderRadius: 40, padding: '34px 30px', background: C.nocheSuperficie, border: `5px solid ${enDeficit && gana ? C.verde : color}`, boxShadow: `0 30px 70px rgba(0,0,0,0.5)`, textAlign: 'center', fontFamily: SANS, color: C.tinta }}>
        <div style={{ display: 'grid', placeItems: 'center', width: 120, height: 120, margin: '0 auto', borderRadius: 999, background: color, color: C.noche, fontFamily: DISPLAY, fontWeight: 800, fontSize: 90 }}>{letra}</div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', fontSize: 44, fontWeight: 750 }}>
          <Beef size={46} color={color} /> {titulo}
        </div>
        <div style={{ height: 300, marginTop: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: giro }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 150, lineHeight: 1 }}>{kcal || '—'}</div>
          <div style={{ fontSize: 34, color: C.tintaSuave, fontWeight: 650 }}>kcal · 120 g cocida</div>
          <div style={{ marginTop: 16, fontFamily: DISPLAY, fontWeight: 800, fontSize: 80, color: C.cielo, opacity: useTramo(14.5, 14.9) }}>{prote}</div>
        </div>
      </div>
    </div>
  )
}

function Cuenta() {
  const frame = useCurrentFrame()
  const t = frame / 30
  if (t < 4.5 || t > 5.85) return null
  const n = t < 4.95 ? 3 : t < 5.4 ? 2 : 1
  const local = (t - (n === 3 ? 4.5 : n === 2 ? 4.95 : 5.4)) / 0.45
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 990, display: 'flex', justifyContent: 'center' }}>
      <Sonido efecto="tic" en={s(4.5)} vol={0.5} />
      <Sonido efecto="tic" en={s(4.95)} vol={0.5} />
      <Sonido efecto="tic" en={s(5.4)} vol={0.5} />
      <div style={{ width: 230, height: 230, borderRadius: 999, border: `12px solid ${C.ambar}`, display: 'grid', placeItems: 'center', fontFamily: DISPLAY, fontWeight: 800, fontSize: 150, color: C.ambar, transform: `scale(${1.3 - 0.3 * entre(local * 3, 0, 1)})` }}>{n}</div>
    </div>
  )
}

export function V4Quiz() {
  const frame = useCurrentFrame()
  const a = useConteo(0, 197, 8.32, 0.9)
  const b = useConteo(0, 260, 12.0, 0.9)
  const semana = useConteo(63, 315, 22.1, 0.8)
  return (
    <AbsoluteFill>
      <Fondo centro="#1c1a2b" borde="#08070c" />
      <Momento desde={0} hasta={28.2}>
        <Grande texto={frame < s(5.82) ? '¿Cuál elegirías?' : 'La respuesta'} en={frame < s(5.82) ? 0.76 : 5.82} tam={96} color={C.ambar} style={{ top: 150 }} sonido={frame < s(5.82) ? 'ding' : 'brillo'} />
        <Opcion letra="A" titulo="5 % grasa" color={C.cielo} kcal={frame >= s(8.32) ? a : 0} prote="30 g prot." lado="izq" gana />
        <Opcion letra="B" titulo="10 % grasa" color={C.marcaIntensa} kcal={frame >= s(12.0) ? b : 0} prote="31 g prot." lado="der" gana={false} />
        <Momento desde={3.9} hasta={5.8}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1300, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 52, color: C.tinta }}>Comenta A o B</div>
        </Momento>
        <Cuenta />
        <Momento desde={16.16} hasta={17.9}>
          <Grande texto="≈ igual" en={16.16} tam={110} color={C.cielo} style={{ top: 1010 }} sonido="pop" />
        </Momento>
        <Momento desde={17.98} hasta={23.5}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 990, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 800, color: C.tinta }}>
            <div style={{ fontSize: 120, lineHeight: 1, color: C.marcaIntensa }}>{frame >= s(20.72) ? `${semana}` : '63'} kcal</div>
            <div style={{ fontSize: 56, color: C.tintaSuave, letterSpacing: '0.08em' }}>{frame >= s(20.72) ? 'DE DIFERENCIA A LA SEMANA (×5)' : 'DE DIFERENCIA POR PORCIÓN'}</div>
          </div>
        </Momento>
        <Momento desde={23.62} hasta={28.2}>
          <Sello texto="DÉFICIT → A" en={23.62} color={C.verde} rot={-5} tam={84} style={{ left: 0, right: 0, top: 1010 }} />
          <Momento desde={25.88} hasta={28.2}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 1180, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: C.ambar }}>
              <PiggyBank size={60} /> {frame >= s(27.62) ? 'Volumen: la más barata' : 'Volumen: da lo mismo'}
            </div>
          </Momento>
        </Momento>
      </Momento>
      <TelefonoKaibu src="e3-ficha-carne5" desde={28.38} hasta={29.7} k={0.95} y={-70} giro={-8} />
      <TelefonoKaibu src="e3-ficha-carne10" desde={29.7} hasta={30.95} k={0.95} y={-70} giro={8} />
    </AbsoluteFill>
  )
}
