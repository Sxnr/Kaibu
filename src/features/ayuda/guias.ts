// Textos de "¿Cómo se usa?": una guía corta por sección, en palabras simples.

export interface Guia {
  titulo: string
  pasos: string[]
  consejo?: string
}

export const GUIAS = {
  hoy: {
    titulo: 'Cómo usar Hoy',
    pasos: [
      'Arriba ves tus kcal restantes y tus macros del día.',
      'Toca + en una comida (Desayuno, Almuerzo…) para anotar lo que comiste.',
      'Toca un día de la semana para verlo. Con las flechas cambias de semana y con el calendario saltas a cualquier fecha.',
      'Los días futuros sirven para planificar: lo que anotes ahí se suma solo cuando llegue el día.',
      'Anota tu peso en la tarjeta Peso. Kaibu usa el promedio de 7 días, así un día malo no cambia nada.',
    ],
    consejo: 'Toca algo que ya anotaste para cambiar la cantidad o borrarlo.',
  },
  agregar: {
    titulo: 'Cómo agregar comida',
    pasos: [
      'Escribe lo que comiste: "marraqueta", "huevo", "spaghetti". Entiende errores de tipeo.',
      'Toca el alimento, elige gramos o porciones y toca Agregar.',
      'Escanear: apunta la cámara al código de barras del envase.',
      'Agregar rápido: si solo sabes las kcal (por ejemplo, de un restaurante).',
      'Recientes y Favoritos (la estrella) te ahorran buscar lo de siempre.',
    ],
    consejo: 'Si estás en un día futuro, lo que agregues queda planificado.',
  },
  planificar: {
    titulo: 'Cómo planificar tu semana',
    pasos: [
      'Crea una preparación (meal prep): sus ingredientes con los gramos y en cuántas porciones la divides. Kaibu calcula cada porción.',
      'Toca Repartir: elige la comida (por ejemplo, Almuerzo) y los días. Queda anotada en un paso.',
      'Repetir semana copia lo planificado de una semana a las siguientes (hasta 4).',
      'Lista de compras suma lo que necesitas comprar según lo planificado.',
    ],
    consejo: 'Lo planificado cuenta solo cuando llega el día. Si no lo comiste, bórralo o cámbialo en Hoy.',
  },
  receta: {
    titulo: 'Cómo crear una preparación',
    pasos: [
      'Ponle un nombre, como "Arroz con pollo de la semana".',
      'Busca cada ingrediente y escribe los gramos que usas en TODA la preparación (crudo o cocido, como aparezca en el catálogo).',
      'Escribe en cuántas porciones la vas a dividir (por ejemplo, 5 potes).',
      'Abajo ves las kcal y macros de cada porción. Guarda y queda en Mis alimentos.',
    ],
  },
  compras: {
    titulo: 'Cómo usar la lista de compras',
    pasos: [
      'Elige el período: esta semana, la próxima o los próximos 7 días.',
      'La lista suma los ingredientes de tus preparaciones y lo demás que planificaste.',
      'Marca lo que ya compraste. Con Copiar la mandas por WhatsApp.',
    ],
  },
  progreso: {
    titulo: 'Cómo leer tu progreso',
    pasos: [
      'El gráfico muestra tu peso de cada día y la línea del promedio de 7 días: mira la línea, no los puntos.',
      'Tu semana y tu mes muestran cuántos días cumpliste tus kcal y tu proteína.',
      'Comparte tu semana como imagen; tu peso solo aparece si lo activas.',
    ],
  },
  miPlan: {
    titulo: 'Cómo funciona tu plan',
    pasos: [
      'Kaibu calcula tus kcal y macros con tu peso, estatura, edad, actividad y objetivo.',
      'Cada domingo revisa tu peso: si no avanzas como esperabas, te sugiere un ajuste.',
      'Puedes cambiar el reparto entre comidas o poner tus kcal a mano.',
    ],
  },
  misAlimentos: {
    titulo: 'Cómo usar Mis alimentos',
    pasos: [
      'Aquí están los alimentos que creaste tú y tus preparaciones de meal prep. Solo tú los ves.',
      'Crea uno con los valores de la etiqueta (columna "100 g").',
      'Toca uno para editarlo. Si es una preparación, edítala desde Planificar.',
    ],
  },
  ajustes: {
    titulo: 'Cómo usar Ajustes',
    pasos: [
      'Cambia el tema (claro u oscuro), tu perfil y el tamaño de tu vaso de agua.',
      'Sincronización te muestra si todo está guardado en tu cuenta.',
      'En Mis datos puedes descargar todo o borrar tu cuenta.',
    ],
  },
  comunidad: {
    titulo: 'Cómo usar Comunidad',
    pasos: [
      'Únete al Discord de Kaibu para compartir tu semana y conocer a otras personas.',
      'Envía reportes de fallas o sugerencias desde aquí: el equipo te responde.',
    ],
  },
  aportar: {
    titulo: 'Cómo aportar un producto',
    pasos: [
      'Copia la tabla nutricional del envase, de la columna "100 g".',
      'Si tiene código de barras, escríbelo: así otras personas lo encuentran escaneando.',
      'Otras personas lo confirman con su etiqueta. Con 2 confirmaciones queda verificado.',
    ],
  },
} satisfies Record<string, Guia>

export type ClaveGuia = keyof typeof GUIAS
