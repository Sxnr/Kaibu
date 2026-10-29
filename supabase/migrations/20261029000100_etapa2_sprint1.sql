-- =====================================================================
-- Kaibu · Etapa 2 · Sprint 1
-- user_events: eventos que deben ocurrir una sola vez (ajuste semanal,
--   avisos de seguridad, cambio de fase, día terminado, celebraciones).
-- waitlist: lista de espera de la landing (RF-67). Se puede inscribir
--   cualquiera con consentimiento, pero nadie puede leerla desde la app.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Eventos del usuario (uno por tipo y clave)
-- ---------------------------------------------------------------------
create table public.user_events (
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('ajuste_semanal', 'aviso_seguridad', 'cambio_fase', 'dia_terminado', 'celebracion')),
  clave text not null check (char_length(clave) between 1 and 80),
  valor text check (valor is null or char_length(valor) <= 40),
  fecha date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, tipo, clave),
  -- Un ajuste es un número de kcal razonable (semanal o paso de transición de fase) o "rechazado".
  constraint user_events_ajuste_valido check (
    tipo <> 'ajuste_semanal'
    or valor = 'rechazado'
    or (valor ~ '^-?[0-9]{1,4}$' and abs(valor::integer) <= 1500)
  )
);
create index user_events_user_updated_idx on public.user_events (user_id, updated_at);

create trigger user_events_updated_at before insert or update on public.user_events
  for each row execute function public.set_updated_at();

alter table public.user_events enable row level security;
create policy "user_events: leer lo propio" on public.user_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_events: crear lo propio" on public.user_events
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_events: editar lo propio" on public.user_events
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_events: borrar lo propio" on public.user_events
  for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.user_events from anon;

-- ---------------------------------------------------------------------
-- Lista de espera (RF-67)
-- ---------------------------------------------------------------------
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (
    char_length(email) between 6 and 254
    and email = lower(email)
    and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  consentimiento boolean not null check (consentimiento),
  version_consentimiento text not null check (char_length(version_consentimiento) between 1 and 20),
  token_baja uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  constraint waitlist_email_unico unique (email)
);

alter table public.waitlist enable row level security;
-- Solo se puede inscribir (con consentimiento). No hay políticas de lectura, edición ni borrado.
create policy "waitlist: inscribirse" on public.waitlist
  for insert to anon, authenticated with check (consentimiento);
revoke all on public.waitlist from anon, authenticated;
grant insert (email, consentimiento, version_consentimiento) on public.waitlist to anon, authenticated;

-- Darse de baja con el enlace del correo: borra la fila y no revela si existía.
create or replace function public.baja_lista_espera(token uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.waitlist where token_baja = token;
$$;
revoke all on function public.baja_lista_espera(uuid) from public;
grant execute on function public.baja_lista_espera(uuid) to anon, authenticated;
