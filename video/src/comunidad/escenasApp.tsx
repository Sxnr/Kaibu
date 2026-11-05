// Escenas con la app: tu plan, anotar comidas (cazuela y completo) y el ajuste semanal gratis.
import { Croissant, Sandwich, ShoppingCart, Soup } from 'lucide-react'
import { spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { Elevar, IconoKaibu, Sonido, Toque } from '../componentes'
import { TarjetaAjuste, TarjetaAlimento, TarjetaCadena, TarjetaMeta } from '../Tarjetas'
import { C, DISPLAY } from '../tema'
import { ConTiempo } from './escenasMarca'
import { EscenaTelefono, Pildora, useVertical } from './piezas'

const en = (dur: number, x: number) => Math.round(dur * x)

/** Logo de Kaibu que estalla en el drop (solo vertical: abre la escena del plan). */
function LogoDrop({ hasta }: { hasta: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const p = spring({ frame, fps, config: { damping: 10, mass: 0.7 } })
  const sale = spring({ frame: frame - hasta, fps, config: { damping: 14 } })
  if (sale > 0.99) return null
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36, transform: `scale(${(0.5 + 0.5 * p) * (1 - sale * 0.6)}) translateY(${-sale * 700}px)`, opacity: 1 - sale }}>
        <IconoKaibu tam={190} style={{ filter: 'drop-shadow(0 24px 50px rgba(0,0,0,0.5))' }} />
        <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 150, letterSpacing: '0.12em', color: C.tinta }}>KAIBU</span>
      </div>
    </div>
  )
}

export function EscenaPlan({ dur }: { dur: number }) {
  const v = useVertical()
  const inicio = v ? 34 : 0
  const d = dur - inicio
  return (
    <>
      {v && <LogoDrop hasta={inicio - 4} />}
      <EscenaTelefono
        dur={dur}
        src="tu-plan"
        inicio={inicio}
        scroll={v ? [[0, 0]] : [[0, 0], [0.55, 0], [0.8, 330], [1, 360]]}
        titulo={v ? [{ t: 'Tu plan,' }, { t: 'calculado para ti.', pildora: C.marca }] : [{ t: 'Tu plan, según' }, { t: 'tu cuerpo.', pildora: C.marca }, { t: 'Explicado.', color: C.tintaSuave }]}
        encima={(k) => (
          <>
            <Elevar k={k} de={{ x: 20, y: 133, w: 350 }} alto={170} conteo a={v ? { dx: 40, dy: -60, z: 260, ry: -4 } : { dx: -60, dy: -40, z: 240, ry: 8 }} en={inicio + en(d, 0.12)} hasta={inicio + en(d, v ? 0.98 : 0.5)} flotar={1}>
              <ConTiempo en={inicio + en(d, 0.12)}>{(t) => <TarjetaMeta k={k} t={t} />}</ConTiempo>
            </Elevar>
            {!v && (
              <Elevar k={k} de={{ x: 20, y: 470, w: 350 }} alto={120} a={{ dx: -80, dy: -240, z: 250, ry: 8 }} en={en(d, 0.55)} hasta={en(d, 0.99)} flotar={1}>
                <ConTiempo en={en(d, 0.55)}>{(t) => <TarjetaCadena k={k} t={t} />}</ConTiempo>
              </Elevar>
            )}
          </>
        )}
      />
    </>
  )
}

export function EscenaRegistrar({ dur }: { dur: number }) {
  const v = useVertical()
  const tam = v ? 30 : 26
  const pildoras = [
    { icono: <Soup size={tam} />, texto: 'Cazuela', color: C.ambar, v: { left: 70, top: 640 }, h: { left: 130, top: 640 } },
    { icono: <Sandwich size={tam} />, texto: 'Completo', color: C.marcaIntensa, v: { right: 70, top: 780 }, h: { left: 360, top: 760 } },
    { icono: <Croissant size={tam} />, texto: 'Marraqueta', color: C.verde, v: { left: 90, top: 1400 }, h: { left: 130, top: 880 } },
    { icono: <ShoppingCart size={tam} />, texto: 'Productos del súper', color: C.cielo, v: null, h: { left: 420, top: 640 } },
  ]
  return (
    <EscenaTelefono
      dur={dur}
      src="agregar-cazuela"
      titulo={[{ t: 'Anota tus comidas' }, { t: 'en segundos.', pildora: C.ambar, colorPildora: C.texto }]}
      encima={(k) => (
        <>
          <Toque k={k} x={200} y={405} en={en(dur, 0.32)} />
          <Elevar k={k} de={{ x: 20, y: 380, w: 350 }} alto={56} a={v ? { dx: 30, dy: 160, z: 240, ry: -4 } : { dx: -70, dy: 180, z: 240, ry: 8 }} en={en(dur, 0.4)} hasta={en(dur, 1.05)} flotar={1}>
            <ConTiempo en={en(dur, 0.4)}>{(t) => <TarjetaAlimento k={k} t={t} nombre="Cazuela de ave" detalle="1 plato · 320 kcal · P 21 g" />}</ConTiempo>
          </Elevar>
        </>
      )}
      alrededor={pildoras.map((p, i) => {
        const lugar = v ? p.v : p.h
        if (!lugar) return null
        return <Pildora key={p.texto} en={en(dur, 0.5 + i * 0.09)} icono={p.icono} texto={p.texto} color={p.color} style={lugar} />
      })}
    />
  )
}

export function EscenaAjuste({ dur }: { dur: number }) {
  const v = useVertical()
  return (
    <>
      <Sonido efecto="brillo" en={en(dur, 0.72)} vol={0.35} />
      <EscenaTelefono
        dur={dur}
        src="progreso"
        scroll={[[0, 0], [1, 120]]}
        titulo={[{ t: 'Se ajusta cada semana.' }, { t: 'Gratis.', pildora: C.verde, colorPildora: C.texto }]}
        encima={(k) => (
          <Elevar k={k} de={{ x: 20, y: 300, w: 350 }} alto={200} conteo a={v ? { dx: 30, dy: 0, z: 280, ry: -4 } : { dx: -90, dy: 0, z: 260, ry: 8 }} en={en(dur, 0.2)} hasta={en(dur, 1.05)} flotar={1}>
            <ConTiempo en={en(dur, 0.2)}>{(t) => <TarjetaAjuste k={k} t={t} />}</ConTiempo>
          </Elevar>
        )}
      />
    </>
  )
}
