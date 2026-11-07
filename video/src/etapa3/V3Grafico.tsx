// Video 3 · "Tu peso te miente": el gráfico cuenta la historia. Pesos diarios que saltan por agua y sal,
// y encima, tranquila, la línea del promedio de 7 días que sí baja. Ritmo lento y colores fríos.
import { TrendingDown, TrendingUp } from 'lucide-react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Sonido } from '../componentes'
import { TarjetaAjuste } from '../Tarjetas'
import { C, DISPLAY, SANS } from '../tema'
import { decimal, entre } from '../util'
import { Fondo, Grande, Momento, TelefonoKaibu, s, useResorte, useTramo } from './comunes'

// 21 días: baja ~1 kg en total, con saltos diarios de hasta ±0,8 kg (agua y sal).
const RUIDO = [0, 0.6, -0.3, 0.8, -0.5, 0.2, 0.7, -0.6, 0.1, 0.5, -0.4, 0.9, -0.2, 0.3, -0.7, 0.6, 0.0, -0.3, 0.7, -0.1, 0.8]
const PESOS = RUIDO.map((r, i) => 83 - i * 0.05 + r)
const PROMEDIO = PESOS.map((_, i) => {
  const v = PESOS.slice(Math.max(0, i - 6), i + 1)
  return v.reduce((a, b) => a + b, 0) / v.length
})

const G = { x: 90, y: 560, w: 900, h: 560, min: 81.6, max: 84.0 }
const px = (i: number) => G.x + (i / (PESOS.length - 1)) * G.w
const py = (kg: number) => G.y + (1 - (kg - G.min) / (G.max - G.min)) * G.h

function Balanza() {
  const frame = useCurrentFrame()
  const t = frame / 30
  const valor = t < 3 ? 82.4 : t < 4.06 ? 82.9 : 83.1
  const sube = useResorte(4.06, { damping: 9 })
  return (
    <div style={{ position: 'absolute', left: 190, right: 190, top: 640, borderRadius: 60, background: '#e9eef2', padding: '60px 40px', boxShadow: '0 40px 90px rgba(0,0,0,0.55)', textAlign: 'center' }}>
      <Sonido efecto="blip" en={s(3)} vol={0.4} />
      <Sonido efecto="blip" en={s(4.06)} vol={0.5} tono={1.2} />
      <div style={{ borderRadius: 26, background: '#1a2a33', padding: '24px 20px', fontFamily: DISPLAY, fontWeight: 700, fontSize: 190, color: '#9fe3ff', letterSpacing: '0.04em' }}>{decimal(valor)}</div>
      <div style={{ marginTop: 26, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: C.marcaIntensa, opacity: sube, transform: `scale(${0.6 + 0.4 * sube})` }}>
        <TrendingUp size={56} /> +0,7 kg
      </div>
    </div>
  )
}

