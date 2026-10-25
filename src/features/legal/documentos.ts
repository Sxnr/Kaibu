// Borradores de documentos legales (deben ser revisados por un abogado antes del lanzamiento).
// Los textos entre [corchetes] deben completarse.
import { VERSION_PRIVACIDAD, VERSION_SALUD, VERSION_TERMINOS } from '@/domain/legal'

export interface Documento {
  titulo: string
  version: string
  secciones: { titulo: string; parrafos: string[] }[]
}

export const DOCUMENTOS: Record<string, Documento> = {
  terminos: {
    titulo: 'Términos y Condiciones',
    version: VERSION_TERMINOS,
    secciones: [
      {
        titulo: '1. Qué es Kaibu',
        parrafos: [
          'Kaibu es una aplicación para registrar alimentación, peso y progreso físico, y para estimar un plan de calorías y macronutrientes. Las cifras son estimaciones y no reemplazan la atención de un profesional de la salud (ver Aviso de salud).',
        ],
      },
      {
        titulo: '2. Cuenta y edad mínima',
        parrafos: [
          'Para usar Kaibu debes tener 18 años o más. [Definir con asesoría legal si se permitirá el uso entre 14 y 17 años con autorización de un adulto responsable.]',
          'Eres responsable de mantener la confidencialidad de tu contraseña y de la actividad de tu cuenta.',
        ],
      },
      {
        titulo: '3. Uso permitido',
        parrafos: [
          'No debes usar Kaibu para fines ilícitos, intentar acceder a datos de otras personas ni afectar el funcionamiento del servicio.',
        ],
      },
      {
        titulo: '4. Base comunitaria de productos',
        parrafos: [
          'Cuando esté disponible, podrás aportar productos a una base compartida. No se permiten datos falsos, spam ni contenido ajeno al producto. Kaibu puede corregir o eliminar aportes.',
          'Al aportar un producto, otorgas a Kaibu una licencia gratuita, mundial y no exclusiva para usar, mostrar y compartir esos datos, incluida su publicación bajo licencia abierta (ODbL) en Open Food Facts.',
        ],
      },
      {
        titulo: '5. Limitación de responsabilidad',
        parrafos: [
          'Kaibu se entrega "tal como está". Hacemos lo posible por que los cálculos y datos sean correctos, pero pueden contener errores. Kaibu no responde por decisiones de salud tomadas solo en base a la app.',
        ],
      },
      {
        titulo: '6. Cambios a estos términos',
        parrafos: ['Si cambian estos términos, te avisaremos en la app y te pediremos aceptarlos nuevamente antes de seguir usándola.'],
      },
      { titulo: '7. Contacto', parrafos: ['[Nombre o razón social del responsable] · [correo de contacto] · [domicilio en Chile]'] },
    ],
  },
  privacidad: {
    titulo: 'Política de Privacidad',
    version: VERSION_PRIVACIDAD,
    secciones: [
      {
        titulo: '1. Qué datos recogemos',
        parrafos: [
          'Datos de cuenta: correo electrónico (y nombre si usas Google).',
          'Datos de perfil: nombre, sexo, fecha de nacimiento, estatura, nivel de actividad y objetivo.',
          'Datos de salud (datos sensibles): peso, alimentación registrada y, cuando esté disponible, fotos de progreso y medidas corporales.',
        ],
      },
      {
        titulo: '2. Para qué los usamos',
        parrafos: [
          'Solo para calcular tu plan, mostrar tu progreso y sincronizar tus datos entre tus dispositivos. No vendemos tus datos ni los usamos para publicidad.',
        ],
      },
      {
        titulo: '3. Consentimiento para datos de salud',
        parrafos: [
          'Tratamos tus datos de salud solo con tu consentimiento explícito, que das al crear tu cuenta en una casilla separada. Puedes retirarlo en cualquier momento borrando tu cuenta.',
        ],
      },
      {
        titulo: '4. Dónde se guardan',
        parrafos: [
          'En Supabase (base de datos Postgres) con reglas de seguridad que impiden que otras personas accedan a tus datos, y en tu propio dispositivo para que la app funcione sin conexión. Al cerrar sesión, los datos se borran del dispositivo.',
        ],
      },
      {
        titulo: '5. Con quién se comparten',
        parrafos: [
          'Proveedores que nos ayudan a operar: Supabase (almacenamiento y cuentas), Google (inicio de sesión con Google; en el futuro, ML Kit para escanear códigos), el proveedor de inteligencia artificial (cuando exista esa función, solo con los datos mínimos) y Sentry (registro de errores, sin datos personales ni de salud).',
        ],
      },
      { titulo: '6. Cuánto tiempo', parrafos: ['Mientras tengas tu cuenta. Si la borras, eliminamos tus datos [en un plazo máximo de 30 días, incluidas las copias de seguridad].'] },
      {
        titulo: '7. Tus derechos',
        parrafos: [
          'Puedes ver, corregir, descargar (portabilidad) y borrar todos tus datos y tu cuenta, de acuerdo con la Ley 19.628 y la Ley 21.719 (vigente desde el 1 de diciembre de 2026). Para ejercerlos usa Ajustes o escríbenos a [correo de contacto].',
        ],
      },
      { titulo: '8. Contacto', parrafos: ['[Nombre o razón social del responsable] · [correo de contacto]'] },
    ],
  },
  salud: {
    titulo: 'Aviso de salud',
    version: VERSION_SALUD,
    secciones: [
      {
        titulo: 'Kaibu entrega estimaciones',
        parrafos: [
          'Las calorías, macronutrientes, proyecciones y sugerencias de Kaibu son estimaciones basadas en fórmulas generales (como Mifflin-St Jeor) y en tablas de alimentos. Cada cuerpo es distinto.',
          'Kaibu no reemplaza a un nutricionista ni a un médico. Si tienes una condición de salud, estás embarazada o en lactancia, tienes o tuviste un trastorno de la conducta alimentaria, o tomas medicamentos, consulta a un profesional antes de cambiar tu alimentación.',
          'Si sientes mareos, cansancio extremo u otro malestar, detente y busca atención médica.',
        ],
      },
    ],
  },
}
