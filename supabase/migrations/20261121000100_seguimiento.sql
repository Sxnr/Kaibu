-- =====================================================================
-- Kaibu · 0.5.0 · Sprint 3: suplementos (RF-26), medidas (RF-35) y fotos de progreso (RF-34)
-- Las fotos se guardan en un bucket PRIVADO de Storage: cada persona solo ve su carpeta.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Suplementos y sus tomas
-- ---------------------------------------------------------------------
create table public.supplements (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 60),
  dosis text check (dosis is null or char_length(dosis) <= 40),
  hora text check (hora is null or hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  kcal integer not null default 0 check (kcal between 0 and 2000),
  proteina numeric(5, 1) not null default 0 check (proteina between 0 and 200),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index supplements_user_updated_idx on public.supplements (user_id, updated_at);

create table public.supplement_intakes (
  user_id uuid not null references auth.users (id) on delete cascade,
  supplement_id uuid not null references public.supplements (id) on delete cascade,
  fecha date not null,
  -- Comida que se anotó con sus kcal (si tiene), para quitarla al desmarcar.
  registro_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, supplement_id, fecha)
);
create index supplement_intakes_user_updated_idx on public.supplement_intakes (user_id, updated_at);

-- ---------------------------------------------------------------------
-- Medidas (una fila por día)
-- ---------------------------------------------------------------------
create table public.body_measurements (
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  cintura numeric(4, 1) check (cintura is null or cintura between 10 and 250),
  pecho numeric(4, 1) check (pecho is null or pecho between 10 and 250),
  brazo numeric(4, 1) check (brazo is null or brazo between 10 and 250),
  muslo numeric(4, 1) check (muslo is null or muslo between 10 and 250),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, fecha),
  constraint body_measurements_alguna check (num_nonnulls(cintura, pecho, brazo, muslo) >= 1)
);
create index body_measurements_user_updated_idx on public.body_measurements (user_id, updated_at);

-- ---------------------------------------------------------------------
-- Fotos de progreso (los datos aquí; la imagen en Storage, en "<user_id>/<id>.jpg")
-- ---------------------------------------------------------------------
create table public.progress_photos (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  peso_kg numeric(5, 2) check (peso_kg is null or peso_kg between 25 and 350),
  ruta text not null check (char_length(ruta) <= 120),
  ancho integer not null check (ancho between 1 and 4000),
  alto integer not null check (alto between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- La imagen siempre queda dentro de la carpeta de su dueño.
  constraint progress_photos_ruta_propia check (ruta = user_id::text || '/' || id::text || '.jpg')
);
create index progress_photos_user_updated_idx on public.progress_photos (user_id, updated_at);

-- ---------------------------------------------------------------------
-- updated_at, RLS ("lo propio") y beta cerrada, igual que el resto
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['supplements', 'supplement_intakes', 'body_measurements', 'progress_photos']
  loop
    execute format('create trigger %1$s_updated_at before insert or update on public.%1$I for each row execute function public.set_updated_at()', t);
    execute format('alter table public.%1$I enable row level security', t);
    execute format('create policy "%1$s: leer lo propio" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: crear lo propio" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: editar lo propio" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: borrar lo propio" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: beta cerrada (crear)" on public.%1$I as restrictive for insert to authenticated with check (public.puede_usar_kaibu())', t);
    execute format('create policy "%1$s: beta cerrada (editar)" on public.%1$I as restrictive for update to authenticated using (public.puede_usar_kaibu())', t);
    execute format('revoke all on public.%1$I from anon', t);
  end loop;
end $$;

-- Una toma solo puede apuntar a un suplemento propio.
create or replace function public.toma_de_suplemento_propio()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.supplements s where s.id = new.supplement_id and s.user_id = new.user_id) then
    raise exception 'El suplemento no es tuyo' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger supplement_intakes_propio before insert or update on public.supplement_intakes
  for each row execute function public.toma_de_suplemento_propio();

-- ---------------------------------------------------------------------
-- Storage: bucket privado "fotos-progreso" (máx. 2 MB por foto, solo JPEG).
-- Cada persona solo puede leer, subir y borrar dentro de su carpeta "<user_id>/".
-- (Se salta si no existe Storage, p. ej. en la prueba local de RLS.)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('fotos-progreso', 'fotos-progreso', false, 2097152, array['image/jpeg'])
      on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg'];
    execute $p$create policy "fotos-progreso: leer lo propio" on storage.objects for select to authenticated
      using (bucket_id = 'fotos-progreso' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
    execute $p$create policy "fotos-progreso: subir lo propio" on storage.objects for insert to authenticated
      with check (bucket_id = 'fotos-progreso' and (storage.foldername(name))[1] = (select auth.uid())::text and public.puede_usar_kaibu())$p$;
    execute $p$create policy "fotos-progreso: reemplazar lo propio" on storage.objects for update to authenticated
      using (bucket_id = 'fotos-progreso' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
    execute $p$create policy "fotos-progreso: borrar lo propio" on storage.objects for delete to authenticated
      using (bucket_id = 'fotos-progreso' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
  end if;
end $$;
