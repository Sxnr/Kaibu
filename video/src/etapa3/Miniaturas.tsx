// Miniaturas (portadas) de los 6 Shorts de la Etapa 3: 1080×1920, una por video.
// El texto grande va al centro y arriba (abajo y a la derecha están los botones de YouTube, TikTok e Instagram).
// Se renderiza el último cuadro (MINIATURA_CUADRO), cuando las animaciones de las piezas ya se asentaron.
import { Ban, Beef, Crown, Droplet, Sandwich, Soup, TrendingUp } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill } from 'remotion'
import { IconoKaibu } from '../componentes'
import { C, DISPLAY, SANS } from '../tema'
import { Fondo, Sello, TelefonoKaibu } from './comunes'
import type { IdVideo } from './datos'

export const MINIATURA_CUADROS = 60
export const MINIATURA_CUADRO = MINIATURA_CUADROS - 1

const SOMBRA = '0 8px 0 rgba(0,0,0,0.55), 0 0 50px rgba(0,0,0,0.6)'

/** Texto gigante en mayúsculas (fuente condensada de Kaibu). */
function Titular({ children, tam, color = C.tinta, top, style }: { children: ReactNode; tam: number; color?: string; top: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: 'absolute', left: 50, right: 50, top, textAlign: 'center',
        fontFamily: DISPLAY, fontWeight: 800, fontSize: tam, lineHeight: 0.92, letterSpacing: '0.01em',
        textTransform: 'uppercase', color, textShadow: SOMBRA, ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Logo chico de Kaibu (abajo del contenido, sobre la zona de botones). */
function Marca({ top = 1330 }: { top?: number }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
      <IconoKaibu tam={70} />
      <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 64, letterSpacing: '0.14em', color: C.tinta, textShadow: SOMBRA }}>KAIBU</span>
    </div>
  )
}

function Pildora({ icono, texto, color, top }: { icono: ReactNode; texto: string; color: string; top: number }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 36px 18px 20px', borderRadius: 999, background: C.nocheSuperficie, border: `4px solid ${color}`, fontFamily: SANS, fontWeight: 800, fontSize: 50, color: C.tinta, boxShadow: `0 0 40px ${color}66` }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 76, height: 76, borderRadius: 999, background: color, color: C.noche }}>{icono}</span>
        {texto}
      </div>
    </div>
  )
}

/* ---------- 1 · Arroz con pollo ---------- */
function MiniArroz() {
  return (
    <AbsoluteFill>
      <Fondo centro="#3a2112" borde="#0b0909" />
      <Titular tam={130} top={170}>Tu arroz con pollo</Titular>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 440, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 30 }}>
        <span style={{ position: 'relative', fontFamily: DISPLAY, fontWeight: 800, fontSize: 210, color: C.tintaSuave, textShadow: SOMBRA }}>
          433
          <span style={{ position: 'absolute', left: -10, right: -10, top: '50%', height: 18, borderRadius: 9, background: C.marcaIntensa, transform: 'rotate(-12deg)' }} />
        </span>
        <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 140, color: C.tinta, textShadow: SOMBRA }}>→</span>
      </div>
      <Titular tam={400} top={640} color={C.marcaIntensa} style={{ textShadow: '0 10px 0 rgba(0,0,0,0.5), 0 0 90px rgba(209,52,60,0.75)' }}>557</Titular>
      <Titular tam={80} top={1010} color={C.tintaSuave}>kcal</Titular>
      <Pildora icono={<Droplet size={46} />} texto="+1 cucharada de aceite" color={C.marcaIntensa} top={1110} />
      <Titular tam={78} top={1260} color={C.ambar}>La que nadie anota</Titular>
    </AbsoluteFill>
  )
}

/* ---------- 2 · Completo vs arroz con pollo ---------- */
function Luchador({ icono, nombre, kcal, prote, color, top, corona }: { icono: ReactNode; nombre: string; kcal: string; prote: string; color: string; top: number; corona?: boolean }) {
  return (
    <div style={{ position: 'absolute', left: 70, right: 150, top, borderRadius: 44, padding: '30px 40px', display: 'flex', alignItems: 'center', gap: 34, background: `linear-gradient(120deg, ${color}55, ${C.nocheSuperficie} 70%)`, border: `6px solid ${color}`, boxShadow: `0 0 70px ${color}66` }}>
      {corona && <Crown size={130} color={C.ambar} fill={C.ambar} style={{ position: 'absolute', right: -40, top: -95, transform: 'rotate(18deg)' }} />}
      <span style={{ display: 'grid', placeItems: 'center', width: 170, height: 170, flexShrink: 0, borderRadius: 999, background: color, color: C.noche }}>{icono}</span>
      <div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 92, lineHeight: 0.95, color: C.tinta, textTransform: 'uppercase' }}>{nombre}</div>
        <div style={{ marginTop: 14, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: C.tinta }}>
          {kcal} kcal · <span style={{ color: C.cielo }}>{prote} prot.</span>
        </div>
      </div>
    </div>
  )
}

