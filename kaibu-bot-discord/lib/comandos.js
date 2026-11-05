// Comandos slash del bot. Solo funcionan dentro del servidor (no por mensaje directo).
const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType } = require('discord.js')

const enServidor = (c) => c.setContexts(InteractionContextType.Guild)
const publico = (o) => o.setName('compartir').setDescription('Mostrar el resultado a todos en el canal (por defecto solo lo ves tú)')

const COMANDOS = [
  enServidor(
    new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Crea o repara toda la comunidad de Kaibu (canales, roles y paneles)')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  ),

  enServidor(
    new SlashCommandBuilder()
      .setName('calcular-plan')
      .setDescription('Calcula tu meta de kcal y macros con las fórmulas de Kaibu (RN-01 a RN-14)')
      .addStringOption((o) =>
        o.setName('sexo').setDescription('Sexo biológico (fórmula Mifflin-St Jeor)').setRequired(true)
          .addChoices({ name: 'Hombre', value: 'hombre' }, { name: 'Mujer', value: 'mujer' }),
      )
      .addIntegerOption((o) => o.setName('edad').setDescription('Edad en años (18 a 100)').setRequired(true).setMinValue(18).setMaxValue(100))
      .addNumberOption((o) => o.setName('peso').setDescription('Peso actual en kg (30 a 300)').setRequired(true).setMinValue(30).setMaxValue(300))
      .addIntegerOption((o) => o.setName('estatura').setDescription('Estatura en cm (120 a 230)').setRequired(true).setMinValue(120).setMaxValue(230))
      .addStringOption((o) =>
        o.setName('actividad').setDescription('Nivel de actividad (RN-02)').setRequired(true)
          .addChoices(
            { name: 'Sedentario (× 1,2)', value: '1.2' },
            { name: 'Ligero (× 1,375)', value: '1.375' },
            { name: 'Moderado (× 1,55)', value: '1.55' },
            { name: 'Alto (× 1,725)', value: '1.725' },
            { name: 'Muy alto (× 1,9)', value: '1.9' },
          ),
      )
      .addStringOption((o) =>
        o.setName('fase').setDescription('Objetivo y velocidad semanal (RN-04)').setRequired(true)
          .addChoices(
            { name: 'Bajar lento (−0,25 kg/sem)', value: 'perder_0.25' },
            { name: 'Bajar recomendado (−0,5 kg/sem)', value: 'perder_0.5' },
            { name: 'Bajar rápido (−0,75 kg/sem)', value: 'perder_0.75' },
            { name: 'Mantener', value: 'mantener_0' },
            { name: 'Subir lento (+0,1 kg/sem)', value: 'ganar_0.1' },
            { name: 'Subir recomendado (+0,2 kg/sem)', value: 'ganar_0.2' },
            { name: 'Subir rápido (+0,3 kg/sem)', value: 'ganar_0.3' },
          ),
      )
      .addBooleanOption(publico),
  ),

  enServidor(
    new SlashCommandBuilder()
      .setName('progresion-gym')
      .setDescription('¿Toca subir peso? Regla de progresión de Kaibu (RN-20)')
      .addStringOption((o) => o.setName('ejercicio').setDescription('Ej.: sentadilla, press banca').setRequired(true).setMaxLength(60))
      .addStringOption((o) =>
        o.setName('tipo').setDescription('Tipo de ejercicio').setRequired(true)
          .addChoices({ name: 'Compuesto (rango 6 a 10 reps)', value: 'compuesto' }, { name: 'Aislado (rango 8 a 12 reps)', value: 'aislado' }),
      )
      .addNumberOption((o) => o.setName('peso_actual').setDescription('Peso usado en kg').setRequired(true).setMinValue(0).setMaxValue(500))
      .addIntegerOption((o) => o.setName('reps_logradas').setDescription('Repeticiones logradas en la serie').setRequired(true).setMinValue(1).setMaxValue(50))
      .addBooleanOption(publico),
  ),

  enServidor(
    new SlashCommandBuilder()
      .setName('verificar-etiqueta')
      .setDescription('Revisa una tabla nutricional (RN-15) y sus sellos ALTO EN (Ley 20.606)')
      .addStringOption((o) =>
        o.setName('tipo').setDescription('¿Sólido o líquido?').setRequired(true)
          .addChoices({ name: 'Sólido (valores por 100 g)', value: 'solido' }, { name: 'Líquido (valores por 100 ml)', value: 'liquido' }),
      )
      .addNumberOption((o) => o.setName('kcal').setDescription('Calorías').setRequired(true).setMinValue(0).setMaxValue(900))
      .addNumberOption((o) => o.setName('proteina').setDescription('Proteínas en g').setRequired(true).setMinValue(0).setMaxValue(100))
      .addNumberOption((o) => o.setName('carbos').setDescription('Carbohidratos en g').setRequired(true).setMinValue(0).setMaxValue(100))
      .addNumberOption((o) => o.setName('grasas').setDescription('Grasas totales en g').setRequired(true).setMinValue(0).setMaxValue(100))
      .addNumberOption((o) => o.setName('azucares').setDescription('Azúcares totales en g (opcional)').setMinValue(0).setMaxValue(100))
      .addNumberOption((o) => o.setName('saturadas').setDescription('Grasas saturadas en g (opcional)').setMinValue(0).setMaxValue(100))
      .addNumberOption((o) => o.setName('sodio').setDescription('Sodio en mg (opcional)').setMinValue(0).setMaxValue(40000))
      .addBooleanOption(publico),
  ),

  enServidor(
    new SlashCommandBuilder()
      .setName('vincular')
      .setDescription('Une tu cuenta de Discord con tu cuenta de Kaibu (código en Kaibu → Comunidad)')
      .addStringOption((o) => o.setName('codigo').setDescription('El código de 6 caracteres que muestra la app').setRequired(true).setMinLength(6).setMaxLength(6)),
  ),

  enServidor(new SlashCommandBuilder().setName('desvincular').setDescription('Quita la unión entre tu Discord y tu cuenta de Kaibu')),

  enServidor(
    new SlashCommandBuilder()
      .setName('invitacion')
      .setDescription('Muestra (o crea) el link permanente para invitar gente al servidor')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  ),

  enServidor(
    new SlashCommandBuilder()
      .setName('metricas-beta')
      .setDescription('Bugs, sugerencias, encuesta y cuentas vinculadas de la beta')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  ),
].map((c) => c.toJSON())

module.exports = { COMANDOS }
