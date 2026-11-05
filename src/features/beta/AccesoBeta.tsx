import { LockKeyhole } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useSesion } from '@/app/useSesion'
import { Boton } from '@/components/ui/button'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { accesoBeta } from '@/domain/beta/codigo'
import { INVITACION_DISCORD } from '@/features/comunidad/discord'
import { PantallaCuenta } from '@/features/cuenta/PantallaCuenta'
import { FormularioCodigo } from './FormularioCodigo'
import { borrarCodigoPendiente, canjearCodigo, leerCodigoPendiente, tieneAcceso, useBetaCerrada } from './estadoBeta'

const clave = (userId: string) => `kaibu:beta-ok:${userId}`

function accesoGuardado(userId: string): boolean {
  try {
    return localStorage.getItem(clave(userId)) === '1'
  } catch {
    return false
  }
}

/**
 * Con la beta cerrada, una cuenta sin acceso ve esta pantalla en vez de la app.
 * Si trae un código validado en /beta, se canjea solo. Las cuentas que ya existían tienen acceso.
 */
export function AccesoBeta({ children }: { children: ReactNode }) {
  const { userId, modoLocal, enLinea, cerrarSesion } = useSesion()
  const cerrada = useBetaCerrada()
  const [conAcceso, setConAcceso] = useState<boolean | null>(() => (modoLocal || (userId && accesoGuardado(userId)) ? true : null))

  const revisar = useCallback(async () => {
    if (!userId || modoLocal) return
    try {
      const pendiente = leerCodigoPendiente()
      if (pendiente) {
        await canjearCodigo(pendiente).catch(() => false)
        borrarCodigoPendiente()
      }
      const ok = await tieneAcceso()
      if (ok) localStorage.setItem(clave(userId), '1')
      setConAcceso(ok)
    } catch {
      // Sin conexión: no se bloquea a nadie (la base de datos igual protege lo que se guarda).
      setConAcceso(true)
    }
  }, [userId, modoLocal])

  useEffect(() => {
    if (conAcceso !== true) void revisar()
  }, [conAcceso, revisar])

  const estado = accesoBeta({ cerrada: enLinea ? cerrada : false, tieneAcceso: conAcceso })
  if (estado === 'si') return <>{children}</>
  if (estado === 'cargando') return <PantallaCargando texto="Revisando tu acceso…" />

  const canjear = async (codigo: string) => {
    const ok = await canjearCodigo(codigo)
    if (ok && userId) localStorage.setItem(clave(userId), '1')
    return ok
  }

  return (
    <PantallaCuenta titulo="Beta privada" subtitulo="Tu cuenta está creada, pero Kaibu todavía está en beta: para entrar necesitas tu código personal.">
      <LockKeyhole className="size-8 text-texto-marca" aria-hidden />
      <FormularioCodigo revisar={canjear} alAceptar={() => setConAcceso(true)} textoBoton="Activar mi acceso" />
      <p className="text-sm text-texto-secundario">
        ¿No tienes código?{' '}
        {INVITACION_DISCORD ? (
          <a href={INVITACION_DISCORD} target="_blank" rel="noreferrer" className="font-medium text-texto-marca underline underline-offset-2">
            Postula a la beta en el Discord de Kaibu
          </a>
        ) : (
          'Pídeselo al equipo de Kaibu'
        )}
        . Te avisaremos cuando Kaibu se abra para todos.
      </p>
      <Boton variante="contorno" ancho="completo" onClick={() => void cerrarSesion()}>
        Cerrar sesión
      </Boton>
    </PantallaCuenta>
  )
}