function Grafico() {
  const frame = useCurrentFrame()
  const puntos = useTramo(5.58, 9.6)
  const linea = useTramo(13.06, 15.4)
  const visibles = Math.floor(puntos * PESOS.length)
  const hoy = useResorte(9.84, { damping: 10 })
  const frustra = useResorte(11.78, { damping: 9 })
  const atenua = 1 - 0.65 * useTramo(13.0, 13.6)
  const largo = PROMEDIO.length - 1
  const hasta = linea * largo
  const camino = PROMEDIO.slice(0, Math.floor(hasta) + 1).map((kg, i) => `${i ? 'L' : 'M'}${px(i)},${py(kg)}`)
  if (linea > 0 && hasta % 1 > 0) {
    const i = Math.floor(hasta)
    const a = PROMEDIO[i]!
    const b = PROMEDIO[i + 1] ?? a
    camino.push(`L${px(i + (hasta % 1))},${py(a + (b - a) * (hasta % 1))}`)
  }
  const ultimo = PESOS.length - 1
  return (
    <>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        {[82, 83, 84].map((kg) => (
          <g key={kg}>
            <line x1={G.x} x2={G.x + G.w} y1={py(kg)} y2={py(kg)} stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
            <text x={G.x + G.w} y={py(kg) - 12} fill={C.tintaSuave} fontFamily="Inter" fontSize={30} textAnchor="end">{kg} kg</text>
          </g>
        ))}
        {PESOS.slice(0, visibles).map((kg, i) => {
          const j = i > 0 ? PESOS[i - 1]! : kg
          return (
            <g key={i} opacity={atenua}>
              {i > 0 && <line x1={px(i - 1)} y1={py(j)} x2={px(i)} y2={py(kg)} stroke="rgba(159,227,255,0.35)" strokeWidth={4} />}
              <circle cx={px(i)} cy={py(kg)} r={i === ultimo ? 16 : 11} fill={i === ultimo && frame >= s(9.84) ? C.marcaIntensa : '#9fe3ff'} />
            </g>
          )
        })}
        {linea > 0 && <path d={camino.join(' ')} fill="none" stroke={C.verde} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 18px rgba(140,192,132,0.7))' }} />}
      </svg>
      {frame >= s(9.84) && (
        <div style={{ position: 'absolute', left: px(ultimo) - 420, top: py(PESOS[ultimo]!) - 190, width: 400, borderRadius: 26, background: C.marca, padding: '18px 24px', fontFamily: SANS, fontWeight: 800, fontSize: 46, color: '#fff', textAlign: 'center', transform: `scale(${hoy})`, transformOrigin: 'right bottom', opacity: atenua }}>
          <Sonido efecto="pop" en={s(9.84)} vol={0.45} />
          Hoy: +0,8 kg
          <div style={{ fontSize: 38, fontWeight: 650, opacity: frustra, marginTop: 4 }}>“¿Otra vez subí?”</div>
        </div>
      )}
      {linea > 0.2 && (
        <div style={{ position: 'absolute', left: G.x, top: G.y + G.h + 40, display: 'flex', alignItems: 'center', gap: 16, fontFamily: SANS, fontWeight: 800, fontSize: 48, color: C.verde, opacity: entre((linea - 0.2) * 3, 0, 1) }}>
          <TrendingDown size={58} /> Promedio de 7 días: va bajando
        </div>
      )}
    </>
  )
}

export function V3Grafico() {
  const frame = useCurrentFrame()
  const entra = useTramo(17.74, 18.1)
  const sube = useTramo(17.74, 18.2)
  const sale = useTramo(21.0, 21.3)
  return (
    <AbsoluteFill>
      <Fondo centro="#13212b" borde="#060a0d" />
      <Momento desde={0} hasta={5.5}>
        <Grande texto="2 semanas sin bajar" en={1.9} tam={110} color={C.tinta} style={{ top: 330 }} sonido="whoosh-grave" />
        <Balanza />
      </Momento>
      <Momento desde={5.5} hasta={16.3}>
        <Grande texto="Tu peso diario" en={5.58} tam={90} color="#9fe3ff" style={{ top: 330 }} sonido={false} />
        <Momento desde={13.06} hasta={16.3}>
          <Grande texto="Lo que importa" en={13.06} tam={90} color={C.verde} style={{ top: 420 }} sonido="brillo" />
        </Momento>
        <Grafico />
      </Momento>
      {/* Kaibu calcula el promedio y ajusta el plan */}
      <TelefonoKaibu src="progreso" desde={16.3} hasta={21.0} k={0.9} y={-120} scroll={0} />
      {frame >= s(17.74) && frame <= s(21.3) && (
        <div style={{ position: 'absolute', left: 120, right: 120, top: 760, opacity: entra * (1 - sale), transform: `translateY(${(1 - sube) * 60}px)` }}>
          <Sonido efecto="brillo" en={s(19.5)} vol={0.4} />
          <TarjetaAjuste k={2.15} t={frame - s(17.74)} />
        </div>
      )}
    </AbsoluteFill>
  )
}
