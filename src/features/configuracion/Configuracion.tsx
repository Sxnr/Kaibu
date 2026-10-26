import { zodResolver } from '@hookform/resolvers/zod'
import { Armchair, ArrowLeft, Check, Dumbbell, Footprints, HardHat, Scale, TrendingDown } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm, type FieldPath } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router'
import { useSesion, useUsuario } from '@/app/useSesion'
import { Barra } from '@/components/Barra'
import { Logotipo } from '@/components/Logo'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Casilla } from '@/components/ui/checkbox'
import { Opciones } from '@/components/ui/opciones'
import { guardar } from '@/data/escritura'
import { ajusteCalorico, velocidadKgSemana } from '@/domain/calc/energia'
import { repartoInicial } from '@/domain/calc/macros'
import { proyeccionLlegada } from '@/domain/calc/peso'
import type { Velocidad } from '@/domain/calc/types'
import { fechaCompleta, formatoNumero, hoyISO, parseDecimal } from '@/domain/format/formato'
import { cn, vibrar } from '@/lib/utils'
import { esquemaPerfil, VALORES_INICIALES, type DatosPerfil } from './esquema'
import { resumenRespuesta } from './resumen'

const CLAVE_BORRADOR = 'kaibu:borrador-configuracion'

interface Paso {
  id: string
  campos: FieldPath<DatosPerfil>[]
  titulo: string
  ayuda?: string
}

const PASOS: Paso[] = [
  { id: 'nombre', campos: ['nombre'], titulo: '¿Cómo te llamas?', ayuda: 'Así te saludaremos en la app.' },
  { id: 'sexo', campos: ['sexo'], titulo: 'Sexo', ayuda: 'Se usa en la fórmula para estimar tu metabolismo.' },
  {
    id: 'nacimiento',
    campos: ['fechaNacimiento'],
    titulo: 'Fecha de nacimiento',
    ayuda: 'Tu edad cambia cuánta energía gastas en reposo.',
  },
  { id: 'estatura', campos: ['estaturaCm'], titulo: 'Estatura' },
  { id: 'peso', campos: ['pesoKg'], titulo: 'Peso actual', ayuda: 'Idealmente en ayunas, después de ir al baño.' },
  { id: 'actividad', campos: ['actividad'], titulo: 'Tu día a día', ayuda: 'Sin contar el gym ni el deporte.' },
  {
    id: 'entrenamiento',
    campos: ['diasEntrenamiento'],
    titulo: 'Días de entrenamiento',
    ayuda: 'Cuántos días por semana entrenas o haces deporte.',
  },
  { id: 'objetivo', campos: ['objetivo'], titulo: 'Tu objetivo' },
  { id: 'meta', campos: ['pesoMeta'], titulo: 'Peso meta', ayuda: 'El peso al que quieres llegar en esta fase.' },
  { id: 'velocidad', campos: ['velocidad'], titulo: 'Velocidad', ayuda: 'Más lento es más fácil de sostener.' },
  { id: 'comidas', campos: ['numComidas', 'colaciones'], titulo: 'Comidas al día' },
]

function leerBorrador(): Partial<DatosPerfil> {
  try {
    return { ...VALORES_INICIALES, ...(JSON.parse(localStorage.getItem(CLAVE_BORRADOR) ?? '{}') as Partial<DatosPerfil>) }
  } catch {
    return VALORES_INICIALES
  }
}

