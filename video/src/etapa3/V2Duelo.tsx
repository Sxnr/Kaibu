// Video 2 · Completo italiano: "duelo". Pantalla dividida estilo pelea: completo vs. arroz con pollo.
import { Crown, Sandwich, Soup } from 'lucide-react'
import type { ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Sonido } from '../componentes'
import { C, DISPLAY, SANS } from '../tema'
import { entre } from '../util'
import { Barra, Destello, Fondo, Grande, Momento, Sello, TelefonoKaibu, s, useConteo, useResorte, useTramo } from './comunes'

function Luchador({ en, lado, nombre, icono, color, kcal, prote, ganador }: { en: number; lado: 'izq' | 'der'; nombre: string; icono: ReactNode; color: string; kcal: ReactNode; prote: ReactNode; ganador?: boolean }) {
  const p = useResorte(en, { damping: 11, mass: 0.8 })
  const frame = useCurrentFrame()
  const corona = useResorte(13.0, { damping: 8 })
  if (frame < s(en) - 1) return null
  const dx = (1 - p) * (lado === 'izq' ? -700 : 700)
  return (
    <div style={{ position: 'absolute', top: 210, width: 470, [lado === 'izq' ? 'left' : 'right']: 50, transform: `translateX(${dx}px)` }}>
      <Sonido efecto="swish" en={s(en)} vol={0.5} />
      {ganador && frame >= s(13.0) && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: -120, display: 'flex', justifyContent: 'center', transform: `scale(${corona}) rotate(${(1 - corona) * 30}deg)` }}>
          <Crown size={110} color={C.ambar} fill={C.ambar} />
        </div>
      )}
      <div style={{ borderRadius: 40, padding: '28px 26px', background: `linear-gradient(180deg, ${color}44 0%, ${C.nocheSuperficie} 60%)`, border: `4px solid ${color}`, boxShadow: `0 0 60px ${color}55`, textAlign: 'center', fontFamily: SANS, color: C.tinta }}>
        <div style={{ display: 'grid', placeItems: 'center', width: 116, height: 116, margin: '0 auto', borderRadius: 999, background: color, color: C.noche }}>{icono}</div>
        <div style={{ marginTop: 18, fontFamily: DISPLAY, fontWeight: 800, fontSize: 58, lineHeight: 1, textTransform: 'uppercase' }}>{nombre}</div>
        <div style={{ marginTop: 20, fontSize: 28, color: C.tintaSuave, fontWeight: 600 }}>CALORÍAS</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 108, lineHeight: 1 }}>{kcal}</div>
        <div style={{ marginTop: 8, fontSize: 28, color: C.tintaSuave, fontWeight: 600 }}>PROTEÍNA</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 84, lineHeight: 1, color: C.cielo }}>{prote}</div>
      </div>
    </div>
  )
}

function Vs() {
  const p = useResorte(9.6, { damping: 7, mass: 0.6 })
  const frame = useCurrentFrame()
  if (frame < s(9.6) - 1) return null
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 400, display: 'flex', justifyContent: 'center' }}>
      <Sonido efecto="explosion" en={s(9.6)} vol={0.5} />
      <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 170, color: C.ambar, fontStyle: 'italic', textShadow: '0 0 40px rgba(232,176,75,0.7), 0 10px 0 #000', transform: `scale(${2.5 - 1.5 * p}) rotate(-8deg)` }}>VS</span>
    </div>
  )
}

/** Comparación final: barras que compiten. */
function Rondas() {
  const kcal = useTramo(10.82, 11.8)
  const prote = useTramo(12.06, 13.0)
  const fila = (titulo: string, a: number, b: number, pa: string, pb: string, gana: 'a' | 'b', p: number) => (
    <div style={{ marginBottom: 46 }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 52, letterSpacing: '0.1em', color: C.tintaSuave, marginBottom: 14 }}>{titulo}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Barra pct={a * p} color={gana === 'a' ? C.verde : C.marcaIntensa} alto={70} etiqueta={`Completo · ${pa}`} />
        <Barra pct={b * p} color={gana === 'b' ? C.verde : C.marcaIntensa} alto={70} etiqueta={`Arroz con pollo · ${pb}`} />
      </div>
    </div>
  )
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: 830, fontFamily: SANS }}>
      {fila('MENOS CALORÍAS', 484 / 500, 433 / 500, '484', '433', 'b', kcal)}
      {useCurrentFrame() >= s(12.0) && fila('MÁS PROTEÍNA', 11.5 / 45, 41.6 / 45, '11 g', '41 g', 'b', prote)}
    </div>
  )
}

export function V2Duelo() {
  const frame = useCurrentFrame()
  const kcal = useConteo(0, 484, 4.34, 0.8)
  const brillo = entre(Math.sin(frame / 4) * 0.5 + 0.5, 0, 1)
  return (
    <AbsoluteFill>
      <Fondo centro="#2b1013" borde="#070606" />
      {/* Rayo diagonal de pelea */}
      <AbsoluteFill style={{ background: `linear-gradient(115deg, transparent 49.4%, rgba(232,176,75,${0.25 + 0.15 * brillo}) 49.8%, transparent 50.4%)`, opacity: useTramo(9.5, 9.8) * (1 - useTramo(14.3, 14.6)) }} />
      <Momento desde={0} hasta={14.3}>
        <Grande texto="Round 1" en={0.2} tam={70} color={C.ambar} style={{ top: 90 }} sonido="ding" />
        <Luchador en={1.22} lado="izq" nombre="Completo italiano" icono={<Sandwich size={66} />} color={C.marcaIntensa} kcal={kcal} prote={useCurrentFrame() >= s(6.94) ? '11 g' : '?'} />
        <Luchador en={9.52} lado="der" nombre="Arroz con pollo" icono={<Soup size={66} />} color={C.verde} kcal="433" prote="41 g" ganador />
        <Vs />
        <Momento desde={10.7} hasta={14.3}>
          <Rondas />
        </Momento>
        <Sello texto="×4 PROTEÍNA" en={12.9} color={C.verde} rot={8} tam={70} style={{ right: 60, top: 1330 }} />
      </Momento>
      {/* No digo que no te lo comas: anótalo */}
      <Momento desde={14.4} hasta={17.4}>
        <Destello en={14.42} />
        <Grande texto="¿No comerlo?" en={14.42} tam={130} style={{ top: 420 }} />
        <Sello texto="ANÓTALO ✓" en={16.08} color={C.verde} rot={-6} tam={130} style={{ left: 0, right: 0, top: 700 }} />
      </Momento>
      {/* En Kaibu está todo: cortes al ritmo */}
      <TelefonoKaibu src="e3-busqueda-completo" desde={17.5} hasta={19.35} k={0.95} y={-70} giro={-8} />
      <TelefonoKaibu src="e3-busqueda-cazuela" desde={19.4} hasta={20.25} k={0.95} y={-70} />
      <TelefonoKaibu src="e3-busqueda-chorrillana" desde={20.32} hasta={21.6} k={0.95} y={-70} giro={8} />
      <Destello en={19.4} fuerza={0.35} />
      <Destello en={20.32} fuerza={0.35} />
    </AbsoluteFill>
  )
}
