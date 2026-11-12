// Escáner de códigos de barras: usa el lector del navegador (BarcodeDetector) o, si no existe, ZXing.
// La cámara se pide solo al abrir. Siempre se puede escribir el código a mano.
import { Camera, ScanBarcode } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Boton } from '@/components/ui/button'
import { Campo, Entrada } from '@/components/ui/campo'
import { Hoja } from '@/components/ui/hoja'
import { codigoValido, limpiarCodigo } from '@/domain/alimentos/comunidad'

interface Props {
  abierta: boolean
  alCambiar: (v: boolean) => void
  alLeer: (codigo: string) => void
  buscando: boolean
}

interface Detector {
  detect: (fuente: HTMLVideoElement) => Promise<{ rawValue: string }[]>
}
type ConstructorDetector = new (opciones: { formats: string[] }) => Detector

const FORMATOS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']
const CADA_MS = 250

function mensajeCamara(e: unknown): string {
  const nombre = e instanceof DOMException ? e.name : ''
  if (nombre === 'NotAllowedError') return 'Kaibu no tiene permiso para usar la cámara. Actívalo en los ajustes o escribe el código abajo.'
  if (nombre === 'NotFoundError' || nombre === 'OverconstrainedError') return 'No encontramos una cámara. Escribe el código abajo.'
  return 'No pudimos abrir la cámara. Escribe el código abajo.'
}

export function Escaner({ abierta, alCambiar, alLeer, buscando }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const [aviso, setAviso] = useState<string>()
  const [escrito, setEscrito] = useState('')
  const [error, setError] = useState<string>()
  const [camaraLista, setCamaraLista] = useState(false)

  useEffect(() => {
    if (!abierta) return
    let vivo = true
    let flujo: MediaStream | null = null
    let parar = () => {}
    setAviso(undefined)
    setCamaraLista(false)

    const leido = (texto: string) => {
      const codigo = limpiarCodigo(texto)
      if (!vivo || !codigoValido(codigo)) return
      vivo = false
      parar()
      navigator.vibrate?.(40)
      alLeer(codigo)
    }

    const iniciar = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setAviso('Este navegador no permite usar la cámara. Escribe el código abajo.')
        return
      }
      try {
        flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        if (!vivo || !video.current) return flujo.getTracks().forEach((t) => t.stop())
        video.current.srcObject = flujo
        await video.current.play()
        setCamaraLista(true)
        const Nativo = (window as unknown as { BarcodeDetector?: ConstructorDetector }).BarcodeDetector
        if (Nativo) {
          const detector = new Nativo({ formats: FORMATOS })
          const intervalo = window.setInterval(() => {
            if (video.current && video.current.readyState >= 2) {
              void detector
                .detect(video.current)
                .then((r) => r[0] && leido(r[0].rawValue))
                .catch(() => undefined)
            }
          }, CADA_MS)
          parar = () => window.clearInterval(intervalo)
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser')
          if (!vivo || !video.current) return
          const controles = await new BrowserMultiFormatReader().decodeFromVideoElement(video.current, (r) => r && leido(r.getText()))
          parar = () => controles.stop()
        }
      } catch (e) {
        if (vivo) setAviso(mensajeCamara(e))
      }
    }
    void iniciar()
    return () => {
      vivo = false
      parar()
      flujo?.getTracks().forEach((t) => t.stop())
    }
  }, [abierta, alLeer])

  const buscarEscrito = () => {
    const codigo = limpiarCodigo(escrito)
    if (!codigoValido(codigo)) {
      setError('Revisa el código: son los 8 a 13 números bajo las barras.')
      return
    }
    setError(undefined)
    alLeer(codigo)
  }

  return (
    <Hoja abierta={abierta} alCambiar={alCambiar} titulo="Escanear código" descripcion="Apunta la cámara a las barras del envase.">
      <div className="flex flex-col gap-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-superficie-elevada">
          <video ref={video} muted playsInline className="size-full object-cover" aria-label="Vista de la cámara" />
          {!camaraLista && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-texto-secundario">
              <div className="flex flex-col items-center gap-2">
                <Camera className="size-8" aria-hidden />
                {aviso ?? 'Abriendo la cámara…'}
              </div>
            </div>
          )}
          {camaraLista && <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 border-sobre-marca/80" aria-hidden />}
        </div>
        {aviso && camaraLista && <p className="text-sm text-texto-secundario">{aviso}</p>}
        <form
          className="flex items-end gap-2"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            buscarEscrito()
          }}
        >
          <Campo etiqueta="O escribe el código" error={error} className="flex-1">
            {(a) => <Entrada inputMode="numeric" autoComplete="off" value={escrito} onChange={(e) => setEscrito(e.target.value)} placeholder="7802500222189" className="num" {...a} />}
          </Campo>
          <Boton type="submit" disabled={buscando} aria-label="Buscar código">
            <ScanBarcode aria-hidden /> {buscando ? 'Buscando…' : 'Buscar'}
          </Boton>
        </form>
      </div>
    </Hoja>
  )
}
