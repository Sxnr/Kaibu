import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion, MotionConfig } from 'motion/react'
import { lazy, useEffect } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router'
import { Toaster } from 'sonner'
import { Guardia, SoloAnonimo } from './app/guardias'
import { LayoutApp, LayoutSimple } from './app/LayoutApp'
import { ProveedorSesion } from './app/sesion'
import { escucharSistema } from './app/tema'
import { AvisoActualizacion } from './app/AvisoActualizacion'
import { bienvenidaVista } from './app/bienvenida'
// La bienvenida va en el paquete principal (es la primera pantalla de quien llega).
import Bienvenida from './features/bienvenida/Bienvenida'
// La landing también va en el paquete principal: es lo primero que ve quien llega por la web.
import Landing from './features/landing/Landing'
import { esApp } from './app/plataforma'
import { useSesion } from './app/useSesion'

// Quien vuelve a la app casi siempre abre "Hoy": se descarga en paralelo desde el inicio.
const importarHoy = () => import('./features/hoy/Hoy')
if (bienvenidaVista()) void importarHoy()
const Hoy = lazy(importarHoy)

const cargarAnimaciones = () => import('./lib/animaciones').then((r) => r.default)

// Pantallas cargadas a pedido (la app abre más rápido)
const Entrar = lazy(() => import('./features/cuenta/Entrar'))
const Registro = lazy(() => import('./features/cuenta/Registro'))
const Recuperar = lazy(() => import('./features/cuenta/Recuperar'))
const Restablecer = lazy(() => import('./features/cuenta/Restablecer'))
const Consentimiento = lazy(() => import('./features/cuenta/Consentimiento'))
const Configuracion = lazy(() => import('./features/configuracion/Configuracion'))
const TuPlan = lazy(() => import('./features/plan/TuPlan'))
const Agregar = lazy(() => import('./features/agregar/Agregar'))
const Progreso = lazy(() => import('./features/progreso/Progreso'))
const MiPlan = lazy(() => import('./features/plan/MiPlan'))
const MisAlimentos = lazy(() => import('./features/mis-alimentos/MisAlimentos'))
const EditarAlimento = lazy(() => import('./features/mis-alimentos/EditarAlimento'))
const Ajustes = lazy(() => import('./features/ajustes/Ajustes'))
const EditarPerfil = lazy(() => import('./features/ajustes/EditarPerfil'))
const Mas = lazy(() => import('./features/ajustes/Mas'))
const Legal = lazy(() => import('./features/legal/Legal'))
const BajaListaEspera = lazy(() => import('./features/landing/BajaListaEspera'))

/** "/" muestra la landing en la web a quien no tiene sesión; si no, la app (con sus guardias). */
function RaizApp() {
  const { estado } = useSesion()
  const { pathname } = useLocation()
  if (estado === 'anonimo' && pathname === '/' && !esApp()) return <Landing />
  return (
    <Guardia hasta="perfil">
      <LayoutApp />
    </Guardia>
  )
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
})

const router = createBrowserRouter([
  {
    element: <LayoutSimple />,
    children: [
      { path: '/bienvenida', element: <Bienvenida /> },
      {
        path: '/entrar',
        element: (
          <SoloAnonimo>
            <Entrar />
          </SoloAnonimo>
        ),
      },
      {
        path: '/registro',
        element: (
          <SoloAnonimo>
            <Registro />
          </SoloAnonimo>
        ),
      },
      {
        path: '/recuperar',
        element: (
          <SoloAnonimo>
            <Recuperar />
          </SoloAnonimo>
        ),
      },
      { path: '/restablecer', element: <Restablecer /> },
      { path: '/legal/:documento', element: <Legal /> },
      { path: '/baja', element: <BajaListaEspera /> },
      {
        path: '/consentimiento',
        element: (
          <Guardia hasta="consentimiento">
            <Consentimiento />
          </Guardia>
        ),
      },
      {
        path: '/configuracion',
        element: (
          <Guardia hasta="consentimiento">
            <Configuracion />
          </Guardia>
        ),
      },
      {
        path: '/tu-plan',
        element: (
          <Guardia hasta="perfil">
            <TuPlan />
          </Guardia>
        ),
      },
    ],
  },
  {
    element: <RaizApp />,
    children: [
      { index: true, path: '/', element: <Hoy /> },
      { path: '/agregar', element: <Agregar /> },
      { path: '/progreso', element: <Progreso /> },
      { path: '/mi-plan', element: <MiPlan /> },
      { path: '/mis-alimentos', element: <MisAlimentos /> },
      { path: '/mis-alimentos/nuevo', element: <EditarAlimento /> },
      { path: '/mis-alimentos/:id', element: <EditarAlimento /> },
      { path: '/ajustes', element: <Ajustes /> },
      { path: '/ajustes/perfil', element: <EditarPerfil /> },
      { path: '/mas', element: <Mas /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  useEffect(() => escucharSistema(), [])
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={cargarAnimaciones} strict>
          <ProveedorSesion>
            <RouterProvider router={router} />
            <Toaster
              position="bottom-center"
              offset={96}
              mobileOffset={96}
              toastOptions={{
                classNames: {
                  toast: '!bg-superficie-elevada !text-texto !border-borde !rounded-2xl !font-sans',
                  actionButton: '!bg-marca !text-sobre-marca !min-h-9 !px-3 !rounded-lg !font-semibold',
                  description: '!text-texto-secundario',
                },
              }}
            />
            <AvisoActualizacion />
          </ProveedorSesion>
        </LazyMotion>
      </MotionConfig>
    </QueryClientProvider>
  )
}
