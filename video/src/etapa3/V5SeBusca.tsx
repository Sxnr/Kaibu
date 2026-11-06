// Video 5 · Busco 20 personas: convocatoria tipo "SE BUSCA". Cartel de casting, presentación de Francisco,
// la app en 3 pantallas, requisitos que se marcan y el sello "GRATIS".
import { Check, Dumbbell, MessageSquare, Utensils } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { IconoKaibu, Sonido } from '../componentes'
import { C, DISPLAY, SANS } from '../tema'
import { entre } from '../util'
import { Fondo, Grande, Momento, Sello, TelefonoKaibu, s, useResorte } from './comunes'

const PAPEL = '#efe3c8'
const TINTA_PAPEL = '#2a2018'

function Cartel() {
  const frame = useCurrentFrame()
  const p = useResorte(1.2, { damping: 12, mass: 0.9 })
  const veinte = useResorte(2.22, { damping: 7, mass: 0.6 })
  return (
    <div style={{ position: 'absolute', left: 110, right: 110, top: 230, transform: `rotate(${-2 + Math.sin(frame / 40) * 0.6}deg) translateY(${(1 - p) * -1200}px)` }}>
      <Sonido efecto="whoosh" en={s(1.2)} vol={0.4} />
      <div style={{ background: PAPEL, borderRadius: 12, padding: '50px 40px 60px', boxShadow: '0 40px 90px rgba(0,0,0,0.6)', textAlign: 'center', color: TINTA_PAPEL, fontFamily: DISPLAY, fontWeight: 800, border: `6px double ${TINTA_PAPEL}` }}>
        <div style={{ fontSize: 150, lineHeight: 0.9, letterSpacing: '0.06em' }}>SE BUSCAN</div>
        <div style={{ fontSize: 330, lineHeight: 0.9, color: C.marca, transform: `scale(${0.5 + 0.5 * veinte})`, opacity: entre(veinte * 1.5, 0, 1) }}>20</div>
        <div style={{ fontSize: 76, lineHeight: 1, letterSpacing: '0.04em' }}>PERSONAS QUE ENTRENEN</div>
        <div style={{ marginTop: 22, fontFamily: SANS, fontWeight: 650, fontSize: 44, color: '#5b4a3a' }}>para probar Kaibu antes que nadie</div>
      </div>
      {frame >= s(2.22) && <Sonido efecto="golpe" en={s(2.22)} vol={0.45} />}
    </div>
  )
}

function Presentacion() {
  const p = useResorte(5.1, { damping: 13 })
  const tags = [
    { t: 'App chilena', en: 7.42, c: C.marcaIntensa },
    { t: 'Calorías', en: 8.36, c: C.ambar },
    { t: 'Proteína', en: 9.52, c: C.cielo },
  ]
  return (
    <>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, transform: `scale(${0.7 + 0.3 * p})`, opacity: p }}>
        <IconoKaibu tam={240} style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.6))' }} />
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 150, color: C.tinta, lineHeight: 1 }}>FRANCISCO</div>
        <div style={{ fontFamily: SANS, fontWeight: 650, fontSize: 52, color: C.tintaSuave }}>creador de Kaibu</div>
      </div>
      {tags.map((x, i) => (
        <Etiqueta key={x.t} en={x.en} color={x.c} style={{ top: 1000, left: [70, 420, 700][i] }}>
          {x.t}
        </Etiqueta>
      ))}
    </>
  )
}

function Etiqueta({ en, color, children, style }: { en: number; color: string; children: ReactNode; style?: CSSProperties }) {
  const p = useResorte(en, { damping: 10, mass: 0.6 })
  const frame = useCurrentFrame()
  if (frame < s(en) - 1) return null
  return (
    <div style={{ position: 'absolute', padding: '16px 30px', borderRadius: 999, background: color, color: C.noche, fontFamily: SANS, fontWeight: 800, fontSize: 44, transform: `scale(${0.4 + 0.6 * p})`, opacity: entre(p * 1.5, 0, 1), ...style }}>
      <Sonido efecto="pop" en={s(en)} vol={0.4} />
      {children}
    </div>
  )
}

function Requisito({ en, icono, texto, top }: { en: number; icono: ReactNode; texto: string; top: number }) {
  const p = useResorte(en, { damping: 12 })
  const marca = useResorte(en + 0.5, { damping: 8, mass: 0.6 })
  const frame = useCurrentFrame()
  if (frame < s(en) - 1) return null
  return (
    <div style={{ position: 'absolute', left: 90, right: 90, top, display: 'flex', alignItems: 'center', gap: 28, padding: '30px 34px', borderRadius: 30, background: C.nocheSuperficie, border: '2px solid rgba(255,255,255,0.1)', transform: `translateX(${(1 - p) * -900}px)`, fontFamily: SANS, fontWeight: 750, fontSize: 50, color: C.tinta }}>
      <Sonido efecto="swish" en={s(en)} vol={0.35} />
      <Sonido efecto="ding" en={s(en + 0.5)} vol={0.35} />
      <span style={{ color: C.ambar, display: 'grid' }}>{icono}</span>
      <span style={{ flex: 1 }}>{texto}</span>
      <span style={{ display: 'grid', placeItems: 'center', width: 80, height: 80, borderRadius: 999, background: C.exito, color: '#fff', transform: `scale(${marca})` }}>
        <Check size={54} strokeWidth={3.5} />
      </span>
    </div>
  )
}

export function V5SeBusca() {
  return (
    <AbsoluteFill>
      <Fondo centro="#2b1a12" borde="#0a0807" />
      <Momento desde={0} hasta={5.0}>
        <Cartel />
        <Sello texto="BETA PRIVADA" en={2.98} rot={8} tam={72} style={{ right: 70, top: 1080 }} />
      </Momento>
      <Momento desde={5.05} hasta={10.5}>
        <Presentacion />
      </Momento>
      {/* La app en tres pantallas, una por cada cosa que dice */}
      <TelefonoKaibu src="tu-plan" desde={10.62} hasta={15.2} k={0.58} x={-330} y={-90} giro={10} />
      <TelefonoKaibu src="e3-busqueda-arroz" desde={11.64} hasta={15.2} k={0.58} x={0} y={-90} />
      <TelefonoKaibu src="progreso" desde={12.5} hasta={15.2} k={0.58} x={330} y={-90} giro={-10} />
      <Momento desde={15.3} hasta={20.3}>
        <Grande texto="Requisitos" en={15.32} tam={110} color={C.ambar} style={{ top: 300 }} sonido={false} />
        <Requisito en={15.32} icono={<Dumbbell size={60} />} texto="Vas al gym" top={560} />
        <Requisito en={17.34} icono={<Utensils size={60} />} texto="Quieres ordenarte con la comida" top={760} />
        <Requisito en={18.94} icono={<MessageSquare size={60} />} texto="Me dices la verdad" top={960} />
      </Momento>
      <Momento desde={20.4} hasta={22.8}>
        <Sello texto="GRATIS" en={20.44} color={C.verde} rot={-8} tam={200} style={{ left: 0, right: 0, top: 560 }} />
        <Grande texto="Solo tu opinión" en={21.3} tam={100} style={{ top: 960 }} sonido="pop" />
      </Momento>
    </AbsoluteFill>
  )
}
