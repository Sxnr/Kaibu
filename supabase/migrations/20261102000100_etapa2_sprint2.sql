-- =====================================================================
-- Kaibu · Etapa 2 · Sprint 2
-- daily_entries: lo que se anota una vez por día (agua RF-25, nota RF-27).
-- profiles.vaso_ml: tamaño del vaso para sumar agua de un toque.
-- borrar_mi_cuenta(): borra la cuenta y, en cascada, todos sus datos (RF-46).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Registro del día (una fila por usuario y fecha)
-- ---------------------------------------------------------------------
create table public.daily_entries (
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  agua_ml integer not null default 0 check (agua_ml between 0 and 10000),
  nota text check (nota is null or char_length(nota) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, fecha)
);
create index daily_entries_user_updated_idx on public.daily_entries (user_id, updated_at);

create trigger daily_entries_updated_at before insert or update on public.daily_entries
  for each row execute function public.set_updated_at();

alter table public.daily_entries enable row level security;
create policy "daily_entries: leer lo propio" on public.daily_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily_entries: crear lo propio" on public.daily_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "daily_entries: editar lo propio" on public.daily_entries
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily_entries: borrar lo propio" on public.daily_entries
  for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.daily_entries from anon;

-- ---------------------------------------------------------------------
-- Tamaño del vaso (ml) para el botón "+ 1 vaso"
-- ---------------------------------------------------------------------
alter table public.profiles
  add column vaso_ml integer not null default 250 check (vaso_ml between 100 and 1000);

-- ---------------------------------------------------------------------
-- Borrar mi cuenta (RF-46): solo la propia; las tablas se borran en cascada.
-- ---------------------------------------------------------------------
create or replace function public.borrar_mi_cuenta()
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
  delete from auth.users where id = yo;
end;
$$;
revoke all on function public.borrar_mi_cuenta() from public, anon;
grant execute on function public.borrar_mi_cuenta() to authenticated;
