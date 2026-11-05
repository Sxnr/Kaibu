// Escenas de marca: la pregunta (Sísifo), "te cobran", Discord, compartir y el llamado final con QR.
import { Dumbbell, MessageCircle, Flame, FlaskConical, Hash, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { IconoKaibu, Sonido, Titulo } from '../componentes'
import type { Ritmo } from '../ritmo'
import { entre, suave } from '../util'
import { C, DISPLAY, SANS } from '../tema'
import { Pildora, TituloEscena, useVertical } from './piezas'
import { INVITACION } from './tiempos'

const en = (dur: number, x: number) => Math.round(dur * x)

/** Da el tiempo (cuadros desde `en`) a quien lo necesite: números que cuentan, botones que cambian. */
export function ConTiempo({ en: desde, children }: { en: number; children: (t: number) => ReactNode }) {
  return <>{children(useCurrentFrame() - desde)}</>
}

/* ---------- 1. La pregunta: Sísifo solo con su roca ---------- */

export function EscenaPregunta({ dur }: { dur: number }) {
  const frame = useCurrentFrame()
  const v = useVertical()
  const cambio = suave(frame, dur * 0.48, 14)
  const zoom = 1.06 + (frame / dur) * 0.14
  const foto = (src: string, opacidad: number, posicion: string) => (
    <Img
      src={staticFile(`sisifo/${src}`)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: posicion, opacity: opacidad, transform: `scale(${zoom})`, filter: 'saturate(0.75) brightness(0.72) contrast(1.05)' }}
    />
  )
  return (
    <AbsoluteFill style={{ background: C.noche }}>
      <Sonido efecto="whoosh-grave" en={0} vol={0.4} />
      {foto('respaldo-4.jpg', 1, v ? '62% 50%' : '50% 50%')}
      {foto('respaldo-2.jpg', cambio, v ? '38% 50%' : '50% 50%')}
      <AbsoluteFill style={{ background: v ? 'linear-gradient(180deg, rgba(8,6,6,0.85) 0%, transparent 38%, transparent 70%, rgba(8,6,6,0.8) 100%)' : 'linear-gradient(90deg, rgba(8,6,6,0.85) 0%, rgba(8,6,6,0.4) 45%, transparent 70%)' }} />
      <TituloEscena partes={[{ t: '¿Te cuesta' }, { t: 'hacerlo solo?', pildora: C.ambar, colorPildora: C.texto }]} desde={6} hasta={dur + 20} />
    </AbsoluteFill>
  )
}

/* ---------- 2. (horizontal) Te cobran por que tu plan se adapte… en Kaibu es gratis ---------- */

