-- =====================================================================
-- Kaibu · Etapa 1 · Esquema base
-- Cada usuario solo puede leer y escribir SUS datos (Row Level Security).
-- El catálogo de alimentos es de solo lectura para todos.
-- Los registros usan "borrado suave" (deleted_at) para sincronizar entre
-- dispositivos sin perder borrados hechos sin conexión.
-- =====================================================================

-- Marca updated_at con la hora del servidor en cada cambio.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Perfil (datos físicos, objetivo, fase y preferencias)
-- ---------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '' check (char_length(nombre) <= 60),
  sexo text check (sexo in ('hombre', 'mujer')),
  fecha_nacimiento date check (fecha_nacimiento > date '1900-01-01'),
  estatura_cm numeric(5, 1) check (estatura_cm between 100 and 250),
  actividad text check (actividad in ('sedentario', 'ligero', 'activo')),
  dias_entrenamiento smallint check (dias_entrenamiento between 0 and 7),
  objetivo text check (objetivo in ('perder', 'mantener', 'ganar')),
  velocidad text check (velocidad in ('lenta', 'recomendada', 'rapida')),
  peso_inicial numeric(5, 2) check (peso_inicial between 25 and 350),
  peso_meta numeric(5, 2) check (peso_meta between 25 and 350),
  num_comidas smallint check (num_comidas in (3, 4)),
  colaciones boolean not null default false,
  comidas jsonb not null default '[]'::jsonb check (jsonb_typeof(comidas) = 'array'),
  kcal_manual integer check (kcal_manual is null or kcal_manual between 800 and 6000),
  proteina_gkg numeric(3, 1) check (proteina_gkg is null or proteina_gkg between 1.6 and 2.4),
  agua_meta_ml integer check (agua_meta_ml is null or agua_meta_ml between 500 and 8000),
  tema text not null default 'sistema' check (tema in ('claro', 'oscuro', 'sistema')),
  fase_inicio date,
  onboarding_completo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------------------------------------------------------------------
-- Consentimientos (historial: términos y datos de salud, con versión)
-- ---------------------------------------------------------------------
create table public.consents (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('terminos', 'datos_salud')),
  version text not null check (char_length(version) <= 20),
  aceptado_en timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index consents_user_idx on public.consents (user_id, updated_at);

-- ---------------------------------------------------------------------
-- Catálogo inicial (compartido, solo lectura)
-- ---------------------------------------------------------------------
create table public.foods_catalog (
  id text primary key,
  nombre text not null,
  categoria text not null,
  kcal_100 numeric(6, 1) not null check (kcal_100 between 0 and 900),
  proteina_100 numeric(5, 1) not null check (proteina_100 between 0 and 100),
  carbos_100 numeric(5, 1) not null check (carbos_100 between 0 and 100),
  grasas_100 numeric(5, 1) not null check (grasas_100 between 0 and 100),
  porcion_nombre text,
  porcion_g numeric(6, 1) check (porcion_g > 0),
  alias text[] not null default '{}',
  fuente text not null
);

-- ---------------------------------------------------------------------
-- Mis alimentos (privados)
-- ---------------------------------------------------------------------
create table public.user_foods (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 120),
  marca text check (marca is null or char_length(marca) <= 80),
  kcal_100 numeric(6, 1) not null check (kcal_100 between 0 and 900),
  proteina_100 numeric(5, 1) not null check (proteina_100 between 0 and 100),
  carbos_100 numeric(5, 1) not null check (carbos_100 between 0 and 100),
  grasas_100 numeric(5, 1) not null check (grasas_100 between 0 and 100),
  porcion_nombre text check (porcion_nombre is null or char_length(porcion_nombre) <= 40),
  porcion_g numeric(6, 1) check (porcion_g is null or porcion_g between 0.1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint user_foods_macros_max check (proteina_100 + carbos_100 + grasas_100 <= 100.5)
);
create index user_foods_user_idx on public.user_foods (user_id, updated_at);

