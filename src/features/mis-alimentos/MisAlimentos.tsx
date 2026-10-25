import { BookPlus, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useUsuario } from '@/app/useSesion'
import { Encabezado } from '@/components/Encabezado'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Boton } from '@/components/ui/button'
import { Entrada } from '@/components/ui/campo'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { Tarjeta } from '@/components/ui/tarjeta'
import { useMisAlimentos } from '@/data/consultas'
import { buscarAlimentos } from '@/domain/alimentos/busqueda'
import { formatoNumero } from '@/domain/format/formato'

export default function MisAlimentos() {
  const userId = useUsuario()
  const lista = useMisAlimentos(userId)
  const [consulta, setConsulta] = useState('')
  if (!lista) return <PantallaCargando />
  const visibles = consulta.trim() ? buscarAlimentos(lista, consulta, 200) : lista

  return (
    <div className="flex flex-col gap-5">
      <Encabezado
        titulo="Mis alimentos"
        antetitulo="Privados: solo tú los ves"
        acciones={
          <Boton asChild tamano="sm">
            <Link to="/mis-alimentos/nuevo">
              <Plus aria-hidden /> Nuevo
            </Link>
          </Boton>
        }
      />
      {lista.length === 0 ? (
        <EstadoVacio
          icono={BookPlus}
          titulo="Crea tu primer alimento"
          texto="Agrega los productos o preparaciones que comes seguido, con sus valores por 100 g (están en la etiqueta nutricional)."
          accion={
            <Boton asChild>
              <Link to="/mis-alimentos/nuevo">Crear alimento</Link>
            </Boton>
          }
        />
      ) : (
        <>
          <div role="search" className="relative">
            <label htmlFor="buscar-mis" className="sr-only">
              Buscar en mis alimentos
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-texto-secundario" aria-hidden />
            <Entrada id="buscar-mis" type="search" value={consulta} onChange={(e) => setConsulta(e.target.value)} placeholder="Buscar…" className="pl-12" />
          </div>
          <Tarjeta className="p-2">
            <ul className="divide-y divide-borde">
              {visibles.map((a) => (
                <li key={a.id}>
                  <Link to={`/mis-alimentos/${a.id}`} className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 hover:bg-superficie-elevada">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{a.nombre}</span>
                      <span className="block truncate text-sm text-texto-secundario">
                        {a.marca ? `${a.marca} · ` : ''}
                        {formatoNumero(a.kcal)} kcal / 100 g · P {formatoNumero(a.proteina, 1)} · C {formatoNumero(a.carbos, 1)} · G {formatoNumero(a.grasas, 1)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {visibles.length === 0 && <p className="p-4 text-sm text-texto-secundario">Sin coincidencias para "{consulta}".</p>}
          </Tarjeta>
        </>
      )}
    </div>
  )
}
