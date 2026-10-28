# Kaibu

**Nutrición y progreso, por fases.** App de registro de comidas y progreso físico para Android y web, con la misma cuenta en ambos.

- Estado: **Etapa 1 · Base y núcleo** terminada.

## Inicio rápido

```bash
npm ci          # instala dependencias
npm run dev     # abre http://localhost:5173
```

Sin Supabase configurado, la app funciona en **modo local** (datos solo en el dispositivo).
Para cuentas reales, copia `.env.example` como `.env.local` y completa la URL y la clave pública de tu proyecto Supabase.

## Tecnología

React + Vite + TypeScript estricto · Tailwind CSS (tokens claro/oscuro) · componentes estilo shadcn/ui sobre Radix ·
Lucide · Motion · React Hook Form + Zod · TanStack Query · Dexie (offline) · vite-plugin-pwa · Supabase (Auth, Postgres con RLS).

## Estructura

```
src/
  app/          sesión, rutas protegidas, navegación, tema
  domain/       cálculos (sección 7) y formato chileno — funciones puras con pruebas
  data/         Dexie (dispositivo), sincronización con Supabase, catálogo de alimentos
  features/     una carpeta por pantalla (hoy, agregar, progreso, plan, ajustes…)
  components/   componentes compartidos y ui/ (base accesible)
supabase/       migraciones SQL (tablas + RLS), seed del catálogo y prueba de RLS
tests/          e2e (Playwright + axe) y pruebas de seguridad
scripts/        generación de íconos y del SQL del catálogo
video/          video demo 3D (Remotion + Three.js), proyecto aparte — ver video/README.md
docs/           SRS: requisitos del producto completo y modelo de negocio (docs/SRS.md)
```

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Desarrollo local |
| `npm run check` | Tipos + ESLint (con jsx-a11y) + pruebas Vitest |
| `npm run test:e2e` | Playwright en celular/PC × claro/oscuro con axe |
| `npm run build` | Versión de producción (PWA) |
| `npm run icons` | Regenera los íconos desde `scripts/brand.mjs` |
| `npm run catalog:sql` | Regenera `supabase/seed.sql` desde el catálogo |

## Seguridad

Solo se usan la URL y la clave **pública** de Supabase. Toda la protección de datos está en
Row Level Security: cada usuario solo lee y escribe lo suyo. Nunca agregues claves secretas
(`service_role`, claves de IA) al código ni a variables `VITE_*`.
