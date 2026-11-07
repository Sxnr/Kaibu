-- =====================================================================
-- Kaibu · Comunidad de Discord
-- 1. Tablas del bot (ya creadas a mano en Supabase): se dejan iguales y se agregan
--    columnas nuevas, validaciones y protección extra. No borra datos.
-- 2. app_feedback: reportes y sugerencias enviados desde la app.
-- 3. discord_links y discord_link_codes: vincular la cuenta de Kaibu con Discord.
-- 4. Funciones: código de vinculación y racha (app); canjear código y votar (solo el bot).
-- Se puede ejecutar más de una vez sin errores.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tablas del bot (en Supabase ya existen: "if not exists" no las toca)
-- ---------------------------------------------------------------------
create table if not exists public.discord_guild_config (
  guild_id text primary key,
  feedback_channel_id text,
  suggestions_channel_id text,
  bug_triage_channel_id text,
  survey_logs_channel_id text,
  general_channel_id text,
  progress_channel_id text,
  updates_role_id text,
  tester_role_id text,
  created_at timestamptz default now()
);
alter table public.discord_guild_config
  add column if not exists welcome_channel_id text,
  add column if not exists updates_channel_id text,
  add column if not exists roadmap_channel_id text,
  add column if not exists atleta_role_id text,
  add column if not exists racha7_role_id text,
  add column if not exists racha30_role_id text,
  add column if not exists invite_url text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.discord_bug_reports (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  user_tag text not null,
  platform text not null,
  offline_mode text not null,
  description text not null,
  status text default 'pendiente',
  github_issue_url text,
  created_at timestamptz default now()
);

create table if not exists public.discord_suggestions (
  id uuid default gen_random_uuid() primary key,
  message_id text unique,
  thread_id text,
  user_id text not null,
  user_tag text not null,
  title text not null,
  description text not null,
  status text default 'pendiente',
  upvotes text[] default '{}',
  downvotes text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists public.discord_beta_survey (
  user_id text primary key,
  user_tag text not null,
  would_pay boolean not null,
  favorite_feature text not null,
  comments text,
  updated_at timestamptz default now()
);
-- Encuesta nueva: precio justo en pesos y extras elegidos (ver documento Encuestas Kaibu).
alter table public.discord_beta_survey
  add column if not exists precio_justo integer;

-- ---------------------------------------------------------------------
-- 2. Reportes y sugerencias desde la app (se sincronizan como el resto de los datos)
-- ---------------------------------------------------------------------
create table if not exists public.app_feedback (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('bug', 'sugerencia')),
  titulo text check (titulo is null or char_length(titulo) between 3 and 100),
  descripcion text not null check (char_length(descripcion) between 10 and 1500),
  plataforma text not null check (char_length(plataforma) between 1 and 100),
  version_app text not null check (char_length(version_app) between 1 and 30),
  sin_conexion boolean not null default false,
  -- Lo cambia solo el bot (los usuarios no tienen permiso de escribir estas columnas).
  estado text not null default 'enviado'
    check (estado in ('enviado', 'publicado', 'en_sprint', 'resuelto', 'planificada', 'aprobada', 'fuera_alcance')),
  publicado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint app_feedback_sugerencia_con_titulo check (tipo = 'bug' or titulo is not null)
);
create index if not exists app_feedback_user_updated_idx on public.app_feedback (user_id, updated_at);
create index if not exists app_feedback_sin_publicar_idx on public.app_feedback (created_at) where publicado_at is null;