export function EscenaCobran({ dur, drop }: { dur: number; drop: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sello = spring({ frame: frame - 8, fps, config: { damping: 9, mass: 0.8 } })
  const tacha = entre((frame - (drop - 14)) / 10, 0, 1)
  const cae = spring({ frame: frame - drop, fps, config: { damping: 16 } })
  const gratis = spring({ frame: frame - drop - 4, fps, config: { damping: 9, mass: 0.7 } })
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(90% 70% at 50% 35%, #1d1718 0%, #0b0909 60%, #050404 100%)', opacity: 1 - suave(frame, drop, 10) }} />
      <Sonido efecto="sello" en={10} vol={0.7} />
      <Sonido efecto="swish" en={drop - 14} vol={0.4} />
      <div style={{ position: 'absolute', top: 330, left: 120, width: 820 }}>
        <Titulo partes={[{ t: 'Te cobran por que tu plan' }, { t: 'se adapte.', pildora: C.marca }]} desde={4} hasta={drop} tam={88} />
        <Titulo partes={[{ t: 'En Kaibu, eso es' }, { t: 'gratis.', pildora: C.verde, colorPildora: C.texto }]} desde={drop + 2} hasta={dur + 20} tam={88} />
      </div>
      <div style={{ position: 'absolute', left: 1080, top: 250, width: 640, height: 580, display: 'grid', placeItems: 'center' }}>
        <div
          style={{
            border: `10px solid ${C.marcaIntensa}`,
            borderRadius: 28,
            padding: '30px 54px',
            textAlign: 'center',
            color: C.marcaIntensa,
            fontFamily: DISPLAY,
            transform: `rotate(${-8 + cae * 20}deg) scale(${(1.8 - 0.8 * sello) * (1 - cae * 0.35)}) translateY(${cae * 260}px)`,
            opacity: entre(sello * 1.4, 0, 1) * (1 - cae),
            position: 'relative',
          }}
        >
          <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: '0.14em' }}>PLAN ADAPTATIVO</div>
          <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 1 }}>$61.900</div>
          <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: '0.14em' }}>AL AÑO</div>
          <div style={{ position: 'absolute', left: -20, right: -20, top: '50%', height: 16, background: C.tinta, borderRadius: 8, transform: `rotate(-12deg) scaleX(${tacha})`, transformOrigin: 'left center' }} />
        </div>
        {frame >= drop && (
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, transform: `scale(${0.5 + 0.5 * gratis})`, opacity: entre(gratis * 1.5, 0, 1) }}>
            <IconoKaibu tam={150} style={{ filter: 'drop-shadow(0 24px 50px rgba(0,0,0,0.5))' }} />
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 120, color: C.tinta, letterSpacing: '0.06em' }}>$0</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}

/* ---------- Discord: verificación y bienvenida ---------- */

const CANALES = ['verificación', 'bienvenida', 'roadmap', 'general', 'progreso', 'beta-feedback']

