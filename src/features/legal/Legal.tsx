import { ArrowLeft } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Boton } from '@/components/ui/button'
import { fechaCompleta } from '@/domain/format/formato'
import { DOCUMENTOS } from './documentos'

export default function Legal() {
  const { documento = '' } = useParams()
  const navegar = useNavigate()
  const doc = DOCUMENTOS[documento]
  if (!doc) return <Navigate to="/" replace />
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-5 px-5 py-8">
      <Boton variante="fantasma" tamano="sm" className="self-start" onClick={() => (window.history.length > 1 ? navegar(-1) : navegar('/'))}>
        <ArrowLeft aria-hidden /> Volver
      </Boton>
      <header>
        <h1 className="text-4xl sm:text-5xl">{doc.titulo}</h1>
        <p className="mt-2 text-sm text-texto-secundario">Versión del {fechaCompleta(doc.version)} · Borrador sujeto a revisión legal</p>
      </header>
      {doc.secciones.map((s) => (
        <section key={s.titulo} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{s.titulo}</h2>
          {s.parrafos.map((p) => (
            <p key={p} className="leading-relaxed text-texto-secundario">
              {p}
            </p>
          ))}
        </section>
      ))}
    </article>
  )
}
