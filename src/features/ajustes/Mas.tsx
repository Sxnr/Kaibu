import { BookOpen, FileText, GraduationCap, Settings, Sparkles, Target } from 'lucide-react'
import { Encabezado } from '@/components/Encabezado'
import { Tarjeta } from '@/components/ui/tarjeta'
import { versionLegible } from '@/features/novedades/cambios'
import { FilaEnlace } from './Ajustes'

/** Pestaña "Más" en celular. */
export default function Mas() {
  return (
    <div className="flex flex-col gap-5">
      <Encabezado titulo="Más" />
      <Tarjeta className="p-2">
        <ul>
          <FilaEnlace a="/mi-plan" icono={Target} texto="Mi plan" detalle="Kcal, macros, reparto y fase" />
          <FilaEnlace a="/mis-alimentos" icono={BookOpen} texto="Mis alimentos" detalle="Tus alimentos privados" />
          <FilaEnlace a="/ajustes" icono={Settings} texto="Ajustes" detalle="Tema, perfil, sincronización" />
          <FilaEnlace a="/?tutorial=1" icono={GraduationCap} texto="Ver tutorial" detalle="Los 4 pasos para usar Kaibu" />
          <FilaEnlace a="/novedades" icono={Sparkles} texto="Novedades" detalle={`Versión ${versionLegible(__VERSION__)}`} />
        </ul>
      </Tarjeta>
      <Tarjeta className="p-2">
        <ul>
          <FilaEnlace a="/legal/salud" icono={FileText} texto="Aviso de salud" />
          <FilaEnlace a="/legal/licencias" icono={FileText} texto="Licencias de terceros" />
        </ul>
      </Tarjeta>
    </div>
  )
}
