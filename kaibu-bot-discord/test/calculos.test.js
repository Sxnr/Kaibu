// Pruebas de los cálculos del bot: deben dar lo mismo que la app (src/domain/calc).
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { calcularPlan, progresionGym, verificarEtiqueta } = require('../lib/calculos')

test('calcularPlan: ejemplo de la SRS (mujer, 31 años, 165 cm, 70,5 kg, ligero, −0,5 kg/sem)', () => {
  const p = calcularPlan({ sexo: 'mujer', edad: 31, peso: 70.5, estatura: 165, factor: 1.375, objetivo: 'perder', kgSemana: 0.5 })
  assert.equal(p.basal, 1420)
  assert.equal(p.mantenimiento, 1953)
  assert.equal(p.ajuste, -550)
  assert.equal(p.meta, 1403)
  assert.deepEqual(p.rango, { min: 1263, max: 1543 })
  assert.equal(p.proteinaG, 141)
  assert.equal(p.proteinaMinimaG, 127)
  assert.equal(p.grasasG, 56)
  assert.equal(p.carbosG, 84)
  assert.equal(p.aguaMl, 2450)
  assert.deepEqual(p.avisos, [])
})

test('calcularPlan: volumen usa 1,8 g/kg de proteína y suma kcal', () => {
  const p = calcularPlan({ sexo: 'hombre', edad: 25, peso: 80, estatura: 180, factor: 1.55, objetivo: 'ganar', kgSemana: 0.1 })
  assert.equal(p.ajuste, 110)
  assert.equal(p.proteinaG, 144)
  assert.equal(p.meta, p.mantenimiento + 110)
})

test('calcularPlan: avisa si la meta queda bajo el mínimo o el ritmo supera 1 % del peso', () => {
  const p = calcularPlan({ sexo: 'mujer', edad: 40, peso: 50, estatura: 150, factor: 1.2, objetivo: 'perder', kgSemana: 0.75 })
  assert.ok(p.avisos.includes('kcal_bajo_minimo'))
  assert.ok(p.avisos.includes('ritmo_alto'))
})

test('progresionGym: sube 2,5 kg solo al llegar al tope del rango (RN-20)', () => {
  assert.deepEqual(progresionGym({ tipo: 'compuesto', peso: 60, reps: 10 }), { sube: true, nuevoPeso: 62.5, tope: 10, rango: '6 a 10' })
  assert.equal(progresionGym({ tipo: 'compuesto', peso: 60, reps: 9 }).sube, false)
  assert.equal(progresionGym({ tipo: 'aislado', peso: 12, reps: 12 }).sube, true)
})

test('verificarEtiqueta: coherencia igual que la app (±15 % sobre las kcal declaradas)', () => {
  assert.equal(verificarEtiqueta({ kcal: 100, proteina: 10, carbos: 10, grasas: 2.2, estado: 'solido' }).coherente, true)
  assert.equal(verificarEtiqueta({ kcal: 300, proteina: 10, carbos: 10, grasas: 2, estado: 'solido' }).coherente, false)
  assert.equal(verificarEtiqueta({ kcal: 0, proteina: 0, carbos: 1, grasas: 0, estado: 'liquido' }).coherente, true)
})

test('verificarEtiqueta: sellos ALTO EN con límites distintos para sólidos y líquidos (Ley 20.606)', () => {
  const solido = verificarEtiqueta({ kcal: 280, proteina: 5, carbos: 50, grasas: 6, azucares: 11, saturadas: 4.5, sodio: 401, estado: 'solido' })
  assert.deepEqual(solido.sellos, ['calorias', 'azucares', 'grasas_saturadas', 'sodio'])
  const bebida = verificarEtiqueta({ kcal: 42, proteina: 0, carbos: 10.6, grasas: 0, azucares: 10.6, estado: 'liquido' })
  assert.deepEqual(bebida.sellos, ['azucares'])
  const agua = verificarEtiqueta({ kcal: 0, proteina: 0, carbos: 0, grasas: 0, estado: 'liquido' })
  assert.deepEqual(agua.sellos, [])
})
