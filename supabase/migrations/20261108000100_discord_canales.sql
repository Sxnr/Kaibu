-- =====================================================================
-- Kaibu · Discord reorganizado
-- IDs de los canales y roles nuevos (bienvenidas con banner, reglas, anuncios, Kaibu en redes,
-- preséntate, dato del día, desafío semanal, preguntas, Ping TikTok y Ping Lanzamiento)
-- y el estado del dato del día y del desafío semanal (para no repetirlos nunca).
-- Solo la usa el bot (service_role). Se puede ejecutar más de una vez sin errores.
-- =====================================================================

alter table public.discord_guild_config
  add column if not exists bienvenidas_channel_id text,
  add column if not exists reglas_channel_id text,
  add column if not exists anuncios_channel_id text,
  add column if not exists redes_channel_id text,
  add column if not exists presentate_channel_id text,
  add column if not exists dato_channel_id text,
  add column if not exists desafio_channel_id text,
  add column if not exists preguntas_channel_id text,
  add column if not exists tiktok_role_id text,
  add column if not exists lanzamiento_role_id text,
  -- Día (hora de Chile) del último dato publicado y lunes del último desafío abierto/cerrado.
  add column if not exists dato_publicado_el date,
  add column if not exists desafio_semana date,
  add column if not exists desafio_message_id text,
  add column if not exists desafio_cerrado_el date;

-- Validación: los IDs de Discord son números de 15 a 22 dígitos. "not valid" = solo filas nuevas o editadas.
do $$
declare
  c text;
begin
  foreach c in array array['bienvenidas_channel_id', 'reglas_channel_id', 'anuncios_channel_id', 'redes_channel_id',
    'presentate_channel_id', 'dato_channel_id', 'desafio_channel_id', 'preguntas_channel_id', 'tiktok_role_id',
    'lanzamiento_role_id', 'desafio_message_id']
  loop
    if not exists (select 1 from pg_constraint where conname = 'discord_guild_config_' || c || '_check') then
      execute format('alter table public.discord_guild_config add constraint %I check (%I is null or %I ~ ''^[0-9]{15,22}$'') not valid',
        'discord_guild_config_' || c || '_check', c, c);
    end if;
  end loop;
end $$;
