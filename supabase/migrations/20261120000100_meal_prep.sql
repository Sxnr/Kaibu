-- =====================================================================
-- Kaibu · 0.4.0 "Planifica tu semana"
-- recipes: preparaciones en lote (meal prep). Cada una queda guardada también como
-- alimento propio (user_foods) con sus valores por 100 g y su porción.
-- Planificar días futuros no necesita tablas nuevas: es un food_logs con fecha futura.
-- =====================================================================

-- La receta debe apuntar a un alimento del mismo usuario.
alter table public.user_foods add constraint user_foods_id_user_unique unique (id, user_id);

create table public.recipes (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id uuid not null,
  nombre text not null check (char_length(nombre) between 1 and 120),
  porciones numeric(5, 1) not null check (porciones between 1 and 100),
  -- [{ clave, nombre, gramos, kcal, proteina, carbos, grasas }] con nutrientes por 100 g
  ingredientes jsonb not null check (jsonb_typeof(ingredientes) = 'array' and jsonb_array_length(ingredientes) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint recipes_food_fk foreign key (food_id, user_id) references public.user_foods (id, user_id) on delete cascade
);
create index recipes_user_updated_idx on public.recipes (user_id, updated_at);

create trigger recipes_updated_at before insert or update on public.recipes
  for each row execute function public.set_updated_at();

alter table public.recipes enable row level security;
create policy "recipes: leer lo propio" on public.recipes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "recipes: crear lo propio" on public.recipes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "recipes: editar lo propio" on public.recipes
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "recipes: borrar lo propio" on public.recipes
  for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.recipes from anon;

-- Beta cerrada: igual que el resto de las tablas propias.
create policy "recipes: beta cerrada (crear)" on public.recipes
  as restrictive for insert to authenticated with check (public.puede_usar_kaibu());
create policy "recipes: beta cerrada (editar)" on public.recipes
  as restrictive for update to authenticated using (public.puede_usar_kaibu());
