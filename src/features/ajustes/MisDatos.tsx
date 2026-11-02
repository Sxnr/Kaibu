import { Download, FileSpreadsheet, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { useSesion } from '@/app/useSesion'
import { Boton } from '@/components/ui/button'
import { Entrada } from '@/components/ui/campo'
import { Tarjeta } from '@/components/ui/tarjeta'
import { descargarJson, descargarZip } from './descargas'

const PALABRA = 'BORRAR'

/** RF-45 y RF-46 · Descargar todos mis datos y borrar mi cuenta (escribiendo BORRAR, sin ventanas emergentes). */
export function MisDatos({ userId }: { userId: string }) {
  const { modoLocal, enLinea, borrarCuenta } = useSesion()
  const id = useId()
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState('')
  const sinInternet = !modoLocal && !enLinea

  const descargar = async (tipo: 'json' | 'zip') => {
    try {
      await (tipo === 'json' ? descargarJson(userId) : descargarZip(userId))
      toast('Descarga lista')
    } catch {
      toast('No pudimos preparar la descarga. Inténtalo de nuevo.')
    }
  }

  const borrar = async () => {
    setBorrando(true)
    setError('')
    try {
      await borrarCuenta()
    } catch {
      setError('No pudimos borrar tu cuenta. Revisa tu conexión e inténtalo de nuevo. No se borró nada.')
      setBorrando(false)
    }
  }

  return (
    <Tarjeta id="mis-datos" className="scroll-mt-20">
      <h2 className="font-semibold">Mis datos</h2>
      <p className="mb-3 text-sm text-texto-secundario">
        Descarga una copia de todo lo que guardaste: perfil, comidas, pesos, agua, notas y consentimientos.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Boton variante="secundario" tamano="sm" onClick={() => void descargar('json')}>
          <Download aria-hidden /> Descargar (JSON)
        </Boton>
        <Boton variante="secundario" tamano="sm" onClick={() => void descargar('zip')}>
          <FileSpreadsheet aria-hidden /> Descargar para Excel (.zip)
        </Boton>
      </div>

      <div className="mt-5 border-t border-borde pt-4">
        {!abierto ? (
          <Boton variante="peligro" tamano="sm" aria-expanded={false} aria-controls={`${id}-panel`} onClick={() => setAbierto(true)}>
            <Trash2 aria-hidden /> {modoLocal ? 'Borrar mis datos de este dispositivo…' : 'Borrar mi cuenta…'}
          </Boton>
        ) : (
          <div id={`${id}-panel`} className="flex flex-col gap-3 rounded-xl border border-borde-control p-4">
            <h3 className="font-semibold">{modoLocal ? 'Borrar mis datos de este dispositivo' : 'Borrar mi cuenta'}</h3>
            <p className="text-sm">
              {modoLocal
                ? 'Se borrarán para siempre tu perfil, comidas, pesos, agua y notas guardados en este dispositivo.'
                : 'Se borrarán para siempre tu cuenta y todos tus datos: perfil, comidas, pesos, agua, notas y consentimientos, en la nube y en este dispositivo.'}{' '}
              <strong>No se puede deshacer.</strong> Si quieres guardar una copia, descárgala antes.
            </p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-confirmar`} className="text-sm font-semibold">
                Escribe {PALABRA} para confirmar
              </label>
              <Entrada
                id={`${id}-confirmar`}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="max-w-60"
              />
            </div>
            {sinInternet && (
              <p className="text-sm text-texto-secundario" role="status">
                Necesitas internet para borrar tu cuenta.
              </p>
            )}
            {error && (
              <p className="text-sm font-medium text-texto-marca" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Boton tamano="sm" disabled={texto.trim() !== PALABRA || borrando || sinInternet} onClick={() => void borrar()}>
                <Trash2 aria-hidden /> {borrando ? 'Borrando…' : 'Borrar todo para siempre'}
              </Boton>
              <Boton
                variante="fantasma"
                tamano="sm"
                onClick={() => {
                  setAbierto(false)
                  setTexto('')
                  setError('')
                }}
              >
                Cancelar
              </Boton>
            </div>
          </div>
        )}
      </div>
    </Tarjeta>
  )
}
