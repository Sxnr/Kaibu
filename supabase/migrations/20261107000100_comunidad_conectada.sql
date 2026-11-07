-- =====================================================================
-- Kaibu · Comunidad conectada (app ↔ Discord)
-- 1. Preferencias de la persona vinculada: recordatorio, celebrar rachas y avisos por mensaje.
-- 2. Publicar mi semana en #progreso: la app la pide con una función; el bot la publica.
-- 3. Seguimiento automático de beta testers y novedades automáticas (columnas del bot).
-- 4. actividad_discord(): el bot solo sabe SI anotaste y QUÉ DÍA (nunca qué comiste).
-- Se puede ejecutar más de una vez sin errores.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Preferencias en discord_links (la persona las cambia; el bot las lee)
-- ---------------------------------------------------------------------
alter table public.discord_links
  add column if not exists recordatorio boolean not null default false,
  add column if not exists celebrar_rachas boolean not null default false,
  add column if not exists avisos_dm boolean not null default true,
  -- Último día (hora de Chile) en que el bot mandó el recordatorio: nunca más de uno al día.
  add column if not exists recordado_el date;

drop policy if exists "discord_links: cambiar mis preferencias" on public.discord_links;
create policy "discord_links: cambiar mis preferencias" on public.discord_links
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- Solo estas 3 columnas: la racha, el usuario de Discord y lo demás no se pueden tocar desde la app.
grant update (recordatorio, celebrar_rachas, avisos_dm) on public.discord_links to authenticated;

-- ---------------------------------------------------------------------
-- 2. Publicaciones de "mi semana" en #progreso
-- ---------------------------------------------------------------------
create table if not exists public.discord_week_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  periodo text not null check (periodo in ('semana', 'mes')),
  dias_anotados integer not null check (dias_anotados between 0 and 31),
  dias_total integer not null check (dias_total between 1 and 31 and dias_anotados <= dias_total),
  dias_kcal integer not null check (dias_kcal between 0 and 31 and dias_kcal <= dias_total),
  dias_proteina integer not null check (dias_proteina between 0 and 31 and dias_proteina <= dias_total),
  racha integer not null check (racha between 0 and 3650),
  -- Avance de la fase (kg) y peso: solo si la persona lo activa en la app.
  kg_avanzados numeric(5, 1) check (kg_avanzados is null or kg_avanzados between -150 and 150),
  peso_kg numeric(5, 1) check (peso_kg is null or peso_kg between 20 and 400),
  publicado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists discord_week_shares_pendientes_idx on public.discord_week_shares (created_at) where publicado_at is null;
create index if not exists discord_week_shares_user_idx on public.discord_week_shares (user_id, created_at);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'discord_week_shares_updated_at') then
    create trigger discord_week_shares_updated_at before insert or update on public.discord_week_shares
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- Nadie la lee ni escribe directo: la app usa publicar_semana_discord() y el bot usa service_role.
alter table public.discord_week_shares enable row level security;
revoke all on public.discord_week_shares from anon, authenticated;

-- La app pide publicar su semana. Requiere cuenta vinculada; máximo 3 al día.
create or replace function public.publicar_semana_discord(
  p_periodo text,
  p_dias_anotados integer,
  p_dias_total integer,
  p_dias_kcal integer,
  p_dias_proteina integer,
  p_racha integer,
  p_kg_avanzados numeric default null,
  p_peso_kg numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  yo uuid := auth.uid();
  nueva uuid;
begin
  if yo is null then
    raise exception 'Sin sesión' using errcode = '42501';
  end if;
  if not exists (select 1 from public.discord_links where user_id = yo) then
    raise exception 'Vincula tu Discord primero' using errcode = 'P0002';
  end if;
  if (select count(*) from public.discord_week_shares where user_id = yo and created_at > now() - interval '1 day') >= 3 then
    raise exception 'Límite de 3 publicaciones al día' using errcode = '23514';
  end if;
  insert into public.discord_week_shares (user_id, periodo, dias_anotados, dias_total, dias_kcal, dias_proteina, racha, kg_avanzados, peso_kg)
    values (yo, p_periodo, p_dias_anotados, p_dias_total, p_dias_kcal, p_dias_proteina, p_racha, p_kg_avanzados, p_peso_kg)
    returning id into nueva;
  return nueva;
end;
$$;
revoke all on function public.publicar_semana_discord(text, integer, integer, integer, integer, integer, numeric, numeric) from public, anon;
grant execute on function public.publicar_semana_discord(text, integer, integer, integer, integer, integer, numeric, numeric) to authenticated;

-- ---------------------------------------------------------------------
-- 3. Columnas del bot: seguimiento de beta testers y novedades
-- ---------------------------------------------------------------------
alter table public.discord_beta_applications
  -- Último mensaje de seguimiento enviado (0 = ninguno; 1, 3, 7 o 14).
  add column if not exists seguimiento_dia integer not null default 0,
  -- Cuándo se avisó al equipo que esta persona lleva días sin anotar (una vez por racha de inactividad).
  add column if not exists aviso_inactivo_at timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'discord_beta_applications_seguimiento_check') then
    alter table public.discord_beta_applications add constraint discord_beta_applications_seguimiento_check
      check (seguimiento_dia in (0, 1, 3, 7, 14));
  end if;
end $$;

alter table public.discord_guild_config
  -- Última versión de Kaibu anunciada en #novedades (para no repetirla).
  add column if not exists version_anunciada text check (version_anunciada is null or char_length(version_anunciada) <= 40);

-- ---------------------------------------------------------------------
-- 4. Actividad (solo el bot): si la persona vinculada anotó hoy y su último día anotado
-- ---------------------------------------------------------------------
create or replace function public.actividad_discord()
returns table (discord_user_id text, ultimo_registro date, anoto_hoy boolean, recordatorio boolean, recordado_el date)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.discord_user_id,
    max(f.fecha) as ultimo_registro,
    coalesce(max(f.fecha) >= (now() at time zone 'America/Santiago')::date, false) as anoto_hoy,
    l.recordatorio,
    l.recordado_el
  from public.discord_links l
  left join public.food_logs f on f.user_id = l.user_id and f.deleted_at is null
  group by l.discord_user_id, l.recordatorio, l.recordado_el
$$;
revoke all on function public.actividad_discord() from public, anon, authenticated;
grant execute on function public.actividad_discord() to service_role;
