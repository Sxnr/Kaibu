// Tarjetas con números vivos (cuentan, se llenan) que se elevan desde la pantalla del teléfono.
import { Check, Flame, Info, Plus, TrendingDown } from 'lucide-react'
import { interpolate, spring } from 'remotion'
import { Caja, Llenado } from './componentes'
import { decimal, miles, numero, rotulo } from './util'
import { C, DISPLAY, SANS } from './tema'

const avance = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
const resorte = (t: number) => spring({ frame: t, fps: 30, config: { damping: 14 } })

/** Meta diaria que cuenta hasta 1.403 kcal. */
export function TarjetaMeta({ k, t }: { k: number; t: number }) {
  return (
    <Caja k={k}>
      <p style={rotulo(k)}>Meta diaria · Déficit</p>
      <p style={{ margin: `${6 * k}px 0 0` }}>
        <span style={numero(k, 76, C.textoMarca)}>{miles(1403 * avance(t, 4, 30))}</span>
        <span style={{ ...numero(k, 26, C.secundario), fontWeight: 600 }}> kcal</span>
      </p>
      <p style={{ display: 'flex', gap: 6 * k, margin: `${10 * k}px 0 0`, fontSize: 14 * k, color: C.secundario, lineHeight: 1.35 }}>
        <Info size={15 * k} style={{ flexShrink: 0, marginTop: 2 * k }} />
        Restamos 550 kcal al día para bajar 0,5 kg por semana (1 kg ≈ 7.700 kcal).
      </p>
    </Caja>
  )
}

/** La cadena de cálculo: la misma fórmula del inicio, explicada paso a paso. */
export function TarjetaCadena({ k, t }: { k: number; t: number }) {
  const filas = [
    { n: 'Fórmula Mifflin-St Jeor', v: '1.420' },
    { n: '× actividad ligera (1,375)', v: '1.953' },
    { n: '− déficit para −0,5 kg/sem', v: '− 550' },
  ]
  return (
    <Caja k={k}>
      <p style={rotulo(k)}>Así sale tu número</p>
      <div style={{ marginTop: 8 * k }}>
        {filas.map((f, i) => {
          const p = resorte(t - 6 - i * 7)
          return (
            <div
              key={f.n}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                padding: `${9 * k}px 0`,
                borderBottom: `${1 * k}px solid ${C.borde}`,
                opacity: p,
                transform: `translateX(${(1 - p) * 30 * k}px)`,
                fontSize: 15 * k,
              }}
            >
              <span>{f.n}</span>
              <span style={numero(k, 22)}>{f.v}</span>
            </div>
          )
        })}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10 * k, opacity: resorte(t - 30) }}>
          <span style={{ fontWeight: 650, fontSize: 15 * k }}>Tu meta diaria</span>
          <span style={numero(k, 34, C.textoMarca)}>1.403 kcal</span>
        </div>
      </div>
    </Caja>
  )
}

export function TarjetaMacros({ k, t }: { k: number; t: number }) {
  const macros = [
    { n: 'Proteína', g: 141, pct: 40, c: C.proteina, d: '2 g por kg de peso' },
    { n: 'Carbos', g: 84, pct: 24, c: C.carbos, d: 'Lo que queda (4 kcal/g)' },
    { n: 'Grasas', g: 56, pct: 36, c: C.grasas, d: '0,8 g por kg de peso' },
  ]
  return (
    <Caja k={k}>
      <p style={{ fontWeight: 650, fontSize: 16 * k, margin: 0 }}>Macros</p>
      {macros.map((m, i) => {
        const p = avance(t, 6 + i * 6, 30 + i * 6)
        return (
          <div key={m.n} style={{ marginTop: 13 * k }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 15 * k }}>
              <span>{m.n}</span>
              <span>
                <span style={numero(k, 22)}>{Math.round(m.g * p)} g</span>
                <span style={{ color: C.secundario, fontSize: 13 * k }}> ({m.pct} %)</span>
              </span>
            </div>
            <div style={{ marginTop: 5 * k }}>
              <Llenado k={k} pct={m.pct * 2} color={m.c} p={p} />
            </div>
            <p style={{ margin: `${4 * k}px 0 0`, fontSize: 12.5 * k, color: C.secundario }}>{m.d}</p>
          </div>
        )
      })}
    </Caja>
  )
}

/** Un alimento reciente: el "+" se vuelve check al agregarlo. */
export function TarjetaAlimento({ k, t, nombre, detalle }: { k: number; t: number; nombre: string; detalle: string }) {
  const listo = resorte(t - 12)
  return (
    <Caja k={k} style={{ display: 'flex', alignItems: 'center', gap: 12 * k, padding: `${12 * k}px ${16 * k}px`, borderRadius: 20 * k }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 16 * k, fontWeight: 560 }}>{nombre}</span>
        <span style={{ display: 'block', fontSize: 13 * k, color: C.secundario }}>{detalle}</span>
      </span>
      <span
        style={{
          position: 'relative',
          width: 38 * k,
          height: 38 * k,
          borderRadius: 12 * k,
          background: listo > 0.5 ? C.exito : C.elevada,
          display: 'grid',
          placeItems: 'center',
          transform: `scale(${1 + Math.sin(Math.min(1, listo) * Math.PI) * 0.25})`,
        }}
      >
        {listo > 0.5 ? <Check size={20 * k} color="#fff" strokeWidth={3} /> : <Plus size={20 * k} color={C.texto} />}
      </span>
    </Caja>
  )
}

