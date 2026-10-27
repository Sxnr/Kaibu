// Cierre: el llamado a usar Kaibu, con logo, "Gratis. Sin letra chica." y la dirección web.
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { IconoKaibu, Titulo } from './componentes'
import { suave } from './util'
import type { Ritmo } from './ritmo'
import { C, DISPLAY, SANS } from './tema'

export function Cierre({ ritmo, desde, dur, url }: { ritmo: Ritmo; desde: number; dur: number; url: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const v = ritmo.formato === 'vertical'
  const corte = Math.round(Math.min(2.6 * fps, dur * 0.38))
  const marca = frame - corte
  const p = spring({ frame: marca, fps, config: { damping: 11 } })
  const pastilla = spring({ frame: marca - 16, fps, config: { damping: 12 } })
  const tam = v ? 230 : 170

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ position: 'absolute', top: v ? 760 : 380, left: 80, right: 80 }}>
        <Titulo partes={[{ t: 'Deja de pagar por' }, { t: 'una multiplicación.', pildora: C.marca }]} desde={4} hasta={corte} tam={v ? 96 : 92} alinear="center" />
      </div>

      {marca >= 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: v ? 34 : 26, marginTop: v ? -60 : -20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tam * 0.18, transform: `scale(${0.6 + 0.4 * p})`, opacity: p }}>
            <IconoKaibu tam={tam} style={{ filter: 'drop-shadow(0 24px 50px rgba(0,0,0,0.45))', transform: `rotateY(${(1 - p) * 90}deg)` }} />
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: tam * 0.72, letterSpacing: '0.12em', color: C.tinta }}>KAIBU</span>
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 520, fontSize: v ? 60 : 54, letterSpacing: '-0.035em', color: C.tinta, opacity: suave(frame, corte + 8, 12) }}>
            Tu progreso, por fases.
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 650, fontSize: v ? 46 : 40, color: C.ambar, opacity: suave(frame, corte + 14, 12) }}>Gratis. Sin letra chica.</div>
          <div
            style={{
              marginTop: v ? 30 : 18,
              padding: v ? '26px 56px' : '22px 48px',
              borderRadius: 999,
              background: C.marca,
              color: '#fff',
              fontFamily: SANS,
              fontWeight: 650,
              fontSize: v ? 44 : 36,
              boxShadow: `0 0 ${40 + 30 * ritmo.latido(frame + desde)}px rgba(209,52,60,0.55)`,
              transform: `scale(${0.7 + 0.3 * pastilla})`,
              opacity: pastilla,
            }}
          >
            {url}
          </div>
        </div>
      )}
    </AbsoluteFill>
  )
}
