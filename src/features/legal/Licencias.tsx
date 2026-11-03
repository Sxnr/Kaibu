import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Boton } from '@/components/ui/button'
import licencias from './licencias.json'

/** RF-48 · Licencias de terceros: se genera al compilar desde las dependencias de producción. */
export default function Licencias() {
  const navegar = useNavigate()
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-5 px-5 py-8">
      <Boton variante="fantasma" tamano="sm" className="self-start" onClick={() => (window.history.length > 1 ? navegar(-1) : navegar('/'))}>
        <ArrowLeft aria-hidden /> Volver
      </Boton>
      <header>
        <h1 className="text-4xl sm:text-5xl">Licencias de terceros</h1>
        <p className="mt-2 text-texto-secundario">
          Kaibu se construye con {licencias.length} paquetes de software libre. Gracias a quienes los mantienen. Esta lista se genera sola al publicar
          cada versión.
        </p>
      </header>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Recursos</h2>
        <p className="leading-relaxed text-texto-secundario">
          Modelo 3D de la landing: "X Bot" de Mixamo (Adobe), de uso libre en proyectos. Fuentes Inter, Barlow Condensed y Playfair Display bajo SIL
          Open Font License 1.1. Tabla de alimentos chilena: Universidad de Chile, INTA y MINSAL. Alimentos genéricos: USDA FoodData Central (dominio público). Productos con marca: datos de Open Food Facts (openfoodfacts.org), disponibles bajo la Open Database License (ODbL); la lista de productos de Kaibu derivada de ellos se comparte bajo la misma licencia.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Paquetes</h2>
        <ul className="divide-y divide-borde rounded-tarjeta border border-borde bg-superficie">
          {licencias.map((l) => (
            <li key={`${l.nombre}@${l.version}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-2.5 text-sm">
              {l.pagina ? (
                <a href={l.pagina} target="_blank" rel="noreferrer" className="font-medium break-all underline-offset-2 hover:underline">
                  {l.nombre}
                </a>
              ) : (
                <span className="font-medium break-all">{l.nombre}</span>
              )}
              <span className="text-texto-secundario">
                {l.version} · {l.licencia}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
