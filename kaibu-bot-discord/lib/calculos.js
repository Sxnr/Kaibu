// Cálculos de las calculadoras del bot. Son los mismos de la app (src/domain/calc):
// si cambias una fórmula allá, cámbiala aquí y corre `npm test`.

const KCAL_POR_KG = 7700
const KCAL_MINIMAS = { hombre: 1500, mujer: 1200 }
const PROTEINA_CUMPLIDA = 0.9

/**
 * RN-01 a RN-14: gasto en reposo, mantenimiento, meta, rango, macros, agua y avisos.
 * @param {{ sexo: 'hombre'|'mujer', edad: number, peso: number, estatura: number, factor: number, objetivo: 'perder'|'mantener'|'ganar', kgSemana: number }} d
 */
function calcularPlan({ sexo, edad, peso, estatura, factor, objetivo, kgSemana }) {
  const basalExacto = 10 * peso + 6.25 * estatura - 5 * edad + (sexo === 'hombre' ? 5 : -161)
  const mantenimiento = Math.round(basalExacto * factor)
  const magnitud = objetivo === 'mantener' ? 0 : Math.round((kgSemana * KCAL_POR_KG) / 7)
  const ajuste = objetivo === 'perder' ? -magnitud : magnitud
  const meta = mantenimiento + ajuste
  const protFactor = objetivo === 'perder' ? 2.0 : 1.8
  const proteinaG = Math.round(protFactor * peso)
  const grasasG = Math.round(0.8 * peso)
  const carbosG = Math.max(0, Math.round((meta - proteinaG * 4 - grasasG * 9) / 4))
  const avisos = []
  if (meta < KCAL_MINIMAS[sexo]) avisos.push('kcal_bajo_minimo')
  if (objetivo !== 'mantener' && kgSemana > peso * 0.01) avisos.push('ritmo_alto')
  return {
    basal: Math.round(basalExacto),
    mantenimiento,
    ajuste,
    meta,
    rango: { min: Math.round(meta * 0.9), max: Math.round(meta * 1.1) },
    protFactor,
    proteinaG,
    proteinaMinimaG: Math.round(proteinaG * PROTEINA_CUMPLIDA),
    grasasG,
    carbosG,
    aguaMl: Math.round((peso * 35) / 50) * 50,
    kcalMinima: KCAL_MINIMAS[sexo],
    avisos,
  }
}

/** RN-20: con el tope del rango (compuesto 6–10, aislado 8–12) se sube 2,5 kg. */
function progresionGym({ tipo, peso, reps }) {
  const tope = tipo === 'compuesto' ? 10 : 12
  const rango = tipo === 'compuesto' ? '6 a 10' : '8 a 12'
  const sube = reps >= tope
  return { sube, nuevoPeso: sube ? Math.round((peso + 2.5) * 10) / 10 : peso, tope, rango }
}

// Ley 20.606 (etapa final): límites por 100 g (sólidos) o 100 ml (líquidos).
const LIMITES = {
  solido: { calorias: 275, azucares: 10, grasas_saturadas: 4, sodio: 400 },
  liquido: { calorias: 70, azucares: 5, grasas_saturadas: 3, sodio: 100 },
}

/** RN-15 (coherencia, igual que la app) y sellos "ALTO EN". */
function verificarEtiqueta({ kcal, proteina, carbos, grasas, azucares = 0, saturadas = 0, sodio = 0, estado = 'solido' }) {
  const calculadas = proteina * 4 + carbos * 4 + grasas * 9
  const diferencia = kcal === 0 ? (calculadas < 5 ? 0 : 1) : Math.abs(calculadas - kcal) / kcal
  const coherente = diferencia <= 0.15
  const l = LIMITES[estado] || LIMITES.solido
  const valores = { calorias: kcal, azucares, grasas_saturadas: saturadas, sodio }
  const sellos = Object.keys(l).filter((k) => valores[k] > l[k])
  return { coherente, calculadas: Math.round(calculadas), diferenciaPct: Math.round(diferencia * 1000) / 10, sellos, limites: l }
}

module.exports = { calcularPlan, progresionGym, verificarEtiqueta, LIMITES }