-- Enlace entre lo publicado en Discord y lo enviado desde la app.
alter table public.discord_bug_reports
  add column if not exists origen text not null default 'discord',
  add column if not exists app_feedback_id uuid unique references public.app_feedback (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();
alter table public.discord_suggestions
  add column if not exists origen text not null default 'discord',
  add column if not exists app_feedback_id uuid unique references public.app_feedback (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------
-- 3. Vincular Kaibu con Discord
-- ---------------------------------------------------------------------
create table if not exists public.discord_links (
  user_id uuid primary key references auth.users (id) on delete cascade,
  discord_user_id text not null unique check (discord_user_id ~ '^[0-9]{15,22}$'),
  discord_tag text check (discord_tag is null or char_length(discord_tag) <= 100),
  -- Días seguidos cumplidos (RN-16), informados por la app.
  racha integer not null default 0 check (racha between 0 and 3650),
  racha_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Código de un solo uso que la app muestra y la persona escribe en /vincular.
create table if not exists public.discord_link_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  codigo text not null unique check (codigo ~ '^[A-HJ-NP-Z2-9]{6}$'),
  expira_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Validaciones de las tablas del bot. "not valid" = aplica a filas nuevas,
-- sin fallar por filas antiguas que ya estén guardadas.
-- ---------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('discord_bug_reports', 'discord_bug_reports_status_check', $c$status in ('pendiente', 'en_sprint', 'resuelto')$c$),
      ('discord_bug_reports', 'discord_bug_reports_textos_check',
        $c$char_length(description) between 1 and 2000 and char_length(platform) between 1 and 100 and char_length(offline_mode) between 1 and 40 and char_length(user_tag) between 1 and 100$c$),
      ('discord_bug_reports', 'discord_bug_reports_origen_check', $c$origen in ('discord', 'app')$c$),
      ('discord_suggestions', 'discord_suggestions_status_check', $c$status in ('pendiente', 'en_srs', 'aprobada', 'fuera_alcance')$c$),
      ('discord_suggestions', 'discord_suggestions_textos_check',
        $c$char_length(title) between 1 and 100 and char_length(description) between 1 and 2000 and char_length(user_tag) between 1 and 100$c$),
      ('discord_suggestions', 'discord_suggestions_origen_check', $c$origen in ('discord', 'app')$c$),
      ('discord_beta_survey', 'discord_beta_survey_textos_check',
        $c$char_length(favorite_feature) <= 300 and (comments is null or char_length(comments) <= 1000)$c$),
      ('discord_beta_survey', 'discord_beta_survey_precio_check', $c$precio_justo is null or precio_justo between 0 and 100000$c$)
    ) as v(tabla, nombre, regla)
  loop
    if not exists (select 1 from pg_constraint where conname = r.nombre) then
      execute format('alter table public.%I add constraint %I check (%s) not valid', r.tabla, r.nombre, r.regla);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['discord_guild_config', 'discord_bug_reports', 'discord_suggestions', 'discord_beta_survey', 'app_feedback', 'discord_links']
  loop
    if not exists (select 1 from pg_trigger where tgname = t || '_updated_at') then
      execute format('create trigger %I before insert or update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Seguridad (RLS). Las tablas del bot solo las usa el bot con service_role.
-- ---------------------------------------------------------------------
alter table public.discord_guild_config enable row level security;
alter table public.discord_bug_reports enable row level security;
alter table public.discord_suggestions enable row level security;
alter table public.discord_beta_survey enable row level security;
alter table public.discord_link_codes enable row level security;
alter table public.app_feedback enable row level security;
alter table public.discord_links enable row level security;
revoke all on public.discord_guild_config, public.discord_bug_reports, public.discord_suggestions,
  public.discord_beta_survey, public.discord_link_codes from anon, authenticated;

-- app_feedback: cada persona ve y crea lo suyo; el estado lo escribe solo el bot.
drop policy if exists "app_feedback: leer lo propio" on public.app_feedback;
drop policy if exists "app_feedback: crear lo propio" on public.app_feedback;
drop policy if exists "app_feedback: editar lo propio" on public.app_feedback;
create policy "app_feedback: leer lo propio" on public.app_feedback
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "app_feedback: crear lo propio" on public.app_feedback
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "app_feedback: editar lo propio" on public.app_feedback
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.app_feedback from anon, authenticated;
grant select on public.app_feedback to authenticated;
grant insert (id, user_id, tipo, titulo, descripcion, plataforma, version_app, sin_conexion, created_at, updated_at, deleted_at)
  on public.app_feedback to authenticated;
grant update (id, user_id, tipo, titulo, descripcion, plataforma, version_app, sin_conexion, created_at, updated_at, deleted_at)
  on public.app_feedback to authenticated;

-- Límite contra abusos: 10 envíos al día por persona (volver a subir uno existente no cuenta).
create or replace function public.app_feedback_limite()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.app_feedback where id = new.id) then
    return new;
  end if;
  if (select count(*) from public.app_feedback
      where user_id = new.user_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Límite de 10 reportes o sugerencias al día' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists app_feedback_limite on public.app_feedback;
create trigger app_feedback_limite before insert on public.app_feedback
  for each row execute function public.app_feedback_limite();

-- discord_links: cada persona ve y borra (desvincula) lo suyo; crearlo lo hace el bot.
drop policy if exists "discord_links: leer lo propio" on public.discord_links;
drop policy if exists "discord_links: desvincular lo propio" on public.discord_links;
create policy "discord_links: leer lo propio" on public.discord_links
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "discord_links: desvincular lo propio" on public.discord_links
  for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.discord_links from anon, authenticated;
grant select, delete on public.discord_links to authenticated;

-- ---------------------------------------------------------------------
-- 4. Funciones
-- ---------------------------------------------------------------------

-- La app pide un código de 6 caracteres, válido 10 minutos y de un solo uso.
create or replace function public.crear_codigo_discord()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  yo uuid := auth.uid();
  letras constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  nuevo text;
  intento int := 0;
begin
  if yo is null then
    raise exception 'Sin sesión' using errcode = '42501';
  end if;
  loop
    intento := intento + 1;
    bytes := uuid_send(gen_random_uuid());
    nuevo := '';
    for i in 0..5 loop
      nuevo := nuevo || substr(letras, (get_byte(bytes, i) % 32) + 1, 1);
    end loop;
    begin
      insert into public.discord_link_codes (user_id, codigo, expira_at)
        values (yo, nuevo, now() + interval '10 minutes')
        on conflict (user_id) do update set codigo = excluded.codigo, expira_at = excluded.expira_at, created_at = now();
      return nuevo;
    exception when unique_violation then
      if intento >= 5 then raise; end if;
    end;
  end loop;
end;
$$;
revoke all on function public.crear_codigo_discord() from public, anon;
grant execute on function public.crear_codigo_discord() to authenticated;

-- La app informa la racha (RN-16) para los roles 🔥 7+ y ⚡ 30+.
create or replace function public.actualizar_racha_discord(p_racha integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  yo uuid := auth.uid();
begin
  if yo is null then
    raise exception 'Sin sesión' using errcode = '42501';
  end if;
  update public.discord_links
    set racha = greatest(0, least(coalesce(p_racha, 0), 3650)), racha_at = now()
    where user_id = yo;
end;
$$;
revoke all on function public.actualizar_racha_discord(integer) from public, anon;
grant execute on function public.actualizar_racha_discord(integer) to authenticated;

-- El bot canjea el código de /vincular. Devuelve el usuario de Kaibu o null si no sirve.
create or replace function public.canjear_codigo_discord(p_codigo text, p_discord_user_id text, p_discord_tag text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  dueno uuid;
begin
  delete from public.discord_link_codes
    where codigo = upper(trim(p_codigo)) and expira_at > now()
    returning user_id into dueno;
  if dueno is null then
    return null;
  end if;
  -- Una cuenta de Discord se vincula con una sola cuenta de Kaibu.
  delete from public.discord_links where discord_user_id = p_discord_user_id and user_id <> dueno;
  insert into public.discord_links (user_id, discord_user_id, discord_tag)
    values (dueno, p_discord_user_id, left(p_discord_tag, 100))
    on conflict (user_id) do update set discord_user_id = excluded.discord_user_id, discord_tag = excluded.discord_tag;
  return dueno;
end;
$$;
revoke all on function public.canjear_codigo_discord(text, text, text) from public, anon, authenticated;

-- Voto atómico: dos personas votando al mismo tiempo ya no se pisan.
create or replace function public.votar_sugerencia_discord(p_sugerencia uuid, p_usuario text, p_a_favor boolean)
returns table (a_favor integer, en_contra integer)
language sql
security definer
set search_path = ''
as $$
  update public.discord_suggestions s set
    upvotes = case
      when not p_a_favor then array_remove(coalesce(s.upvotes, '{}'), p_usuario)
      when p_usuario = any (coalesce(s.upvotes, '{}')) then array_remove(s.upvotes, p_usuario)
      else array_append(coalesce(s.upvotes, '{}'), p_usuario) end,
    downvotes = case
      when p_a_favor then array_remove(coalesce(s.downvotes, '{}'), p_usuario)
      when p_usuario = any (coalesce(s.downvotes, '{}')) then array_remove(s.downvotes, p_usuario)
      else array_append(coalesce(s.downvotes, '{}'), p_usuario) end
  where s.id = p_sugerencia
  returning cardinality(s.upvotes), cardinality(s.downvotes);
$$;
revoke all on function public.votar_sugerencia_discord(uuid, text, boolean) from public, anon, authenticated;

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.canjear_codigo_discord(text, text, text) to service_role;
    grant execute on function public.votar_sugerencia_discord(uuid, text, boolean) to service_role;
  end if;
end $$;
