import { Bell, BookOpen, CalendarRange, FileText, Pill, Ruler, GraduationCap, MessagesSquare, Settings, Sparkles, Target } from 'lucide-react'
import { ApoyaProyecto } from '@/components/ApoyaProyecto'
import { Encabezado } from '@/components/Encabezado'
import { Tarjeta } from '@/components/ui/tarjeta'
import { versionLegible } from '@/features/novedades/cambios'
import { mostrarNuevo } from '@/domain/comunidad/descubrir'
import { useDescubrirComunidad } from '@/features/comunidad/descubrirEstado'
import { FilaEnlace } from './Ajustes'

/** Pestaña "Más" en celular. */
export default function Mas() {
  const comunidadNueva = mostrarNuevo(useDescubrirComunidad())
  return (
    <div className="flex flex-col gap-5">
      <Encabezado titulo="Más" />
      <Tarjeta className="p-2">
        <ul>
          <FilaEnlace a="/planificar" icono={CalendarRange} texto="Planificar" detalle="Meal prep, semanas y lista de compras" />
          <FilaEnlace a="/suplementos" icono={Pill} texto="Suplementos" detalle="Dosis, horario y lo que tomaste hoy" />
          <FilaEnlace a="/cuerpo" icono={Ruler} texto="Medidas y fotos" detalle="Cintura, pecho, brazo, muslo y fotos privadas" />
          <FilaEnlace a="/recordatorios" icono={Bell} texto="Recordatorios" detalle="Avisos para anotar, agua y suplementos" />
          <FilaEnlace a="/mi-plan" icono={Target} texto="Mi plan" detalle="Kcal, macros, reparto y fase" />
          <FilaEnlace a="/mis-alimentos" icono={BookOpen} texto="Mis alimentos" detalle="Tus alimentos privados" />
          <FilaEnlace a="/ajustes" icono={Settings} texto="Ajustes" detalle="Tema, perfil, sincronización" />
          <FilaEnlace a="/?tutorial=1" icono={GraduationCap} texto="Ver tutorial" detalle="Los 4 pasos para usar Kaibu" />
          <FilaEnlace a="/comunidad" icono={MessagesSquare} texto="Comunidad" detalle="Discord, reportes y sugerencias" nuevo={comunidadNueva} />
          <FilaEnlace a="/novedades" icono={Sparkles} texto="Novedades" detalle={`Versión ${versionLegible(__VERSION__)}`} />
        </ul>
      </Tarjeta>
      <ApoyaProyecto />
      <Tarjeta className="p-2">
        <ul>
          <FilaEnlace a="/legal/salud" icono={FileText} texto="Aviso de salud" />
          <FilaEnlace a="/legal/licencias" icono={FileText} texto="Licencias de terceros" />
        </ul>
      </Tarjeta>
    </div>
  )
}
