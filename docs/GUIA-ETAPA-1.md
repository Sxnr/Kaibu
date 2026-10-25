# Kaibu · Guía de la Etapa 1

Esta guía está escrita para el dueño del proyecto (no hace falta saber programar).
Cada paso dice **qué hacer**, el **comando exacto** y **qué deberías ver**.

---

## 1. Qué quedó funcionando

| Parte | Estado |
|---|---|
| Identidad visual: logo K con flecha (SVG y PNG), paleta carmesí, tema claro/oscuro/sistema, Barlow Condensed + Inter | ✅ |
| Bienvenida de 4 pantallas con "Saltar" | ✅ |
| Registro e inicio de sesión (correo + contraseña y Google), recuperar contraseña, 2 casillas de consentimiento **separadas y sin marcar** | ✅ (se activa al conectar Supabase) |
| Cuestionario inicial (una pregunta por pantalla, barra de avance, fecha estimada por velocidad) | ✅ |
| "Tu plan" animado, explicando de dónde sale cada número | ✅ |
| Cálculos de la sección 7 (Mifflin-St Jeor, factor de actividad, macros, reparto, promedio 7 días, ritmo, proyección, ajuste semanal, avisos de seguridad, transición de fases) | ✅ con pruebas |
| **Hoy**: tira semanal con estado por día, kcal restantes que cuentan hacia arriba/abajo, macros, comidas con "+", racha, peso del día | ✅ |
| **Agregar**: búsqueda (sin tildes y con sinónimos chilenos), recientes con "+" de un toque, favoritos, mis alimentos, agregar rápido (kcal + proteína), copiar comida o día de ayer, "Deshacer" | ✅ |
| **Mis alimentos** (privados): crear, editar, borrar, aviso si las kcal no calzan con los macros | ✅ |
| **Peso** y **Progreso**: registro rápido, promedio 7 días, barra de avance animada, % logrado, fecha estimada, ritmo real vs planeado | ✅ |
| **Mi plan**: todo el plan con su explicación, recalcular o ajustar a mano (kcal, proteína, agua, reparto %) | ✅ |
| **Ajustes**: tema, perfil y datos físicos, estado de sincronización, documentos legales, cerrar sesión | ✅ |
| Catálogo inicial: **115 alimentos** chilenos con la fuente de cada valor | ✅ |
| Supabase: 7 tablas con **Row Level Security**, validaciones en el servidor, perfil automático | ✅ (probado en una base local) |
| Sin conexión: todo se guarda en el dispositivo y se sincroniza al volver internet | ✅ |
| App instalable (PWA) con ícono, pantalla de carga y funcionamiento offline | ✅ |
| Seguridad web: Content-Security-Policy estricta, HTTPS obligatorio (HSTS) y otros encabezados | ✅ |
| Diseño adaptable: 4 pestañas abajo en celular; menú lateral y grilla en PC | ✅ |

**Pruebas automáticas que pasan hoy:**

- 101 pruebas de cálculos, formato chileno, catálogo, sincronización y seguridad (Vitest).
- 16 pruebas de pantallas: 4 recorridos × celular (390 px) y PC (1440 px) × tema claro y oscuro. Incluyen una revisión de accesibilidad WCAG 2.2 AA con axe, la ausencia de scroll horizontal, la ausencia de errores en la consola y el uso sin conexión.
- Prueba de seguridad de la base de datos: un usuario no puede ver ni tocar datos de otro.
- Lighthouse en PC: rendimiento 100, accesibilidad 100, buenas prácticas 100 y SEO 100.
- Lighthouse en celular (4G lenta simulada): rendimiento 89, accesibilidad 100, buenas prácticas 100 y SEO 100.

### Cambios respecto del plan (para que lo sepas)