export function TarjetaKcal({ k, t }: { k: number; t: number }) {
  const p = avance(t, 4, 32)
  return (
    <Caja k={k}>
      <p style={rotulo(k)}>Kcal restantes</p>
      <p style={{ margin: `${4 * k}px 0 ${10 * k}px`, ...numero(k, 84, C.textoMarca) }}>{miles(1370 - 591 * p)}</p>
      <Llenado k={k} pct={43} color={C.marca} p={p} />
      <p style={{ margin: `${10 * k}px 0 0`, fontSize: 14 * k, color: C.secundario }}>
        <b style={{ color: C.texto, fontFamily: DISPLAY, fontSize: 17 * k }}>{miles(591 * p)}</b> consumidas de <b style={{ color: C.texto }}>1.370</b>
      </p>
    </Caja>
  )
}

export function ChipRacha({ k, t }: { k: number; t: number }) {
  const dias = Math.round(12 * avance(t, 4, 24))
  const llama = 1 + Math.sin(t / 3) * 0.06
  return (
    <Caja k={k} style={{ borderRadius: 999, padding: `${8 * k}px ${14 * k}px`, display: 'flex', alignItems: 'center', gap: 6 * k, width: 'fit-content' }}>
      <Flame size={18 * k} color={C.marca} style={{ transform: `scale(${llama})` }} />
      <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 19 * k }}>{dias}</span>
      <span style={{ fontSize: 15 * k }}>días</span>
    </Caja>
  )
}

export function TarjetaPeso({ k, t }: { k: number; t: number }) {
  const p = avance(t, 4, 34)
  return (
    <Caja k={k}>
      <p style={rotulo(k)}>Fase · Déficit</p>
      <p style={{ margin: `${6 * k}px 0 0` }}>
        <span style={numero(k, 70)}>{decimal(70.5 - 2.4 * p)}</span>
        <span style={{ fontSize: 17 * k, color: C.secundario }}> kg promedio 7 días</span>
      </p>
      <p style={{ margin: `${2 * k}px 0 ${12 * k}px`, fontSize: 13 * k, color: C.secundario }}>inicio 70,5 kg · meta 64,0 kg</p>
      <Llenado k={k} pct={37} color={C.marca} p={p} />
      <p style={{ margin: `${10 * k}px 0 0`, fontSize: 14 * k, color: C.secundario }}>
        <b style={{ color: C.texto }}>{Math.round(37 * p)} %</b> logrado · llegas a tu meta el 15 de diciembre
      </p>
    </Caja>
  )
}

export function ChipRitmo({ k, t }: { k: number; t: number }) {
  const p = avance(t, 4, 26)
  return (
    <Caja k={k} style={{ display: 'flex', alignItems: 'center', gap: 12 * k }}>
      <span style={{ width: 44 * k, height: 44 * k, borderRadius: 14 * k, background: '#e3f1ea', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <TrendingDown size={24 * k} color={C.exito} />
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 14 * k, color: C.secundario }}>Ritmo real (2 semanas)</span>
        <span style={{ ...numero(k, 28, C.exito), display: 'block' }}>−{decimal(0.62 * p, 2)} kg/sem</span>
      </span>
      <span style={{ fontSize: 12.5 * k, color: C.secundario, textAlign: 'right' }}>
        planeado
        <br />
        <b style={{ color: C.texto, fontFamily: DISPLAY, fontSize: 17 * k }}>−0,50</b>
      </span>
    </Caja>
  )
}

/** Ajuste semanal: si te estancas, Kaibu sugiere −150 kcal y tú decides. */
export function TarjetaAjuste({ k, t }: { k: number; t: number }) {
  const p = avance(t, 4, 26)
  const boton = resorte(t - 18)
  return (
    <Caja k={k}>
      <p style={rotulo(k)}>Ajuste semanal · cada domingo</p>
      <p style={{ margin: `${6 * k}px 0 0`, fontSize: 14 * k, color: C.secundario }}>Si en 2 semanas bajas menos de la mitad de lo planeado, te sugerimos:</p>
      <p style={{ margin: `${4 * k}px 0 0` }}>
        <span style={numero(k, 44, C.textoMarca)}>−{miles(150 * p)}</span>
        <span style={{ ...numero(k, 20, C.secundario), fontWeight: 600 }}> kcal al día</span>
      </p>
      <p style={{ display: 'flex', gap: 8 * k, margin: `${10 * k}px 0 0`, opacity: boton, transform: `scale(${0.9 + 0.1 * boton})`, transformOrigin: 'left center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 * k, background: C.marca, color: '#fff', borderRadius: 10 * k, padding: `${7 * k}px ${12 * k}px`, fontSize: 14 * k, fontWeight: 600 }}>
          <Check size={15 * k} />
          Aceptar
        </span>
        <span style={{ border: `${1 * k}px solid ${C.borde}`, borderRadius: 10 * k, padding: `${7 * k}px ${12 * k}px`, fontSize: 14 * k, color: C.texto }}>Ahora no</span>
      </p>
    </Caja>
  )
}

/** Aviso inferior de la app al agregar (con "Deshacer"). */
export function Aviso({ k, texto, detalle }: { k: number; texto: string; detalle: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12 * k,
        background: C.superficie,
        border: `${1 * k}px solid ${C.borde}`,
        borderRadius: 16 * k,
        padding: `${12 * k}px ${14 * k}px`,
        boxShadow: `0 ${10 * k}px ${30 * k}px rgba(0,0,0,0.18)`,
        fontFamily: SANS,
        color: C.texto,
      }}
    >
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 15 * k, fontWeight: 600 }}>{texto}</span>
        <span style={{ display: 'block', fontSize: 13 * k, color: C.secundario }}>{detalle}</span>
      </span>
      <span style={{ background: C.marca, color: '#fff', borderRadius: 10 * k, padding: `${8 * k}px ${12 * k}px`, fontSize: 14 * k, fontWeight: 600 }}>Deshacer</span>
    </div>
  )
}
