// Video 1 · Arroz con pollo: "cálculo en vivo". Un contador de calorías se arma con la voz
// y salta en rojo cuando cae la cucharada de aceite.
import { Droplet, Drumstick, Star, Wheat } from 'lucide-react'
import type { ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Sonido, Toque } from '../componentes'
import { C, DISPLAY, SANS } from '../tema'
import { entre } from '../util'
import { Barra, Fondo, Grande, Momento, Sello, TelefonoKaibu, s, useConteo, useResorte, useTramo } from './comunes'

function Ingrediente({ en, icono, texto, kcal, color, top, cae = false }: { en: number; icono: ReactNode; texto: string; kcal?: string; color: string; top: number; cae?: boolean }) {
  const p = useResorte(en, { damping: cae ? 9 : 12, mass: 0.7 })
  const frame = useCurrentFrame()
  if (frame < s(en) - 1) return null
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - p) * (cae ? -500 : 80)}px)`, opacity: entre(p * 1.6, 0, 1) }}>
      <Sonido efecto={cae ? 'golpe' : 'pop'} en={s(en)} vol={0.45} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 34px 18px 20px', borderRadius: 999, background: C.nocheSuperficie, border: `3px solid ${color}`, fontFamily: SANS, fontWeight: 700, fontSize: 46, color: C.tinta }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 66, height: 66, borderRadius: 999, background: color, color: C.noche }}>{icono}</span>
        {texto}
        {kcal && <span style={{ color, marginLeft: 6 }}>{kcal}</span>}
      </div>
    </div>
  )
}

function Calculadora() {
  const frame = useCurrentFrame()
  const base = useConteo(0, 433, 6.02, 0.9)
  const conAceite = useConteo(433, 557, 12.48, 0.6)
  const total = frame >= s(12.48) ? conAceite : base
  const salto = useResorte(12.48, { damping: 6, mass: 0.6 })
  const rojo = frame >= s(12.48)
  const temblor = rojo ? Math.sin(frame * 2.3) * 10 * (1 - entre((frame - s(12.48)) / 12, 0, 1)) : 0
  const prote = useResorte(7.92)
  return (
    <>
      <Sonido efecto="conteo" en={s(6.02)} vol={0.35} />
      <Sonido efecto="explosion" en={s(12.48)} vol={0.45} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', transform: `translateX(${temblor}px) scale(${rojo ? 1 + (1 - salto) * 0.25 : 1})` }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 300, lineHeight: 0.9, color: rojo ? C.marcaIntensa : C.tinta, textShadow: rojo ? '0 0 60px rgba(209,52,60,0.55)' : 'none' }}>{total}</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 70, letterSpacing: '0.2em', color: C.tintaSuave }}>KCAL</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center', opacity: prote, transform: `scale(${0.7 + 0.3 * prote})` }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 48, color: '#fff', background: C.proteina, borderRadius: 999, padding: '12px 34px' }}>41 g de proteína</span>
      </div>
    </>
  )
}

/** Barra del día que se pasa del objetivo: "te frena el déficit". */
function BarraDia() {
  const p = useTramo(15.94, 16.9)
  return (
    <div style={{ position: 'absolute', left: 110, right: 110, top: 1190 }}>
      <div style={{ fontFamily: SANS, fontWeight: 650, fontSize: 40, color: C.tintaSuave, marginBottom: 16 }}>Tu objetivo del día</div>
      <div style={{ position: 'relative' }}>
        <Barra pct={0.86 + p * 0.22} color={p > 0.6 ? C.marcaIntensa : C.ambar} alto={56} />
        <div style={{ position: 'absolute', left: '92%', top: -16, bottom: -16, width: 6, borderRadius: 3, background: C.tinta }} />
      </div>
    </div>
  )
}

export function V1Calculo() {
  const frame = useCurrentFrame()
  const pulso = 1 + Math.sin(frame / 6) * 0.03
  return (
    <AbsoluteFill>
      <Fondo centro="#2a1c12" borde="#0b0909" />
      {/* Gancho */}
      <Momento desde={0} hasta={4.0}>
        <Grande texto="Tu arroz con pollo" en={1.38} tam={140} style={{ top: 520 }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center', transform: `scale(${pulso})` }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 380, color: C.ambar, opacity: useResorte(2.42) }}>?</span>
        </div>
      </Momento>
      {/* Cálculo */}
      <Momento desde={4.1} hasta={17.5}>
        <Ingrediente en={4.94} icono={<Wheat size={40} />} texto="Arroz" color={C.ambar} top={230} />
        <Ingrediente en={5.4} icono={<Drumstick size={40} />} texto="Pechuga" color={C.cielo} top={350} />
        <Ingrediente en={10.66} icono={<Droplet size={40} />} texto="1 cda de aceite" kcal="+124" color={C.marcaIntensa} top={470} cae />
        <Calculadora />
        <Momento desde={13.96} hasta={17.5}>
          <Sello texto="NADIE LA ANOTA" en={13.96} rot={-8} tam={76} style={{ left: 0, right: 0, top: 480 }} />
        </Momento>
        <Momento desde={15.9} hasta={17.5}>
          <BarraDia />
        </Momento>
      </Momento>
      {/* En Kaibu: guardas tu plato y lo anotas en un toque */}
      <TelefonoKaibu
        src="e3-ficha-arroz"
        desde={17.6}
        hasta={21.9}
        k={0.95}
        y={-70}
        encima={(k) => (
          <>
            <Toque k={k} x={40} y={842} en={s(18.84)} />
            <Toque k={k} x={220} y={842} en={s(20.6)} />
          </>
        )}
      />
      <Momento desde={18.9} hasta={21.9}>
        <div style={{ position: 'absolute', right: 70, top: 300, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 26px', borderRadius: 999, background: C.ambar, color: C.noche, fontFamily: SANS, fontWeight: 800, fontSize: 40 }}>
          <Star size={38} fill={C.noche} /> Guardado
        </div>
      </Momento>
    </AbsoluteFill>
  )
}
