// Sesión del usuario: Supabase Auth (o modo local) + sincronización automática.
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { db } from '@/data/db'
import { alCambiarDatos, guardar } from '@/data/escritura'
import { CLAVE_CONSENTIMIENTO, perfilVacio, registrarConsentimientos, type ConsentimientoPendiente } from './consentimiento'
import { ContextoSesion, type EstadoSesion, type ValorSesion } from './useSesion'
import { modoLocal, obtenerSupabase, USUARIO_LOCAL } from '@/data/supabase'
import { huboSyncInicial, remotoSupabase, sincronizar, type Remoto } from '@/data/sync'
import { usePerfil } from '@/data/consultas'
import { aplicarTema } from './tema'

const CLAVE_LOCAL = 'kaibu:sesion-local'
function useEnLinea(): boolean {
  const [enLinea, setEnLinea] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setEnLinea(true)
    const off = () => setEnLinea(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return enLinea
}

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const enLinea = useEnLinea()
  const [estado, setEstado] = useState<EstadoSesion>('cargando')
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [syncInicial, setSyncInicial] = useState<boolean | null>(null)

  // 1) Obtener la sesión
  const [remoto, setRemoto] = useState<Remoto | null>(null)
  useEffect(() => {
    if (modoLocal) {
      const activa = localStorage.getItem(CLAVE_LOCAL) === '1'
      setUserId(activa ? USUARIO_LOCAL : null)
      setEstado(activa ? 'activa' : 'anonimo')
      return
    }
    let vivo = true
    let quitar = () => {}
    void obtenerSupabase().then(async (supabase) => {
      if (!vivo || !supabase) return
      setRemoto(remotoSupabase(supabase))
      const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
        setUserId(sesion?.user.id ?? null)
        setEmail(sesion?.user.email ?? null)
        setEstado(sesion ? 'activa' : 'anonimo')
      })
      quitar = () => data.subscription.unsubscribe()
      const { data: actual } = await supabase.auth.getSession()
      if (!vivo) return
      setUserId(actual.session?.user.id ?? null)
      setEmail(actual.session?.user.email ?? null)
      setEstado(actual.session ? 'activa' : 'anonimo')
    })
    return () => {
      vivo = false
      quitar()
    }
  }, [])

  // 2) ¿Este dispositivo ya bajó los datos alguna vez?
  useEffect(() => {
    if (!userId) {
      setSyncInicial(null)
      return
    }
    if (userId === USUARIO_LOCAL) {
      setSyncInicial(true)
      return
    }
    void huboSyncInicial(userId).then(setSyncInicial)
  }, [userId])

  // 3) Sincronización periódica (TanStack Query maneja reintentos y reconexión)
  const puedeSincronizar = !!remoto && !!userId && userId !== USUARIO_LOCAL && estado === 'activa'
  const sync = useQuery({
    queryKey: ['sync', userId],
    queryFn: async () => {
      const r = await sincronizar(remoto!, userId!)
      setSyncInicial(true)
      return r
    },
    enabled: puedeSincronizar,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
    networkMode: 'online',
  })

  // Al guardar algo, sube los cambios pronto (agrupando escrituras seguidas)
  useEffect(() => {
    if (!puedeSincronizar) return
    let t: number | undefined
    const quitar = alCambiarDatos(() => {
      window.clearTimeout(t)
      t = window.setTimeout(() => void queryClient.invalidateQueries({ queryKey: ['sync', userId] }), 800)
    })
    return () => {
      quitar()
      window.clearTimeout(t)
    }
  }, [puedeSincronizar, queryClient, userId])

  const datosListos = !!userId && syncInicial === true
  const perfil = usePerfil(datosListos ? userId : null)

  // 4) Al tener sesión: registrar consentimientos pendientes y asegurar un perfil
  const procesando = useRef(false)
  useEffect(() => {
    if (!userId || !datosListos || perfil === undefined || procesando.current) return
    procesando.current = true
    void (async () => {
      try {
        const pendiente = localStorage.getItem(CLAVE_CONSENTIMIENTO)
        if (pendiente) {
          await registrarConsentimientos(userId, JSON.parse(pendiente) as ConsentimientoPendiente)
          // Se borra después de guardar: así la guardia espera en vez de pedirlos de nuevo.
          localStorage.removeItem(CLAVE_CONSENTIMIENTO)
        }
        // Se vuelve a confirmar en la base: nunca se pisa un perfil que ya existe.
        if (perfil === null && !(await db.perfiles.get(userId))) await guardar('perfiles', perfilVacio(userId))
      } finally {
        procesando.current = false
      }
    })()
  }, [userId, datosListos, perfil])

  // 5) El tema elegido se recuerda por usuario
  useEffect(() => {
    if (perfil?.tema) aplicarTema(perfil.tema)
  }, [perfil?.tema])

  const pendientes = useLiveQuery(() => db.pendientes.count(), []) ?? 0

  const entrarLocal = useCallback(() => {
    localStorage.setItem(CLAVE_LOCAL, '1')
    setUserId(USUARIO_LOCAL)
    setEstado('activa')
  }, [])

  const cerrarSesion = useCallback(async () => {
    if (puedeSincronizar && navigator.onLine) {
      try {
        await sincronizar(remoto!, userId!)
      } catch {
        // Si falla, igual cerramos sesión; la pantalla de Ajustes avisa antes si hay pendientes.
      }
    }
    // Los datos de salud no quedan guardados en el dispositivo al cerrar sesión.
    await Promise.all(db.tables.map((t) => t.clear()))
    localStorage.removeItem(CLAVE_LOCAL)
    queryClient.clear()
    const supabase = await obtenerSupabase()
    if (supabase) await supabase.auth.signOut()
    setUserId(null)
    setEmail(null)
    setEstado('anonimo')
  }, [puedeSincronizar, queryClient, remoto, userId])

  const valor: ValorSesion = {
    estado,
    userId,
    email,
    modoLocal,
    datosListos,
    necesitaConexion: !!userId && syncInicial === false && (!enLinea || sync.isError),
    perfil: datosListos ? perfil : undefined,
    sincronizando: sync.isFetching,
    errorSync: sync.error ? 'No pudimos sincronizar. Lo intentaremos de nuevo.' : null,
    ultimaSync: sync.dataUpdatedAt,
    pendientes,
    enLinea,
    sincronizarAhora: () => void queryClient.invalidateQueries({ queryKey: ['sync', userId] }),
    entrarLocal,
    cerrarSesion,
  }

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>
}
