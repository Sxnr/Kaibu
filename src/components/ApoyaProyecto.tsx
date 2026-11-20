// "Apoya el proyecto" (RF-65): enlace a Ko-fi. Donar es voluntario y no desbloquea funciones.
import { ExternalLink, Heart } from 'lucide-react'
import { URL_DONACION } from '@/app/plataforma'
import { Boton } from '@/components/ui/button'
import { Tarjeta } from '@/components/ui/tarjeta'

export function ApoyaProyecto() {
  return (
    <Tarjeta className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Heart className="size-6 shrink-0 text-texto-marca" aria-hidden />
      <div className="flex-1">
        <h2 className="font-semibold">Apoya el proyecto</h2>
        <p className="mt-0.5 text-sm text-texto-secundario">Kaibu es gratis y lo hace una sola persona en Chile. Si te sirve, puedes apoyarlo con lo que quieras. Donar no desbloquea funciones: todo sigue gratis para todos.</p>
      </div>
      <Boton asChild variante="contorno" tamano="sm">
        <a href={URL_DONACION} target="_blank" rel="noopener noreferrer">
          Apoyar en Ko-fi <ExternalLink aria-hidden />
          <span className="sr-only">(se abre en otra pestaña)</span>
        </a>
      </Boton>
    </Tarjeta>
  )
}
