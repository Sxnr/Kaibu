# Kaibu · notas para asistentes de IA

- El dueño **no es programador**: explicar en español de Chile, paso a paso, con comandos exactos y qué se verá.
- Trabajar **por etapas** (ver docs/GUIA-ETAPA-1.md y el documento de requisitos). Mostrar un plan corto antes de programar cada etapa y esperar confirmación.
- La app **no trae datos inyectados** (salvo el catálogo de alimentos). Cada pantalla vacía tiene un estado vacío.
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
