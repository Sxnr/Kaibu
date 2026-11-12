-- =====================================================================
-- Kaibu · Catálogo completo y catálogo colaborativo
-- 1. foods_catalog suma marca y código de barras (para cargar los productos con marca).
-- 2. community_foods: productos que aportan las personas desde la etiqueta (con código de barras o sin él).
--    Todos los ven; cada uno edita solo lo suyo. Si cambia los valores, sus confirmaciones vuelven a cero.
-- 3. community_food_votes: "coincide con la etiqueta" o "tiene un error". Con 2 confirmaciones queda
--    verificado; con 3 reportes (y más reportes que confirmaciones) se oculta.
-- Se puede ejecutar más de una vez sin errores.
-- =====================================================================

-- 1. Catálogo con marca y código --------------------------------------
alter table public.foods_catalog add column if not exists marca text check (marca is null or char_length(marca) <= 80);
alter table public.foods_catalog add column if not exists codigo text check (codigo is null or codigo ~ '^[0-9]{8,14}$');
create index if not exists foods_catalog_codigo on public.foods_catalog (codigo) where codigo is not null;

-- 2. Alimentos de la comunidad -----------------------------------------
create table if not exists public.community_foods (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete set null,
  codigo text check (codigo is null or codigo ~ '^[0-9]{8,14}$'),
  nombre text not null check (char_length(nombre) between 2 and 80),
  marca text check (marca is null or char_length(marca) <= 40),
  kcal_100 numeric(6, 1) not null check (kcal_100 between 0 and 900),
  proteina_100 numeric(5, 1) not null check (proteina_100 between 0 and 100),
  carbos_100 numeric(5, 1) not null check (carbos_100 between 0 and 100),
  grasas_100 numeric(5, 1) not null check (grasas_100 between 0 and 100),
  porcion_nombre text check (porcion_nombre is null or char_length(porcion_nombre) <= 30),
  porcion_g numeric(6, 1) check (porcion_g is null or porcion_g between 1 and 1000),
  confirmaciones integer not null default 0,
  reportes integer not null default 0,
  estado text not null default 'nuevo' check (estado in ('nuevo', 'verificado', 'oculto')),
  -- Desde cuándo valen los valores actuales (los votos anteriores a un cambio no cuentan).
  valores_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint community_foods_macros check (proteina_100 + carbos_100 + grasas_100 <= 100.5)
);
create index if not exists community_foods_codigo on public.community_foods (codigo) where codigo is not null;
create index if not exists community_foods_actualizado on public.community_foods (updated_at);
create index if not exists community_foods_usuario on public.community_foods (user_id);

alter table public.community_foods enable row level security;
revoke all on public.community_foods from anon, authenticated;
grant select, insert, update on public.community_foods to authenticated;

drop policy if exists "comunidad: ver" on public.community_foods;
create policy "comunidad: ver" on public.community_foods for select to authenticated using (true);
drop policy if exists "comunidad: aportar" on public.community_foods;
create policy "comunidad: aportar" on public.community_foods for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "comunidad: editar lo propio" on public.community_foods;
create policy "comunidad: editar lo propio" on public.community_foods for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Las personas no pueden tocar las confirmaciones, los reportes ni el estado: solo el recuento de votos.
create or replace function public.proteger_aporte()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('kaibu.recuento', true), '') = '1' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.confirmaciones := 0;
    new.reportes := 0;
    new.estado := 'nuevo';
    new.valores_at := now();
    return new;
  end if;
  new.confirmaciones := old.confirmaciones;
  new.reportes := old.reportes;
  new.estado := old.estado;
  new.valores_at := old.valores_at;
  if (new.kcal_100, new.proteina_100, new.carbos_100, new.grasas_100, new.codigo, new.porcion_g)
     is distinct from (old.kcal_100, old.proteina_100, old.carbos_100, old.grasas_100, old.codigo, old.porcion_g) then
    new.confirmaciones := 0;
    new.reportes := 0;
    new.estado := 'nuevo';
    new.valores_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists community_foods_proteger on public.community_foods;
create trigger community_foods_proteger before insert or update on public.community_foods
  for each row execute function public.proteger_aporte();
drop trigger if exists community_foods_updated_at on public.community_foods;
create trigger community_foods_updated_at before insert or update on public.community_foods
  for each row execute function public.set_updated_at();

-- 3. Votos ---------------------------------------------------------------
create table if not exists public.community_food_votes (
  food_id uuid not null references public.community_foods (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  voto text not null check (voto in ('confirma', 'reporta')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (food_id, user_id)
);
create index if not exists community_food_votes_usuario on public.community_food_votes (user_id);

alter table public.community_food_votes enable row level security;
revoke all on public.community_food_votes from anon, authenticated;
grant select, insert, update on public.community_food_votes to authenticated;

drop policy if exists "votos: ver lo propio" on public.community_food_votes;
create policy "votos: ver lo propio" on public.community_food_votes for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "votos: votar" on public.community_food_votes;
create policy "votos: votar" on public.community_food_votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.community_foods f where f.id = food_id and f.user_id is distinct from (select auth.uid()))
  );
drop policy if exists "votos: cambiar mi voto" on public.community_food_votes;
create policy "votos: cambiar mi voto" on public.community_food_votes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop trigger if exists community_food_votes_updated_at on public.community_food_votes;
create trigger community_food_votes_updated_at before insert or update on public.community_food_votes
  for each row execute function public.set_updated_at();

-- Recuenta los votos del alimento y decide su estado.
create or replace function public.recontar_votos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  alimento uuid := coalesce(new.food_id, old.food_id);
  desde timestamptz;
  si integer;
  no integer;
begin
  select valores_at into desde from public.community_foods where id = alimento;
  select count(*) filter (where voto = 'confirma'), count(*) filter (where voto = 'reporta')
    into si, no
    from public.community_food_votes
    where food_id = alimento and deleted_at is null and updated_at >= desde;
  perform set_config('kaibu.recuento', '1', true);
  update public.community_foods
    set confirmaciones = si,
        reportes = no,
        estado = case when no >= 3 and no > si then 'oculto' when si >= 2 then 'verificado' else 'nuevo' end
    where id = alimento;
  perform set_config('kaibu.recuento', '', true);
  return null;
end;
$$;
revoke all on function public.recontar_votos() from public, anon, authenticated;

drop trigger if exists community_food_votes_recontar on public.community_food_votes;
create trigger community_food_votes_recontar after insert or update or delete on public.community_food_votes
  for each row execute function public.recontar_votos();

-- 4. Beta cerrada: sin acceso no se aporta ni se vota ------------------------
do $$
declare
  t text;
begin
  foreach t in array array['community_foods', 'community_food_votes']
  loop
    execute format('drop policy if exists "%1$s: beta cerrada (crear)" on public.%1$I', t);
    execute format('drop policy if exists "%1$s: beta cerrada (editar)" on public.%1$I', t);
    execute format('create policy "%1$s: beta cerrada (crear)" on public.%1$I as restrictive for insert to authenticated with check (public.puede_usar_kaibu())', t);
    execute format('create policy "%1$s: beta cerrada (editar)" on public.%1$I as restrictive for update to authenticated using (public.puede_usar_kaibu())', t);
  end loop;
end $$;