export default function Configuracion() {
  const userId = useUsuario()
  const { perfil } = useSesion()
  const navegar = useNavigate()
  const terminando = useRef(false)
  const [indice, setIndice] = useState(0)
  const [direccion, setDireccion] = useState(1)
  // Paso más lejano al que se llegó (en PC se puede volver a cualquiera anterior desde la lista).
  const [alcanzado, setAlcanzado] = useState(0)

  const { control, register, handleSubmit, trigger, watch, formState } = useForm<DatosPerfil>({
    resolver: zodResolver(esquemaPerfil),
    defaultValues: leerBorrador(),
    mode: 'onTouched',
  })
  const { errors } = formState
  const valores = watch()

  // Guarda el avance por si se cierra la app a mitad del cuestionario.
  useEffect(() => {
    const sub = watch((v) => localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(v)))
    return () => sub.unsubscribe()
  }, [watch])

  const pasos = useMemo(
    () => PASOS.filter((p) => valores.objetivo !== 'mantener' || (p.id !== 'meta' && p.id !== 'velocidad')),
    [valores.objetivo],
  )
  const paso = pasos[Math.min(indice, pasos.length - 1)]!
  const esUltimo = indice >= pasos.length - 1

  if (perfil?.onboardingCompleto && !terminando.current) return <Navigate to="/" replace />

  const terminar = handleSubmit(async (d) => {
    terminando.current = true
    const peso = parseDecimal(d.pesoKg)!
    const hoy = hoyISO()
    const n = Number(d.numComidas) as 3 | 4
    await guardar('perfiles', {
      ...(perfil ?? {
        userId,
        kcalManual: null,
        proteinaGKg: null,
        aguaMetaMl: null,
        tema: 'sistema' as const,
        deletedAt: null,
        updatedAt: '',
      }),
      userId,
      nombre: d.nombre.trim(),
      sexo: d.sexo,
      fechaNacimiento: d.fechaNacimiento,
      estaturaCm: parseDecimal(d.estaturaCm)!,
      actividad: d.actividad,
      diasEntrenamiento: Number(d.diasEntrenamiento),
      objetivo: d.objetivo,
      velocidad: d.objetivo === 'mantener' ? 'recomendada' : d.velocidad,
      pesoInicial: peso,
      pesoMeta: d.objetivo === 'mantener' ? peso : parseDecimal(d.pesoMeta)!,
      numComidas: n,
      colaciones: d.colaciones,
      comidas: repartoInicial(n, d.colaciones),
      faseInicio: hoy,
      onboardingCompleto: true,
    })
    await guardar('pesos', { userId, fecha: hoy, kg: peso, updatedAt: '', deletedAt: null })
    localStorage.removeItem(CLAVE_BORRADOR)
    vibrar()
    navegar('/tu-plan', { replace: true })
  })

  const siguiente = async () => {
    const ok = await trigger(paso.campos)
    if (!ok) return
    if (esUltimo) return void terminar()
    setDireccion(1)
    setIndice((i) => i + 1)
    setAlcanzado((a) => Math.max(a, indice + 1))
  }
  const irA = (i: number) => {
    if (i > alcanzado || i === indice) return
    setDireccion(i > indice ? 1 : -1)
    setIndice(i)
  }
  const atras = () => {
    setDireccion(-1)
    setIndice((i) => Math.max(0, i - 1))
  }

  const peso = parseDecimal(valores.pesoKg ?? '')
  const meta = parseDecimal(valores.pesoMeta ?? '')

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[26rem_minmax(0,1fr)]">
      {/* PC: lista de pasos con las respuestas; se puede volver a cualquier paso ya visitado */}
      <aside className="hidden border-r border-borde bg-superficie lg:flex lg:flex-col lg:gap-8 lg:p-10">
        <Logotipo />
        <div>
          <p className="rotulo">Tu perfil</p>
          <p className="mt-1 text-sm text-texto-secundario">1 minuto · {pasos.length} preguntas. Con esto calculamos tu plan.</p>
        </div>
        <nav aria-label="Pasos del cuestionario">
          <ol className="flex flex-col gap-1">
            {pasos.map((p, i) => {
              const respuesta = resumenRespuesta(p.id, valores)
              const hecho = i < indice || (i <= alcanzado && i !== indice && !!respuesta)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => irA(i)}
                    disabled={i > alcanzado}
                    aria-current={i === indice ? 'step' : undefined}
                    className={cn(
                      'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors disabled:cursor-default',
                      i === indice ? 'bg-superficie-elevada' : 'hover:bg-superficie-elevada/60 disabled:hover:bg-transparent',
                    )}
                  >
                    <span
                      className={cn(
                        'num grid size-7 shrink-0 place-items-center rounded-full border-2 text-sm font-bold',
                        i === indice && 'border-marca text-texto-marca',
                        hecho && i !== indice && 'border-marca bg-marca text-sobre-marca',
                        !hecho && i !== indice && 'border-borde-control text-texto-secundario',
                      )}
                    >
                      {hecho && i !== indice ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-sm font-semibold', i > alcanzado && 'text-texto-secundario')}>{p.titulo}</span>
                      {respuesta && i <= alcanzado && <span className="block truncate text-sm text-texto-secundario">{respuesta}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>
      </aside>

      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:max-w-3xl lg:px-12 lg:pt-12 lg:pb-12">
        <div className="flex items-center gap-2">
          <Boton variante="fantasma" tamano="icono" onClick={atras} disabled={indice === 0} aria-label="Pregunta anterior">
            <ArrowLeft aria-hidden />
          </Boton>
          <Barra
            porcentaje={((indice + 1) / pasos.length) * 100}
            etiqueta="Avance del cuestionario"
            texto={`Pregunta ${indice + 1} de ${pasos.length}`}
            className="flex-1"
          />
          <span className="num w-12 text-right text-sm text-texto-secundario">
            {indice + 1}/{pasos.length}
          </span>
        </div>

        <form
          className="flex flex-1 flex-col"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void siguiente()
          }}
        >
          <AnimatePresence mode="wait" custom={direccion}>
            <m.div
              key={paso.id}
              initial={{ opacity: 0, x: 32 * direccion }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 * direccion }}
              transition={{ duration: 0.22 }}
              className="flex flex-1 flex-col gap-6 pt-10"
            >
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl">{paso.titulo}</h1>
                {paso.ayuda && <p className="text-texto-secundario lg:text-lg">{paso.ayuda}</p>}
              </div>

              {paso.id === 'nombre' && (
                <Campo etiqueta="Nombre" error={errors.nombre?.message}>
                  {(a) => <Entrada autoComplete="given-name" {...a} {...register('nombre')} />}
                </Campo>
              )}

              {paso.id === 'sexo' && (
                <Controller
                  control={control}
                  name="sexo"
                  render={({ field }) => (
                    <Opciones
                      etiqueta="Sexo"
                      valor={field.value}
                      alCambiar={field.onChange}
                      columnas={2}
                      invalido={!!errors.sexo}
                      opciones={[
                        { valor: 'hombre', titulo: 'Hombre' },
                        { valor: 'mujer', titulo: 'Mujer' },
                      ]}
                    />
                  )}
                />
              )}

              {paso.id === 'nacimiento' && (
                <Campo etiqueta="Fecha de nacimiento" error={errors.fechaNacimiento?.message}>
                  {(a) => (
                    <Entrada type="date" max={hoyISO()} min="1920-01-01" autoComplete="bday" {...a} {...register('fechaNacimiento')} />
                  )}
                </Campo>
              )}

              {paso.id === 'estatura' && (
                <Campo etiqueta="Estatura (cm)" error={errors.estaturaCm?.message}>
                  {(a) => <Entrada inputMode="decimal" placeholder="Ej. 172" {...a} {...register('estaturaCm')} />}
                </Campo>
              )}

              {paso.id === 'peso' && (
                <Campo etiqueta="Peso actual (kg)" error={errors.pesoKg?.message}>
                  {(a) => <Entrada inputMode="decimal" placeholder="Ej. 78,5" {...a} {...register('pesoKg')} />}
                </Campo>
              )}

              {paso.id === 'actividad' && (
                <Controller
                  control={control}
                  name="actividad"
                  render={({ field }) => (
                    <Opciones
                      etiqueta="Actividad diaria"
                      className="lg:grid-cols-3"
                    tarjetaEnPc
                      valor={field.value}
                      alCambiar={field.onChange}
                      invalido={!!errors.actividad}
                      opciones={[
                        {
                          valor: 'sedentario',
                          titulo: 'Mayormente sentado',
                          detalle: 'Oficina, estudio, manejo.',
                          icono: <Armchair aria-hidden />,
                        },
                        {
                          valor: 'ligero',
                          titulo: 'De pie o caminando parte del día',
                          detalle: 'Comercio, docencia, trámites a pie.',
                          icono: <Footprints aria-hidden />,
                        },
                        {
                          valor: 'activo',
                          titulo: 'Trabajo físico o caminas mucho',
                          detalle: 'Construcción, bodega, reparto.',
                          icono: <HardHat aria-hidden />,
                        },
                      ]}
                    />
                  )}
                />
              )}

              {paso.id === 'entrenamiento' && (
                <Controller
                  control={control}
                  name="diasEntrenamiento"
                  render={({ field }) => (
                    <Opciones
                      etiqueta="Días de entrenamiento por semana"
                      valor={field.value}
                      alCambiar={field.onChange}
                      columnas={4}
                      className="lg:grid-cols-8"
                      invalido={!!errors.diasEntrenamiento}
                      opciones={(['0', '1', '2', '3', '4', '5', '6', '7'] as const).map((d) => ({
                        valor: d,
                        titulo: <span className="num text-2xl">{d}</span>,
                      }))}
                    />
                  )}
                />
              )}

              {paso.id === 'objetivo' && (
                <Controller
                  control={control}
                  name="objetivo"
                  render={({ field }) => (
                    <Opciones
                      etiqueta="Objetivo"
                      className="lg:grid-cols-3"
                    tarjetaEnPc
                      valor={field.value}
                      alCambiar={field.onChange}
                      invalido={!!errors.objetivo}
                      opciones={[
                        {
                          valor: 'perder',
                          titulo: 'Perder grasa',
                          detalle: 'Déficit de calorías, cuidando el músculo.',
                          icono: <TrendingDown aria-hidden />,
                        },
                        {
                          valor: 'mantener',
                          titulo: 'Mantener',
                          detalle: 'Comer lo que gastas y mejorar tu composición.',
                          icono: <Scale aria-hidden />,
                        },
                        {
                          valor: 'ganar',
                          titulo: 'Ganar músculo',
                          detalle: 'Un pequeño superávit para crecer.',
                          icono: <Dumbbell aria-hidden />,
                        },
                      ]}
                    />
                  )}
                />
              )}

              {paso.id === 'meta' && (
                <Campo
                  etiqueta="Peso meta (kg)"
                  error={errors.pesoMeta?.message}
                  ayuda={peso ? `Hoy pesas ${formatoNumero(peso, 1)} kg.` : undefined}
                >
                  {(a) => <Entrada inputMode="decimal" placeholder="Ej. 72" {...a} {...register('pesoMeta')} />}
                </Campo>
              )}

              {paso.id === 'velocidad' && valores.objetivo && valores.objetivo !== 'mantener' && (
                <Controller
                  control={control}
                  name="velocidad"
                  render={({ field }) => (
                    <Opciones
                      etiqueta="Velocidad"
                      className="lg:grid-cols-3"
                    tarjetaEnPc
                      valor={field.value}
                      alCambiar={field.onChange}
                      opciones={(['lenta', 'recomendada', 'rapida'] as Velocidad[]).map((v) => {
                        const kg = velocidadKgSemana(valores.objetivo!, v)
                        const llegada =
                          peso && meta
                            ? proyeccionLlegada({
                                pesoActual: peso,
                                pesoMeta: meta,
                                ritmoReal: null,
                                ritmoPlaneado: kg,
                                objetivo: valores.objetivo!,
                                semanasDatos: 0,
                                hoy: hoyISO(),
                              })
                            : null
                        return {
                          valor: v,
                          titulo: `${v === 'lenta' ? 'Lenta' : v === 'recomendada' ? 'Recomendada' : 'Rápida'} · ${formatoNumero(kg, 2).replace(/0$/, '')} kg/semana`,
                          detalle: `${ajusteCalorico(valores.objetivo!, kg) > 0 ? '+' : '−'}${formatoNumero(Math.abs(ajusteCalorico(valores.objetivo!, kg)))} kcal al día${
                            llegada ? ` · llegarías aprox. el ${fechaCompleta(llegada.fecha)}` : ''
                          }`,
                        }
                      })}
                    />
                  )}
                />
              )}

              {paso.id === 'comidas' && (
                <div className="flex flex-col gap-5">
                  <Controller
                    control={control}
                    name="numComidas"
                    render={({ field }) => (
                      <Opciones
                        etiqueta="Comidas al día"
                        valor={field.value}
                        alCambiar={field.onChange}
                        columnas={2}
                        invalido={!!errors.numComidas}
                        opciones={[
                          { valor: '3', titulo: '3 comidas', detalle: 'Desayuno, almuerzo y cena' },
                          { valor: '4', titulo: '4 comidas', detalle: 'Desayuno, almuerzo, once y cena' },
                        ]}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="colaciones"
                    render={({ field }) => (
                      <div className="flex items-start gap-3 rounded-2xl border border-borde p-4">
                        <Casilla
                          id="colaciones"
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(v === true)}
                          className="mt-0.5"
                        />
                        <label htmlFor="colaciones" className="text-sm">
                          <span className="font-semibold">Agregar colaciones</span>
                          <span className="block text-texto-secundario">Para snacks entre comidas (10 % del día).</span>
                        </label>
                      </div>
                    )}
                  />
                  {errors.numComidas && (
                    <p role="alert" className="text-sm font-medium text-texto-marca">
                      {errors.numComidas.message}
                    </p>
                  )}
                </div>
              )}

              {(['sexo', 'actividad', 'diasEntrenamiento', 'objetivo'] as const).map(
                (c) =>
                  paso.campos.includes(c) &&
                  errors[c] && (
                    <p key={c} role="alert" className="text-sm font-medium text-texto-marca">
                      {errors[c]?.message}
                    </p>
                  ),
              )}
            </m.div>
          </AnimatePresence>

          <Boton type="submit" ancho="completo" className="mt-8 lg:w-auto lg:min-w-56 lg:self-end" disabled={formState.isSubmitting}>
            {esUltimo ? 'Ver mi plan' : 'Continuar'}
          </Boton>
        </form>
      </div>
    </div>
  )
}