- **No hay tablas `plans` ni `meal_slots`.** El plan se calcula en vivo desde tu perfil y tu peso promedio. Así se recalcula solo, como pide la sección 7. El reparto por comida y los ajustes manuales se guardan en el perfil.
- **Racha.** Por ahora cuenta los días seguidos dentro del rango. El botón "Terminar día" llega en la Etapa 2, como dice el documento.
- **Peso.** Se registra desde "Hoy" y desde "Progreso". No tiene una pestaña aparte.
- **"Modo local".** Si Supabase todavía no está conectado, la app funciona igual y guarda todo solo en el dispositivo. Sirve para probarla hoy mismo. Apenas configures Supabase, aparecen las cuentas reales.

---

## 2. Pruébala en tu computador (5 minutos, sin Supabase)

### Paso 2.1 · Instala lo necesario (una sola vez)

1. Instala **Node.js 20 o superior**: https://nodejs.org (botón "LTS").
2. Instala **Git**: https://git-scm.com/downloads.
3. Abre una terminal (en Windows: "PowerShell"; en Mac: "Terminal") y escribe:

```bash
node --version
git --version
```

**Deberías ver** algo como `v22.x.x` y `git version 2.x.x`.

### Paso 2.2 · Descarga el proyecto

```bash
git clone https://github.com/Sxnr/Kaibu.git
cd Kaibu
git checkout claude/beautiful-ritchie-wp95jb
```

**Deberías ver** `Switched to branch 'claude/beautiful-ritchie-wp95jb'`.

### Paso 2.3 · Instala las dependencias

```bash
npm ci
```

**Deberías ver** al final `added ... packages` y `found 0 vulnerabilities`. Tarda 1 o 2 minutos.

### Paso 2.4 · Abre la app

```bash
npm run dev
```

**Deberías ver** `Local: http://localhost:5173/`. Abre esa dirección en Chrome.

### Paso 2.5 · Recorre la app

1. Verás la **bienvenida** (4 pantallas). Toca "Siguiente" o "Saltar".
2. En **Crea tu cuenta** aparece el aviso "Modo local". Marca las dos casillas y toca "Usar en este dispositivo".
3. Responde el **cuestionario**. Al final verás **Tu plan** con tus kcal, macros y reparto, cada uno con su explicación.
4. Toca **Empezar**. Verás **Hoy** vacío, con el mensaje "Tu día está en blanco".
5. Toca **+** en Desayuno, busca "marraqueta" y agrégala. El número de kcal restantes baja con una animación.
6. Para verla como en el celular: en Chrome presiona `F12` y luego el ícono de celular (o `Ctrl+Shift+M`).

Para detener la app, vuelve a la terminal y presiona `Ctrl + C`.

---

## 3. Conecta Supabase (cuentas reales y sincronización)

Supabase es gratuito para empezar. Los nombres de los botones pueden cambiar un poco con el tiempo.

### Paso 3.1 · Crea el proyecto

1. Entra a https://supabase.com y crea una cuenta.
2. Toca **New project**:
   - Name: `kaibu`
   - Database password: toca "Generate" y **guárdala** en un lugar seguro.
   - Region: **South America (São Paulo)**, la más cercana a Chile.
3. Espera 1 o 2 minutos hasta que diga que el proyecto está listo.

### Paso 3.2 · Crea las tablas y la seguridad

1. En el menú izquierdo abre **SQL Editor** y luego **New query**.
2. Abre en tu computador el archivo `supabase/migrations/20261025000100_etapa1_esquema.sql`. Copia todo su contenido y pégalo en Supabase.
3. Toca **Run**. **Deberías ver** `Success. No rows returned`.
4. Toca **New query** otra vez. Pega el contenido de `supabase/seed.sql` (el catálogo de alimentos) y toca **Run**.
5. Abre **Table Editor** y luego `foods_catalog`. **Deberías ver** 115 alimentos.

### Paso 3.3 · Copia las claves públicas

