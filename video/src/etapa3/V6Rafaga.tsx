// Video 6 · La cazuela: "ráfaga de búsquedas". Una app genérica no encuentra la cazuela; en Kaibu,
// cortes rápidos al ritmo de la voz con cada comida que nombra.
import { Ban, Search } from 'lucide-react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { IconoKaibu, Sonido } from '../componentes'
import { C, DISPLAY, SANS } from '../tema'
import { entre } from '../util'
import { Destello, Fondo, Grande, Momento, Sello, TelefonoKaibu, s, useResorte, useTramo } from './comunes'

/** App genérica (sin marca real) que no conoce la cazuela. */
function AppGenerica() {
  const escribe = useTramo(1.8, 3.2)
  const texto = 'cazuela'.slice(0, Math.round(escribe * 7))
  const nada = useResorte(3.58, { damping: 10 })
  const frame = useCurrentFrame()
  return (
    <div style={{ position: 'absolute', left: 150, right: 150, top: 420, borderRadius: 50, background: '#f2f2f2', padding: 40, boxShadow: '0 40px 90px rgba(0,0,0,0.6)', fontFamily: SANS, color: '#333' }}>
      <div style={{ fontSize: 34, color: '#888', fontWeight: 600, marginBottom: 20 }}>Otra app de calorías</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, borderRadius: 20, background: '#fff', border: '3px solid #ccc', padding: '22px 26px', fontSize: 52 }}>
        <Search size={50} color="#888" />
        {texto}
        <span style={{ width: 4, height: 54, background: '#333', opacity: Math.round(frame / 8) % 2 }} />
      </div>
      <div style={{ height: 380, display: 'grid', placeItems: 'center', opacity: nada, transform: `scale(${0.8 + 0.2 * nada})` }}>
        {frame >= s(3.58) && <Sonido efecto="blip" en={s(3.58)} vol={0.5} tono={0.7} />}
        <div style={{ textAlign: 'center' }}>
          <Ban size={130} color="#c33" />
          <div style={{ marginTop: 16, fontSize: 56, fontWeight: 800 }}>Sin resultados</div>
          <div style={{ fontSize: 36, color: '#888' }}>¿Quisiste decir “casserole”?</div>
        </div>
      </div>
    </div>
  )
}

function LogoGolpe() {
  const p = useResorte(4.62, { damping: 8, mass: 0.7 })
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30, paddingBottom: 300, transform: `scale(${2 - p})`, opacity: entre(p * 2, 0, 1) }}>
      <Sonido efecto="explosion" en={s(4.62)} vol={0.55} />
      <IconoKaibu tam={260} />
      <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 170, letterSpacing: '0.12em', color: C.tinta }}>KAIBU</span>
    </div>
  )
}

const CORTES: { src: string; desde: number; hasta: number; nombre: string; color: string }[] = [
  { src: 'e3-busqueda-cazuela', desde: 6.82, hasta: 7.75, nombre: 'Cazuela', color: C.ambar },
  { src: 'e3-busqueda-porotos', desde: 7.8, hasta: 8.88, nombre: 'Porotos con riendas', color: C.verde },
  { src: 'e3-busqueda-pastel', desde: 8.92, hasta: 10.3, nombre: 'Pastel de choclo', color: C.ambar },
  { src: 'e3-busqueda-arroz', desde: 10.34, hasta: 12.0, nombre: 'Arroz con pollo', color: C.cielo },
  { src: 'e3-busqueda-avena', desde: 12.06, hasta: 14.8, nombre: 'Avena con whey', color: C.verde },
  { src: 'e3-busqueda-protein', desde: 14.88, hasta: 17.9, nombre: 'Yogures con proteína', color: C.cielo },
]

function Rotulo({ desde, texto, color, lado }: { desde: number; texto: string; color: string; lado: number }) {
  const p = useResorte(desde + 0.1, { damping: 10, mass: 0.6 })
  return (
    <div style={{ position: 'absolute', top: 210, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateX(${(1 - p) * 600 * lado}px) rotate(${lado * -3}deg)` }}>
      <span style={{ padding: '16px 34px', borderRadius: 18, background: color, color: C.noche, fontFamily: DISPLAY, fontWeight: 800, fontSize: 80, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{texto}</span>
    </div>
  )
}

function Palabra({ en, texto, top, color }: { en: number; texto: string; top: number; color: string }) {
  const p = useResorte(en, { damping: 8, mass: 0.6 })
  const frame = useCurrentFrame()
  if (frame < s(en) - 1) return null
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, textAlign: 'center', transform: `scale(${1.8 - 0.8 * p}) rotate(${(1 - p) * 8}deg)`, opacity: entre(p * 2, 0, 1) }}>
      <Sonido efecto="golpe" en={s(en)} vol={0.35} />
      <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 170, color, textTransform: 'uppercase' }}>{texto}</span>
    </div>
  )
}

export function V6Rafaga() {
  return (
    <AbsoluteFill>
      <Fondo centro="#2a1215" borde="#080606" />
      <Momento desde={0} hasta={4.15} salida={4}>
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, #3a3f45 0%, #1c1f22 100%)' }} />
        <AppGenerica />
      </Momento>
      <Destello en={4.2} fuerza={0.7} />
      <Momento desde={4.2} hasta={6.75} salida={4}>
        <Grande texto="Así que hice una" en={4.2} tam={110} style={{ top: 1180 }} sonido={false} />
        <LogoGolpe />
        <Momento desde={5.54} hasta={6.75} salida={4}>
          <Sello texto="100 % CHILENA" en={5.54} color={C.marcaIntensa} rot={-6} tam={90} style={{ left: 0, right: 0, top: 260 }} />
        </Momento>
      </Momento>
      {CORTES.map((c, i) => (
        <AbsoluteFill key={c.src}>
          <Destello en={c.desde} fuerza={0.45} />
          <Momento desde={c.desde} hasta={c.hasta} salida={3}>
            <Rotulo desde={c.desde} texto={c.nombre} color={c.color} lado={i % 2 ? -1 : 1} />
          </Momento>
          <TelefonoKaibu src={c.src} desde={c.desde - 0.08} hasta={c.hasta} k={0.92} x={i % 2 ? 40 : -40} y={-30} giro={i % 2 ? -10 : 10} />
        </AbsoluteFill>
      ))}
      <Momento desde={18.04} hasta={21.8}>
        <Grande texto="Habla como nosotros" en={18.04} tam={96} color={C.ambar} style={{ top: 280 }} sonido="whoosh" />
        <Palabra en={19.52} texto="Once" top={520} color={C.tinta} />
        <Palabra en={19.84} texto="Marraqueta" top={720} color={C.marcaIntensa} />
        <Palabra en={20.52} texto="Sopaipilla" top={920} color={C.ambar} />
      </Momento>
      <Momento desde={21.88} hasta={23.15}>
        <Destello en={21.88} fuerza={0.5} />
        <Sello texto="GRATIS" en={21.88} color={C.verde} rot={-8} tam={220} style={{ left: 0, right: 0, top: 640 }} />
      </Momento>
    </AbsoluteFill>
  )
}
