// Medidas y fotos de progreso: lo que la balanza no muestra.
import { useUsuario } from '@/app/useSesion'
import { Encabezado } from '@/components/Encabezado'
import { PantallaCargando } from '@/components/ui/esqueleto'
import { useFotos, useMedidas, usePesos } from '@/data/consultas'
import { SeccionFotos } from './Fotos'
import { SeccionMedidas } from './Medidas'

export default function Cuerpo() {
  const userId = useUsuario()
  const medidas = useMedidas(userId)
  const fotos = useFotos(userId)
  const pesos = usePesos(userId)
  if (!medidas || !fotos || !pesos) return <PantallaCargando />
  return (
    <div className="flex flex-col gap-5">
      <Encabezado titulo="Medidas y fotos" antetitulo="Lo que la balanza no muestra" ayuda="cuerpo" />
      <SeccionMedidas userId={userId} medidas={medidas} />
      <SeccionFotos userId={userId} fotos={fotos} pesos={pesos} />
    </div>
  )
}
