-- =====================================================================
-- Kaibu · Ranking de invitaciones del Discord
-- 1. discord_invites: cada link de invitación que el bot crea (de un miembro o de una red social).
-- 2. discord_invite_joins: quién entró con qué link; cuenta solo si aceptó las reglas.
-- Solo el bot (service_role) lee y escribe. Se puede ejecutar más de una vez sin errores.
-- =====================================================================

create table if not exists public.discord_invites (
  code text primary key check (code ~ '^[A-Za-z0-9-]{2,32}$'),
  guild_id text not null check (guild_id ~ '^[0-9]{5,25}$'),
  -- Dueño del link (miembro que invita). Null en los links de redes sociales.
  discord_user_id text check (discord_user_id is null or discord_user_id ~ '^[0-9]{5,25}$'),
  -- Red social del link (TikTok, Instagram, YouTube). Null en los links personales.
  red text check (red is null or red in ('tiktok', 'instagram', 'youtube')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discord_user_id is not null or red is not null)
);
create unique index if not exists discord_invites_persona_idx on public.discord_invites (guild_id, discord_user_id) where discord_user_id is not null;

create table if not exists public.discord_invite_joins (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null check (guild_id ~ '^[0-9]{5,25}$'),
  member_id text not null check (member_id ~ '^[0-9]{5,25}$'),
  code text not null references public.discord_invites (code) on delete cascade,
  joined_at timestamptz not null default now(),
  -- Cuándo aceptó las reglas: recién ahí cuenta para el ranking.
  verificado_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (guild_id, member_id)
);
create index if not exists discord_invite_joins_ranking_idx on public.discord_invite_joins (guild_id, verificado_at) where verificado_at is not null;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'discord_invites_updated_at') then
    create trigger discord_invites_updated_at before insert or update on public.discord_invites
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'discord_invite_joins_updated_at') then
    create trigger discord_invite_joins_updated_at before insert or update on public.discord_invite_joins
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- Nadie las lee ni escribe desde la app: solo el bot con service_role.
alter table public.discord_invites enable row level security;
alter table public.discord_invite_joins enable row level security;
revoke all on public.discord_invites from anon, authenticated;
revoke all on public.discord_invite_joins from anon, authenticated;
