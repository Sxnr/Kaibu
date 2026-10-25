import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useSesion, useUsuario } from '@/app/useSesion'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Casilla } from '@/components/ui/checkbox'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { Selector } from '@/components/ui/selector'
import { Tarjeta } from '@/components/ui/tarjeta'
import { usePesos } from '@/data/consultas'
import { guardar } from '@/data/escritura'
import { repartoInicial } from '@/domain/calc/macros'
import { formatoNumero, hoyISO, parseDecimal } from '@/domain/format/formato'
import { esquemaPerfil, type DatosPerfil } from '@/features/configuracion/esquema'
import { pesoReferencia } from '@/features/plan/usePlan'

const num = (v: number | null | undefined) => (v === null || v === undefined ? '' : formatoNumero(v, v % 1 ? 1 : 0).replace(/\./g, ''))

/** Editar perfil, objetivo y comidas en una sola pantalla. Cambiar el objetivo inicia una fase nueva. */
export default function EditarPerfil() {
  const userId = useUsuario()
  const { perfil } = useSesion()
  const pesos = usePesos(userId)
  const navegar = useNavigate()
  const pesoActual = pesoReferencia(perfil, pesos)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DatosPerfil>({
    resolver: zodResolver(esquemaPerfil),
    values: perfil
      ? {
          nombre: perfil.nombre,
          sexo: perfil.sexo ?? 'hombre',
          fechaNacimiento: perfil.fechaNacimiento ?? '',
          estaturaCm: num(perfil.estaturaCm),
          pesoKg: num(pesoActual),
          actividad: perfil.actividad ?? 'sedentario',
          diasEntrenamiento: String(perfil.diasEntrenamiento ?? 0) as DatosPerfil['diasEntrenamiento'],
          objetivo: perfil.objetivo ?? 'mantener',
          pesoMeta: num(perfil.pesoMeta),
          velocidad: perfil.velocidad ?? 'recomendada',
          numComidas: String(perfil.numComidas ?? 4) as DatosPerfil['numComidas'],
          colaciones: perfil.colaciones,
        }
      : undefined,
  })

  if (!perfil || pesos === undefined) return <PantallaCargando />
  const objetivo = watch('objetivo')
  const colaciones = watch('colaciones')

  const enviar = handleSubmit(async (d) => {
    const peso = parseDecimal(d.pesoKg)!
    const nuevaFase = d.objetivo !== perfil.objetivo
    const cambianComidas = Number(d.numComidas) !== perfil.numComidas || d.colaciones !== perfil.colaciones
    await guardar('perfiles', {
      ...perfil,
      nombre: d.nombre.trim(),
      sexo: d.sexo,
      fechaNacimiento: d.fechaNacimiento,
      estaturaCm: parseDecimal(d.estaturaCm)!,
      actividad: d.actividad,
      diasEntrenamiento: Number(d.diasEntrenamiento),
      objetivo: d.objetivo,
      velocidad: d.velocidad,
      pesoMeta: d.objetivo === 'mantener' ? peso : parseDecimal(d.pesoMeta)!,
      numComidas: Number(d.numComidas) as 3 | 4,
      colaciones: d.colaciones,
      comidas: cambianComidas ? repartoInicial(Number(d.numComidas) as 3 | 4, d.colaciones) : perfil.comidas,
      ...(nuevaFase ? { faseInicio: hoyISO(), pesoInicial: peso } : {}),
    })
    toast.success(nuevaFase ? 'Nueva fase iniciada. Tu plan se recalculó.' : 'Datos guardados. Tu plan se recalculó.')
    navegar('/mi-plan')
  })

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <header className="flex items-center gap-2">
        <Boton variante="fantasma" tamano="icono" onClick={() => navegar(-1)} aria-label="Volver">
          <ArrowLeft aria-hidden />
        </Boton>
        <h1 className="text-4xl sm:text-5xl">Mi perfil</h1>
      </header>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
        <Tarjeta className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" error={errors.nombre?.message}>
            {(a) => <Entrada autoComplete="given-name" {...a} {...register('nombre')} />}
          </Campo>
          <Campo etiqueta="Sexo" error={errors.sexo?.message}>
            {(a) => (
              <Selector {...a} {...register('sexo')}>
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
              </Selector>
            )}
          </Campo>
          <Campo etiqueta="Fecha de nacimiento" error={errors.fechaNacimiento?.message}>
            {(a) => <Entrada type="date" max={hoyISO()} {...a} {...register('fechaNacimiento')} />}
          </Campo>
          <Campo etiqueta="Estatura (cm)" error={errors.estaturaCm?.message}>
            {(a) => <Entrada inputMode="decimal" {...a} {...register('estaturaCm')} />}
          </Campo>
          <Campo etiqueta="Actividad diaria (sin gym)" error={errors.actividad?.message}>
            {(a) => (
              <Selector {...a} {...register('actividad')}>
                <option value="sedentario">Mayormente sentado</option>
                <option value="ligero">De pie o caminando parte del día</option>
                <option value="activo">Trabajo físico o caminas mucho</option>
              </Selector>
            )}
          </Campo>
          <Campo etiqueta="Días de entrenamiento por semana" error={errors.diasEntrenamiento?.message}>
            {(a) => (
              <Selector {...a} {...register('diasEntrenamiento')}>
                {['0', '1', '2', '3', '4', '5', '6', '7'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Selector>
            )}
          </Campo>
        </Tarjeta>

        <Tarjeta className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Objetivo" error={errors.objetivo?.message} ayuda={objetivo !== perfil.objetivo ? 'Cambiar el objetivo inicia una fase nueva desde hoy.' : undefined}>
            {(a) => (
              <Selector {...a} {...register('objetivo')}>
                <option value="perder">Perder grasa</option>
                <option value="mantener">Mantener</option>
                <option value="ganar">Ganar músculo</option>
              </Selector>
            )}
          </Campo>
          {objetivo !== 'mantener' && (
            <>
              <Campo etiqueta="Peso meta (kg)" error={errors.pesoMeta?.message} ayuda={`Peso de referencia actual: ${formatoNumero(pesoActual ?? 0, 1)} kg`}>
                {(a) => <Entrada inputMode="decimal" {...a} {...register('pesoMeta')} />}
              </Campo>
              <Campo etiqueta="Velocidad" error={errors.velocidad?.message}>
                {(a) => (
                  <Selector {...a} {...register('velocidad')}>
                    <option value="lenta">{objetivo === 'perder' ? 'Lenta · 0,25 kg/semana' : 'Lenta · 0,1 kg/semana'}</option>
                    <option value="recomendada">{objetivo === 'perder' ? 'Recomendada · 0,5 kg/semana' : 'Recomendada · 0,2 kg/semana'}</option>
                    <option value="rapida">{objetivo === 'perder' ? 'Rápida · 0,75 kg/semana' : 'Rápida · 0,3 kg/semana'}</option>
                  </Selector>
                )}
              </Campo>
            </>
          )}
        </Tarjeta>

        <Tarjeta className="flex flex-col gap-4">
          <Campo etiqueta="Comidas al día" error={errors.numComidas?.message} ayuda="Si cambias esto, el reparto vuelve al sugerido.">
            {(a) => (
              <Selector {...a} {...register('numComidas')}>
                <option value="3">3: desayuno, almuerzo y cena</option>
                <option value="4">4: desayuno, almuerzo, once y cena</option>
              </Selector>
            )}
          </Campo>
          <div className="flex items-start gap-3">
            <Casilla id="perfil-colaciones" checked={colaciones} onCheckedChange={(v) => setValue('colaciones', v === true, { shouldDirty: true })} className="mt-0.5" />
            <label htmlFor="perfil-colaciones" className="text-sm">
              <span className="font-semibold">Colaciones</span>
              <span className="block text-texto-secundario">Snacks entre comidas.</span>
            </label>
          </div>
        </Tarjeta>
        <Boton type="submit" ancho="completo" disabled={isSubmitting}>
          Guardar y recalcular
        </Boton>
      </form>
    </div>
  )
}