-- ---------------------------------------------------------------------
-- Registro de comidas
-- ---------------------------------------------------------------------
create table public.food_logs (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  comida text not null check (char_length(comida) between 1 and 40),
  nombre text not null check (char_length(nombre) between 1 and 120),
  origen text not null check (origen in ('catalogo', 'mio', 'rapido')),
  alimento_clave text check (alimento_clave is null or char_length(alimento_clave) <= 80),
  gramos numeric(7, 1) check (gramos is null or gramos between 0.1 and 5000),
  cantidad numeric(7, 2) not null default 1 check (cantidad > 0 and cantidad <= 1000),
  unidad text not null default 'g' check (char_length(unidad) <= 40),
  kcal integer not null check (kcal between 0 and 10000),
  proteina numeric(6, 1) not null default 0 check (proteina between 0 and 1000),
  carbos numeric(6, 1) not null default 0 check (carbos between 0 and 1000),
  grasas numeric(6, 1) not null default 0 check (grasas between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index food_logs_user_fecha_idx on public.food_logs (user_id, fecha);
create index food_logs_user_updated_idx on public.food_logs (user_id, updated_at);

-- ---------------------------------------------------------------------
-- Favoritos
-- ---------------------------------------------------------------------
create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  alimento_clave text not null check (char_length(alimento_clave) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, alimento_clave)
);
create index favorites_user_updated_idx on public.favorites (user_id, updated_at);

-- ---------------------------------------------------------------------
-- Peso (uno por día)
-- ---------------------------------------------------------------------
create table public.weights (
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  kg numeric(5, 2) not null check (kg between 25 and 350),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, fecha)
);
create index weights_user_updated_idx on public.weights (user_id, updated_at);

-- ---------------------------------------------------------------------
-- Triggers de updated_at
-- ---------------------------------------------------------------------
create trigger profiles_updated_at before insert or update on public.profiles
  for each row execute function public.set_updated_at();
create trigger consents_updated_at before insert or update on public.consents
  for each row execute function public.set_updated_at();
create trigger user_foods_updated_at before insert or update on public.user_foods
  for each row execute function public.set_updated_at();
create trigger food_logs_updated_at before insert or update on public.food_logs
  for each row execute function public.set_updated_at();
create trigger favorites_updated_at before insert or update on public.favorites
  for each row execute function public.set_updated_at();
create trigger weights_updated_at before insert or update on public.weights
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security: cada usuario solo ve y modifica lo suyo
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.foods_catalog enable row level security;
alter table public.user_foods enable row level security;
alter table public.food_logs enable row level security;
alter table public.favorites enable row level security;
alter table public.weights enable row level security;

-- Perfil
create policy "perfil: leer el propio" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "perfil: crear el propio" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "perfil: editar el propio" on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Consentimientos: se agregan y se leen; no se editan (queda el historial)
create policy "consentimientos: leer los propios" on public.consents
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "consentimientos: agregar los propios" on public.consents
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Catálogo: lectura para todos, sin políticas de escritura
create policy "catalogo: lectura publica" on public.foods_catalog
  for select to anon, authenticated using (true);

-- Tablas personales con lectura/escritura completa sobre lo propio
do $$
declare
  t text;
begin
  foreach t in array array['user_foods', 'food_logs', 'favorites', 'weights'] loop
    execute format('create policy "%1$s: leer lo propio" on public.%1$I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: crear lo propio" on public.%1$I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: editar lo propio" on public.%1$I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s: borrar lo propio" on public.%1$I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Perfil vacío automático al crear la cuenta (sin datos inventados)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Permisos mínimos (RLS sigue aplicando encima de estos permisos)
revoke all on public.foods_catalog from anon, authenticated;
grant select on public.foods_catalog to anon, authenticated;
revoke delete on public.profiles, public.consents from authenticated;
revoke update on public.consents from authenticated;
-- Sin sesión iniciada no hay acceso a tablas personales (defensa adicional a RLS)
revoke all on public.profiles, public.consents, public.user_foods, public.food_logs, public.favorites, public.weights from anon;