function Publicacion({ banner, color, botones, en: desde, toque }: { banner: string; color: string; botones: { texto: string; color: string }[]; en: number; toque?: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const v = useVertical()
  const p = spring({ frame: frame - desde, fps, config: { damping: 14 } })
  if (frame < desde - 1) return null
  const pulsado = toque !== undefined && frame >= toque
  return (
    <div style={{ display: 'flex', gap: 18, opacity: p, transform: `translateY(${(1 - p) * 60}px)` }}>
      <Sonido efecto="pop" en={desde} vol={0.35} tono={0.9} />
      <IconoKaibu tam={v ? 64 : 56} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontSize: v ? 26 : 22, color: C.tinta, fontWeight: 650 }}>
          Kaibu <span style={{ background: '#5865f2', color: '#fff', fontSize: v ? 16 : 14, padding: '2px 7px', borderRadius: 5, marginLeft: 6 }}>BOT</span>
        </div>
        <div style={{ marginTop: 10, borderLeft: `6px solid ${color}`, borderRadius: 10, background: '#232020', padding: 12, overflow: 'hidden' }}>
          <Img src={staticFile(`discord/${banner}.png`)} style={{ width: '100%', borderRadius: 8, display: 'block' }} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          {botones.map((b, i) => (
            <span
              key={b.texto}
              style={{
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: v ? 26 : 22,
                padding: v ? '12px 22px' : '10px 18px',
                borderRadius: 10,
                background: i === 0 && pulsado ? C.exito : b.color,
                color: '#fff',
                transform: i === 0 && toque !== undefined ? `scale(${1 - Math.sin(entre((frame - toque) / 6, 0, 1) * Math.PI) * 0.08})` : undefined,
              }}
            >
              {i === 0 && pulsado ? '✓ Listo: ya eres Miembro' : b.texto}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EscenaDiscord({ dur }: { dur: number }) {
  const frame = useCurrentFrame()
  const v = useVertical()
  const segunda = en(dur, 0.5)
  const sube = suave(frame, segunda - 6, 14)
  const canal = frame < segunda ? 0 : 1
  const ventana = v ? { left: 50, right: 50, top: 400, height: 1080 } : { left: 760, top: 150, width: 1060, height: 740 }
  return (
    <AbsoluteFill>
      <Sonido efecto="whoosh" en={0} vol={0.35} />
      <Sonido efecto="toque" en={en(dur, 0.3)} vol={0.55} />
      <TituloEscena partes={v ? [{ t: 'No vas' }, { t: 'solo.', pildora: C.marca }] : [{ t: 'No vas' }, { t: 'solo.', pildora: C.marca }, { t: 'Kaibu en Discord.', color: C.tintaSuave }]} desde={3} hasta={dur + 20} ancho={580} />
      <div
        style={{
          position: 'absolute',
          ...ventana,
          display: 'flex',
          borderRadius: 26,
          overflow: 'hidden',
          background: '#1b1818',
          border: '2px solid rgba(255,255,255,0.08)',
          boxShadow: '0 40px 90px rgba(0,0,0,0.6)',
          transform: `perspective(2000px) rotateY(${v ? 0 : -8}deg) translateY(${(1 - suave(frame, 0, 16)) * 120}px)`,
        }}
      >
        {!v && (
          <div style={{ width: 250, background: '#141212', padding: '24px 16px', fontFamily: SANS, color: C.tintaSuave, fontSize: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: C.tinta, fontWeight: 700, fontSize: 24, marginBottom: 22 }}>
              <IconoKaibu tam={40} />
              Kaibu
            </div>
            {CANALES.map((c, i) => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 8, background: i === canal ? 'rgba(255,255,255,0.09)' : undefined, color: i === canal ? C.tinta : undefined }}>
                <Hash size={20} />
                {c}
              </div>
            ))}
          </div>
        )}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 2, background: '#1b1818', display: 'flex', alignItems: 'center', gap: 10, padding: '20px 26px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontFamily: SANS, fontWeight: 650, fontSize: v ? 30 : 24, color: C.tinta }}>
            <Hash size={v ? 30 : 24} color={C.tintaSuave} />
            {CANALES[canal]}
          </div>
          <div style={{ position: 'absolute', left: 26, right: 26, top: v ? 110 : 90, display: 'flex', flexDirection: 'column', gap: 40, transform: `translateY(${-sube * (v ? 400 : 390)}px)` }}>
            <Publicacion banner="verificacion" color={C.exito} en={6} toque={en(dur, 0.3)} botones={[{ texto: 'Acepto las reglas', color: C.marca }]} />
            <Publicacion banner="bienvenida" color={C.marca} en={segunda} botones={[{ texto: 'Postular a beta tester', color: C.marca }, { texto: 'Novedades', color: '#3a3434' }]} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

/* ---------- Comparte tu semana, sube tu racha, postula a la beta ---------- */

export function EscenaComparte({ dur }: { dur: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const v = useVertical()
  const p = spring({ frame: frame - 4, fps, config: { damping: 13, mass: 0.9 } })
  const tam = v ? 30 : 26
  const roles = [
    { icono: <Flame size={tam} />, texto: 'Racha 7+ días', color: C.ambar },
    { icono: <Zap size={tam} />, texto: 'Racha 30+ días', color: C.cielo },
    { icono: <Dumbbell size={tam} />, texto: 'Atleta Kaibu', color: C.marcaIntensa },
    { icono: <FlaskConical size={tam} />, texto: 'Beta Tester', color: C.verde },
  ]
  const ancho = v ? 440 : 400
  const imagen = v ? { left: 320, top: 520 } : { left: 830, top: 120 }
  return (
    <AbsoluteFill>
      <Sonido efecto="whoosh" en={0} vol={0.32} />
      <TituloEscena partes={v ? [{ t: 'Comparte tu semana,' }, { t: 'sube tu racha', pildora: C.ambar, colorPildora: C.texto }, { t: 'y postula a la beta.' }] : [{ t: 'Comparte,' }, { t: 'sube tu racha', pildora: C.ambar, colorPildora: C.texto }, { t: 'y postula a la beta.' }]} desde={3} hasta={dur + 20} ancho={640} />
      <Img
        src={staticFile('capturas/mi-semana.png')}
        style={{
          position: 'absolute',
          ...imagen,
          width: ancho,
          borderRadius: 30,
          boxShadow: '0 40px 90px rgba(0,0,0,0.6)',
          transform: `perspective(1800px) rotateY(${(1 - p) * 50 - 6}deg) rotateZ(${4 - p * 2 + Math.sin(frame / 30) * 1}deg) translateY(${(1 - p) * 500 + Math.sin(frame / 24) * 10}px)`,
          opacity: entre(p * 1.5, 0, 1),
        }}
      />
      {roles.map((r, i) => (
        <Pildora
          key={r.texto}
          en={en(dur, 0.25 + i * 0.13)}
          icono={r.icono}
          texto={r.texto}
          color={r.color}
          style={v ? { left: i % 2 ? 560 : 70, top: 1330 + Math.floor(i / 2) * 100 } : { left: 1300, top: 250 + i * 120 }}
        />
      ))}
    </AbsoluteFill>
  )
}

/* ---------- Llamado final: link + QR ---------- */

export function EscenaCta({ dur, ritmo, desde }: { dur: number; ritmo: Ritmo; desde: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const v = useVertical()
  const logo = spring({ frame: frame - 2, fps, config: { damping: 11 } })
  const qr = spring({ frame: frame - 14, fps, config: { damping: 12 } })
  const link = spring({ frame: frame - 22, fps, config: { damping: 12 } })
  const latido = ritmo.latido(frame + desde)
  const qrTam = v ? 520 : 440
  const sale = suave(frame, dur - 20, 20)
  return (
    <AbsoluteFill style={{ opacity: 1 - sale }}>
      <Sonido efecto="golpe" en={1} vol={0.35} />
      <Sonido efecto="brillo" en={2} vol={0.42} />
      <Sonido efecto="pop" en={22} vol={0.5} tono={0.85} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: v ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: v ? 56 : 120,
          paddingBottom: v ? 180 : 60,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: v ? 'center' : 'flex-start', gap: v ? 30 : 34, textAlign: v ? 'center' : 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, transform: `scale(${0.6 + 0.4 * logo})`, opacity: logo, transformOrigin: v ? 'center' : 'left center' }}>
            <IconoKaibu tam={v ? 130 : 120} />
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: v ? 104 : 96, letterSpacing: '0.12em', color: C.tinta }}>KAIBU</span>
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 560, fontSize: v ? 64 : 64, letterSpacing: '-0.035em', color: C.tinta, opacity: suave(frame, 8, 12), maxWidth: 760 }}>
            Únete a la comunidad
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 16,
              padding: v ? '24px 44px' : '22px 42px',
              borderRadius: 999,
              background: C.marca,
              color: '#fff',
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: v ? 50 : 46,
              boxShadow: `0 0 ${40 + 34 * latido}px rgba(209,52,60,0.6)`,
              transform: `scale(${(0.7 + 0.3 * link) * (1 + latido * 0.02)})`,
              opacity: link,
            }}
          >
            <MessageCircle size={v ? 40 : 36} />
            {INVITACION}
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: v ? 36 : 32, color: C.ambar, opacity: suave(frame, 30, 12) }}>Gratis · Cupos de beta limitados</div>
        </div>
        <div
          style={{
            background: '#fff',
            borderRadius: 36,
            padding: 26,
            boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 ${30 + 30 * latido}px rgba(255,255,255,0.18)`,
            transform: `scale(${0.6 + 0.4 * qr}) rotate(${(1 - qr) * -8}deg)`,
            opacity: qr,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Img src={staticFile('discord/qr.svg')} style={{ width: qrTam, height: qrTam, display: 'block' }} />
          <span style={{ fontFamily: SANS, fontWeight: 650, fontSize: v ? 32 : 28, color: C.texto }}>Escanea con tu cámara</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}
