# Kaibu · notas para asistentes de IA

- El dueño **no es programador**: explicar en español de Chile, paso a paso, con comandos exactos y qué se verá.
- Trabajar **por etapas** según el documento de requisitos del dueño. Mostrar un plan corto antes de programar cada etapa y esperar confirmación.
- La app **no trae datos inyectados** (salvo el catálogo de alimentos). Cada pantalla vacía tiene un estado vacío.
- Las guías y ayudas para el dueño **no se suben al repositorio**: se entregan por chat o como archivo (carpeta local `ayuda/`, ignorada por git).
- No inventar funciones fuera del documento sin preguntar. Avisar si algo no es posible con herramientas gratuitas.
- Flujo ECC: planificar → pruebas primero (Vitest) en `src/domain` → implementar → revisar → verificar (`npm run check`, `npm run test:e2e`).

## Convenciones

- TypeScript estricto, nombres y comentarios breves en español.
- Cálculos = funciones puras en `src/domain/calc` con pruebas.
- Datos: la interfaz lee de Dexie (`src/data/consultas.ts`, usar `useConsulta`) y escribe con `guardar`/`borrar` (`src/data/escritura.ts`), que encolan la sincronización. Borrado suave con `deletedAt`.
- Toda tabla nueva en Supabase: migración en `supabase/migrations`, RLS con `(select auth.uid()) = user_id`, CHECKs de validación, trigger `set_updated_at`, y entrada en `src/data/tablas.ts`.
- Colores solo con tokens (`bg-superficie`, `text-texto-marca`, etc.). El rojo se usa con intención. Ningún estado solo por color.
- Confirmaciones con aviso inferior + "Deshacer" (sonner), nunca diálogos que interrumpan.
- Animaciones con componentes `m.` de Motion (LazyMotion) y respetando "reducir movimiento".
- Si se edita el `<script>` en línea de `index.html`, actualizar su hash en `vercel.json` y `vite.config.ts` (lo verifica `tests/unit/seguridad.test.ts`).

## Commits

- Autor y committer: **Sxnr <franciscocarrera956@gmail.com>** (configurar con `git config user.name` / `git config user.email` en el repositorio).
- Sin líneas de atribución a la IA en los mensajes (ni `Claude-Session:` ni `Co-Authored-By:`). Es instrucción explícita del dueño.
- Formato: Conventional Commits en español (`feat:`, `fix:`, `docs:`, `chore:`…).
- Rama principal: **main** (se sube ahí; no crear ramas con nombres de la IA).