1. Ve a **Project Settings → API** (o "Data API" / "API Keys").
2. Copia:
   - **Project URL** (algo como `https://abcd1234.supabase.co`)
   - **anon public key** (una clave larga).
3. ⚠️ **Nunca** copies la clave `service_role`: esa es secreta y no va en la app.

### Paso 3.4 · Pon las claves en el proyecto

En la carpeta `Kaibu`, crea un archivo llamado `.env.local` (puedes copiar `.env.example`) con este contenido, usando tus datos:

```
VITE_SUPABASE_URL=https://abcd1234.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
```

Este archivo **no se sube a GitHub** (está protegido en `.gitignore`).

### Paso 3.5 · Configura las direcciones de la app

En Supabase ve a **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:5173` (cuando publiques, cámbiala por la de Vercel).
- **Redirect URLs**: agrega `http://localhost:5173/**` (y luego `https://TU-APP.vercel.app/**`).

### Paso 3.6 · Activa "Continuar con Google" (opcional, gratis)

1. Entra a https://console.cloud.google.com y crea un proyecto llamado "Kaibu".
2. Abre **APIs y servicios → Pantalla de consentimiento de OAuth** y elige tipo "Externo". Completa el nombre de la app, tu correo y el logo (`public/icons/icon-512.png`).
3. Abre **Credenciales → Crear credenciales → ID de cliente de OAuth** y elige tipo "Aplicación web".
   - En **URI de redireccionamiento autorizados** pega: `https://abcd1234.supabase.co/auth/v1/callback` (con tu dirección de Supabase).
4. Copia el **ID de cliente** y el **Secreto**.
5. En Supabase abre **Authentication → Providers → Google**. Actívalo, pega ambos valores y guarda.

### Paso 3.7 · Prueba las cuentas

```bash
npm run dev
```

1. Crea una cuenta con tu correo. **Deberías ver** "Revisa tu correo".
2. Abre el correo de Supabase y toca el enlace. Vuelves a la app con la sesión iniciada.
3. Completa el cuestionario y registra algo.
4. En Supabase abre **Table Editor → food_logs**. **Deberías ver** tu registro (puede tardar unos segundos).
5. Para probar la sincronización entre dispositivos: inicia sesión en otro navegador o en tu celular. Aparecen los mismos datos.

---

## 4. Publica la app en internet (Vercel, gratis)

Requisito: el código debe estar en GitHub (ver "Pendientes").

1. Entra a https://vercel.com y regístrate con tu cuenta de GitHub.
2. Toca **Add New → Project** e importa el repositorio `Kaibu`.
3. Vercel detecta "Vite" solo. En **Environment Variables** agrega:
   - `VITE_SUPABASE_URL` = tu Project URL
   - `VITE_SUPABASE_ANON_KEY` = tu anon key
4. Toca **Deploy**. Después de 1 o 2 minutos **deberías ver** "Congratulations" y una dirección como `https://kaibu.vercel.app`.
5. Vuelve a Supabase → **Authentication → URL Configuration** y pon esa dirección en **Site URL** y en **Redirect URLs** (`https://kaibu.vercel.app/**`). Si activaste Google, no hay que cambiar nada allá.

Los encabezados de seguridad (CSP, HTTPS obligatorio) ya vienen configurados en `vercel.json`.

### Instálala como app

- **Android (Chrome):** abre tu dirección de Vercel, toca el menú ⋮ y luego **Instalar aplicación**. Aparece el ícono de Kaibu en tu pantalla de inicio.
- **PC (Chrome o Edge):** toca el ícono de instalar en la barra de direcciones.

### Prueba sin conexión

1. Abre la app instalada y registra algo.
2. Activa el modo avión.
3. Cierra y vuelve a abrir la app. Sigue funcionando y puedes registrar comidas.
4. Desactiva el modo avión. En **Ajustes → Sincronización** verás "Sincronizado con tu cuenta".

---

## 5. Comandos de calidad (para revisar que nada se rompió)

