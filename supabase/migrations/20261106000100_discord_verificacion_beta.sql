-- =====================================================================
-- Kaibu · Discord: verificación al entrar y postulaciones a beta tester
-- 1. Nuevos IDs en la configuración del servidor (rol Miembro, rol Equipo y canales).
-- 2. discord_beta_applications: postulaciones con su estado (solo las usa el bot).
-- Se puede ejecutar más de una vez sin errores.
-- =====================================================================

alter table public.discord_guild_config
  add column if not exists miembro_role_id text,
  add column if not exists equipo_role_id text,
  add column if not exists verificacion_channel_id text,
  add column if not exists postulaciones_channel_id text,
  add column if not exists cupo_beta integer not null default 20;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'discord_guild_config_cupo_check') then
    alter table public.discord_guild_config add constraint discord_guild_config_cupo_check check (cupo_beta between 0 and 10000);
  end if;
end $$;

create table if not exists public.discord_beta_applications (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null check (guild_id ~ '^[0-9]{15,22}$'),
  discord_user_id text not null check (discord_user_id ~ '^[0-9]{15,22}$'),
  discord_tag text not null check (char_length(discord_tag) between 1 and 100),
  -- Respuestas del formulario
  dias_por_semana text not null check (char_length(dias_por_semana) between 1 and 60),
  dispositivo text not null check (char_length(dispositivo) between 1 and 60),
  objetivo_gym text not null check (char_length(objetivo_gym) between 1 and 200),
  registro_actual text not null check (char_length(registro_actual) between 1 and 200),
  motivo text not null check (char_length(motivo) between 10 and 600),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  revisado_por text check (revisado_por is null or revisado_por ~ '^[0-9]{15,22}$'),
  revisado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Una postulación por persona y servidor (si la rechazan, puede volver a postular y se reemplaza).
  unique (guild_id, discord_user_id)
);
create index if not exists discord_beta_applications_estado_idx on public.discord_beta_applications (guild_id, estado);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'discord_beta_applications_updated_at') then
    create trigger discord_beta_applications_updated_at before insert or update on public.discord_beta_applications
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- Solo el bot (service_role) la usa: nadie más puede leerla ni escribirla.
alter table public.discord_beta_applications enable row level security;
revoke all on public.discord_beta_applications from anon, authenticated;
