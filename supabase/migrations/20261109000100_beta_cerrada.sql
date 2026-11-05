-- =====================================================================
-- Kaibu · Beta cerrada
-- 1. app_ajustes: interruptor único "beta_cerrada" (al lanzar al público: update ... set beta_cerrada = false).
-- 2. beta_codes: códigos personales de un solo uso (los crea el bot al aprobar o con /codigo-beta).
-- 3. beta_access: cuentas con acceso. Las cuentas que ya existen quedan habilitadas (no se bloquea a nadie).
-- 4. Protección real: con la beta cerrada, la base no deja guardar datos a cuentas sin acceso.
-- Se puede ejecutar más de una vez sin errores.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Interruptor
-- ---------------------------------------------------------------------
create table if not exists public.app_ajustes (
  id boolean primary key default true check (id),
  beta_cerrada boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.app_ajustes (id) values (true) on conflict (id) do nothing;
alter table public.app_ajustes enable row level security;
revoke all on public.app_ajustes from anon, authenticated;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'app_ajustes_updated_at') then
    create trigger app_ajustes_updated_at before insert or update on public.app_ajustes
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- ¿La beta está cerrada? (la landing lo pregunta para mostrar "lista de espera" o "Empezar gratis").
create or replace function public.beta_cerrada()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select beta_cerrada from public.app_ajustes where id), true)
$$;
revoke all on function public.beta_cerrada() from public;
grant execute on function public.beta_cerrada() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 2. Códigos de beta (solo el bot los crea y los lee)
-- ---------------------------------------------------------------------
create table if not exists public.beta_codes (
  codigo text primary key check (codigo ~ '^[A-HJ-NP-Z2-9]{8}$'),
  discord_user_id text check (discord_user_id is null or discord_user_id ~ '^[0-9]{15,22}$'),
  nota text check (nota is null or char_length(nota) <= 120),
  creado_por text check (creado_por is null or creado_por ~ '^[0-9]{15,22}$'),
  usado_por uuid references auth.users (id) on delete set null,
  usado_at timestamptz,
  expira_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.beta_codes enable row level security;
revoke all on public.beta_codes from anon, authenticated;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'beta_codes_updated_at') then
    create trigger beta_codes_updated_at before insert or update on public.beta_codes
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 3. Cuentas con acceso
-- ---------------------------------------------------------------------
create table if not exists public.beta_access (
  user_id uuid primary key references auth.users (id) on delete cascade,
  origen text not null check (origen in ('existente', 'codigo', 'manual')),
  codigo text check (codigo is null or codigo ~ '^[A-HJ-NP-Z2-9]{8}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.beta_access enable row level security;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'beta_access_updated_at') then
    create trigger beta_access_updated_at before insert or update on public.beta_access
      for each row execute function public.set_updated_at();
  end if;
end $$;
drop policy if exists "beta_access: leer lo propio" on public.beta_access;
create policy "beta_access: leer lo propio" on public.beta_access
  for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.beta_access from anon, authenticated;
grant select on public.beta_access to authenticated;

-- Las cuentas que ya existen siguen funcionando igual.
insert into public.beta_access (user_id, origen)
  select id, 'existente' from auth.users
  on conflict (user_id) do nothing;

-- ¿Esta cuenta puede guardar datos? (beta abierta, o cuenta con acceso)
create or replace function public.puede_usar_kaibu()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not public.beta_cerrada()
    or exists (select 1 from public.beta_access where user_id = (select auth.uid()))
$$;
revoke all on function public.puede_usar_kaibu() from public, anon;
grant execute on function public.puede_usar_kaibu() to authenticated, service_role;

-- ¿Un código sirve? (para validar antes de crear la cuenta; no lo gasta)
create or replace function public.codigo_beta_valido(p_codigo text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.beta_codes
    where codigo = upper(trim(p_codigo)) and usado_por is null and (expira_at is null or expira_at > now())
  )
$$;
revoke all on function public.codigo_beta_valido(text) from public;
grant execute on function public.codigo_beta_valido(text) to anon, authenticated;

-- Canjear el código con la cuenta recién creada. Devuelve true si la cuenta queda con acceso.
create or replace function public.canjear_codigo_beta(p_codigo text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  yo uuid := auth.uid();
  limpio text := upper(trim(coalesce(p_codigo, '')));
  encontrado text;
begin
  if yo is null then
    raise exception 'Sin sesión' using errcode = '42501';
  end if;
  if exists (select 1 from public.beta_access where user_id = yo) then
    return true;
  end if;
  update public.beta_codes set usado_por = yo, usado_at = now()
    where codigo = limpio and usado_por is null and (expira_at is null or expira_at > now())
    returning codigo into encontrado;
  if encontrado is null then
    return false;
  end if;
  insert into public.beta_access (user_id, origen, codigo) values (yo, 'codigo', encontrado);
  return true;
end;
$$;
revoke all on function public.canjear_codigo_beta(text) from public, anon;
grant execute on function public.canjear_codigo_beta(text) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Protección: con la beta cerrada, sin acceso no se guarda nada (políticas "restrictive":
--    se suman a las de "lo propio"). Los consentimientos quedan libres: son el registro legal.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'user_foods', 'food_logs', 'favorites', 'weights', 'user_events', 'daily_entries', 'app_feedback']
  loop
    execute format('drop policy if exists "%1$s: beta cerrada (crear)" on public.%1$I', t);
    execute format('drop policy if exists "%1$s: beta cerrada (editar)" on public.%1$I', t);
    execute format('create policy "%1$s: beta cerrada (crear)" on public.%1$I as restrictive for insert to authenticated with check (public.puede_usar_kaibu())', t);
    execute format('create policy "%1$s: beta cerrada (editar)" on public.%1$I as restrictive for update to authenticated using (public.puede_usar_kaibu())', t);
  end loop;
end $$;