| Comando | Qué hace | Qué deberías ver |
|---|---|---|
| `npm run check` | Revisa tipos, estilo y accesibilidad del código, y corre las 101 pruebas | `Tests 101 passed` |
| `npx playwright install chromium` | Instala el navegador de pruebas (solo la primera vez) | Descarga de Chromium |
| `npm run test:e2e` | Prueba las pantallas en celular y PC, en tema claro y oscuro | `16 passed` |
| `npm run build` | Arma la versión para publicar | `✓ built` |

Las capturas de las pruebas quedan en la carpeta `test-results/`. Para ver un informe visual, usa `npx playwright show-report`.

**Prueba de seguridad de la base (avanzado, opcional):** necesita PostgreSQL instalado. Carga `supabase/tests/supabase-shim.sql`, la migración y `supabase/seed.sql` en una base vacía. Luego ejecuta `supabase/tests/rls.sql`. Debe terminar con `RLS OK`.

---

## 6. Pendientes y riesgos

### Para que lo resuelvas tú

1. **El código no está en GitHub todavía.** La sesión de Claude no tiene permiso de escritura en `Sxnr/Kaibu` (error 403). Conecta GitHub en https://claude.ai/connect-github e instala la app de Claude en el repositorio. Así puedo subir todo (los commits ya están listos).
2. **Crear el proyecto en Supabase** (sección 3) y **publicar en Vercel** (sección 4).
3. **Revisión legal.** Los Términos, la Privacidad y el Aviso de salud son borradores breves. Tienen datos por completar marcados con `[corchetes]`: responsable, correo de contacto, plazo de borrado y la edad entre 14 y 17 años. La versión completa se redacta en la Etapa 2 y luego debe revisarla un abogado.

### Limitaciones de herramientas gratuitas (aviso, como pediste)

- **Copias de seguridad.** Según la información pública de Supabase, el plan gratuito no incluye copias de seguridad que puedas restaurar tú. Alternativas:
  - (a) Plan Pro de Supabase, alrededor de 25 USD al mes, con copias diarias.
  - (b) Una tarea gratuita de GitHub Actions que haga un `pg_dump` cada noche. La puedo preparar en la Etapa 2.
- **Pausa por inactividad.** En el plan gratuito, Supabase pausa el proyecto si pasa una semana sin uso. Se reactiva desde el panel. Con usuarios reales no debería pasar.

### Riesgos técnicos y cosas por verificar

- **Valores del catálogo.** No se pudo consultar la base del USDA desde este entorno, así que los 115 alimentos se transcribieron de tablas de referencia: USDA FoodData Central, la Tabla de Composición de Alimentos Chilenos del INTA y etiquetas típicas. Cada uno indica su fuente y una prueba automática revisa que las kcal calcen con los macros. Igual conviene que una nutricionista los revise antes del lanzamiento público.
- **Cuentas reales sin probar todavía.** El registro con correo y Google se probará de punta a punta cuando exista tu proyecto Supabase. Las pruebas actuales usan el modo local y una base PostgreSQL local que imita a Supabase.
- **Rendimiento en celular: 89, la meta es 90.** Medido con 4G lenta simulada. En PC es 100. Se puede mejorar cargando más partes de la app a pedido.
- **Datos en el dispositivo.** Para funcionar sin conexión, los registros quedan en el navegador (IndexedDB) sin cifrar. Al cerrar sesión se borran.
- **Sesión.** Supabase guarda la sesión en el almacenamiento del navegador, que es lo normal en apps web. La política de seguridad (CSP) estricta reduce el riesgo de robo.
- **Sentry (monitoreo de errores)** y la pantalla de **licencias de terceros** están previstos para la Etapa 2.
- **Sin límite de solicitudes propio** para guardar datos. Supabase ya limita los intentos de inicio de sesión. Los límites del escáner, los aportes y la IA llegan en las Etapas 3 y 4, que es donde se necesitan.