function MiniCompleto() {
  return (
    <AbsoluteFill>
      <Fondo centro="#2b1013" borde="#070606" />
      <AbsoluteFill style={{ background: 'linear-gradient(160deg, rgba(209,52,60,0.22) 0%, transparent 45%, transparent 55%, rgba(140,192,132,0.2) 100%)' }} />
      <Titular tam={120} top={150} color={C.ambar}>¿Cuál es más fit?</Titular>
      <Luchador icono={<Sandwich size={100} />} nombre="Completo italiano" kcal="484" prote="11 g" color={C.marcaIntensa} top={370} />
      <Titular tam={260} top={690} color={C.ambar} style={{ fontStyle: 'italic', textShadow: '0 0 60px rgba(232,176,75,0.8), 0 12px 0 #000' }}>VS</Titular>
      <Luchador icono={<Soup size={100} />} nombre="Arroz con pollo" kcal="433" prote="41 g" color={C.verde} top={990} corona />
    </AbsoluteFill>
  )
}

/* ---------- 3 · Tu peso te miente ---------- */
const SALTOS = [83.0, 83.6, 82.7, 83.8, 82.5, 83.2, 83.7, 82.4, 82.9, 83.4, 82.5, 83.7]
function MiniPeso() {
  const x = (i: number) => 110 + (i / (SALTOS.length - 1)) * 800
  const y = (kg: number) => 820 + (84 - kg) * 230
  const promedio = SALTOS.map((_, i) => 83.3 - i * 0.06)
  return (
    <AbsoluteFill>
      <Fondo centro="#13212b" borde="#060a0d" />
      <Titular tam={210} top={150}>Tu peso</Titular>
      <Titular tam={230} top={350} color={C.marcaIntensa} style={{ textShadow: '0 10px 0 rgba(0,0,0,0.5), 0 0 80px rgba(209,52,60,0.6)' }}>te miente</Titular>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <polyline points={SALTOS.map((kg, i) => `${x(i)},${y(kg)}`).join(' ')} fill="none" stroke="rgba(209,52,60,0.85)" strokeWidth={10} strokeLinejoin="round" />
        {SALTOS.map((kg, i) => <circle key={i} cx={x(i)} cy={y(kg)} r={16} fill="#ff8a8a" />)}
        <polyline points={promedio.map((kg, i) => `${x(i)},${y(kg)}`).join(' ')} fill="none" stroke={C.verde} strokeWidth={18} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 20px rgba(140,192,132,0.8))' }} />
      </svg>
      <div style={{ position: 'absolute', right: 160, top: 640, display: 'flex', alignItems: 'center', gap: 14, padding: '16px 30px', borderRadius: 24, background: C.marca, fontFamily: SANS, fontWeight: 800, fontSize: 60, color: '#fff', transform: 'rotate(-4deg)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <TrendingUp size={64} /> +0,8 kg
      </div>
      <Titular tam={70} top={1290} color={C.verde}>Mira tu promedio de 7 días</Titular>
    </AbsoluteFill>
  )
}

/* ---------- 4 · Carne molida 5 % vs 10 % ---------- */
function Opcion({ letra, texto, color, left }: { letra: string; texto: string; color: string; left: number }) {
  return (
    <div style={{ position: 'absolute', top: 560, left, width: 400, borderRadius: 44, padding: '40px 20px', background: C.nocheSuperficie, border: `6px solid ${color}`, textAlign: 'center', boxShadow: `0 0 60px ${color}55` }}>
      <div style={{ display: 'grid', placeItems: 'center', width: 140, height: 140, margin: '0 auto', borderRadius: 999, background: color, color: C.noche, fontFamily: DISPLAY, fontWeight: 800, fontSize: 110 }}>{letra}</div>
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, fontFamily: SANS, fontWeight: 800, fontSize: 46, color: C.tinta, whiteSpace: 'nowrap' }}>
        <Beef size={50} color={color} /> {texto}
      </div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 230, lineHeight: 1, color: C.ambar }}>?</div>
    </div>
  )
}

function MiniCarne() {
  return (
    <AbsoluteFill>
      <Fondo centro="#1c1a2b" borde="#08070c" />
      <Titular tam={140} top={170}>Carne molida</Titular>
      <Titular tam={190} top={320} color={C.ambar}>¿5 % o 10 %?</Titular>
      <Opcion letra="A" texto="5 % grasa" color={C.cielo} left={70} />
      <Opcion letra="B" texto="10 % grasa" color={C.marcaIntensa} left={540} />
      <Titular tam={84} top={1150}>¿Vale la pena pagar más?</Titular>
    </AbsoluteFill>
  )
}

/* ---------- 5 · Busco 20 personas ---------- */
function MiniBusco() {
  const papel = '#efe3c8'
  const tinta = '#2a2018'
  return (
    <AbsoluteFill>
      <Fondo centro="#2b1a12" borde="#0a0807" />
      <div style={{ position: 'absolute', left: 90, right: 160, top: 170, transform: 'rotate(-3deg)', background: papel, borderRadius: 14, padding: '50px 30px 60px', border: `8px double ${tinta}`, boxShadow: '0 50px 100px rgba(0,0,0,0.65)', textAlign: 'center', fontFamily: DISPLAY, fontWeight: 800, color: tinta }}>
        <div style={{ fontSize: 150, lineHeight: 0.9, letterSpacing: '0.06em' }}>SE BUSCAN</div>
        <div style={{ fontSize: 470, lineHeight: 0.85, color: C.marca }}>20</div>
        <div style={{ fontSize: 92, lineHeight: 0.95 }}>PERSONAS QUE ENTRENEN</div>
        <div style={{ marginTop: 22, fontFamily: SANS, fontWeight: 700, fontSize: 46, color: '#5b4a3a' }}>para probar mi app chilena</div>
      </div>
      <Sello texto="BETA PRIVADA" en={0} rot={10} tam={86} style={{ right: 120, top: 1110 }} />
      <Marca top={1300} />
    </AbsoluteFill>
  )
}

/* ---------- 6 · La cazuela ---------- */
function MiniCazuela() {
  return (
    <AbsoluteFill>
      <Fondo centro="#2a1215" borde="#080606" />
      <Titular tam={124} top={140}>Las apps gringas no conocen la</Titular>
      <Titular tam={250} top={390} color={C.ambar} style={{ textShadow: '0 10px 0 rgba(0,0,0,0.5), 0 0 80px rgba(232,176,75,0.6)' }}>cazuela</Titular>
      <div style={{ position: 'absolute', left: 70, top: 720, width: 430, borderRadius: 36, background: '#f2f2f2', padding: 30, transform: 'rotate(-5deg)', fontFamily: SANS, color: '#333', boxShadow: '0 30px 70px rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize: 30, color: '#888', fontWeight: 700 }}>Otra app</div>
        <div style={{ marginTop: 12, borderRadius: 14, border: '3px solid #ccc', background: '#fff', padding: '12px 18px', fontSize: 40 }}>cazuela</div>
        <div style={{ marginTop: 26, textAlign: 'center' }}>
          <Ban size={110} color="#c33" />
          <div style={{ fontSize: 46, fontWeight: 800 }}>Sin resultados</div>
        </div>
      </div>
      <TelefonoKaibu src="e3-busqueda-cazuela" desde={0} k={0.78} x={190} y={190} giro={-12} />
      <Sello texto="EN KAIBU SÍ ✓" en={0} color={C.verde} rot={-8} tam={70} style={{ left: 40, top: 1250 }} />
    </AbsoluteFill>
  )
}

export const MINIATURAS: Record<IdVideo, () => ReactNode> = {
  arroz: MiniArroz,
  completo: MiniCompleto,
  peso: MiniPeso,
  carne: MiniCarne,
  busco: MiniBusco,
  cazuela: MiniCazuela,
}

export function Miniatura({ id }: { id: IdVideo }) {
  const Componente = MINIATURAS[id]
  return (
    <AbsoluteFill style={{ background: C.noche }}>
      <Componente />
    </AbsoluteFill>
  )
}
