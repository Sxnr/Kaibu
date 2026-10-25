-- Prueba de Row Level Security (se ejecuta sobre una base local con la simulación de Supabase).
-- Debe terminar con "RLS OK". Cualquier fallo detiene la ejecución.
\set ON_ERROR_STOP 1
begin;
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@ejemplo.cl'),
  ('22222222-2222-2222-2222-222222222222', 'b@ejemplo.cl');

-- El trigger creó un perfil vacío para cada usuario
do $$ begin
  assert (select count(*) from public.profiles) = 2, 'faltan perfiles automáticos';
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

insert into public.weights (user_id, fecha, kg) values ('11111111-1111-1111-1111-111111111111', '2026-10-24', 91.1);
insert into public.food_logs (id, user_id, fecha, comida, nombre, origen, kcal)
  values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2026-10-24', 'desayuno', 'Huevo', 'catalogo', 72);
update public.profiles set nombre = 'Ana' where user_id = '11111111-1111-1111-1111-111111111111';

-- Usuario A no puede escribir a nombre de B
do $$ begin
  begin
    insert into public.weights (user_id, fecha, kg) values ('22222222-2222-2222-2222-222222222222', '2026-10-24', 80);
    raise exception 'RLS falló: A escribió un peso de B';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Usuario A ve su perfil y no el de B
do $$ begin
  assert (select count(*) from public.profiles) = 1, 'A ve perfiles ajenos';
end $$;

-- El catálogo es de solo lectura
do $$ begin
  assert (select count(*) from public.foods_catalog) > 100, 'catálogo no visible';
  begin
    insert into public.foods_catalog (id, nombre, categoria, kcal_100, proteina_100, carbos_100, grasas_100, fuente)
      values ('x', 'x', 'x', 1, 0, 0, 0, 'x');
    raise exception 'RLS falló: se pudo escribir el catálogo';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Los consentimientos no se pueden editar
insert into public.consents (id, user_id, tipo, version)
  values ('cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'terminos', '2026-10-25');
do $$ begin
  begin
    update public.consents set version = 'otra';
    raise exception 'se pudo editar un consentimiento';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Validación del servidor: valores imposibles se rechazan
do $$ begin
  begin
    insert into public.weights (user_id, fecha, kg) values ('11111111-1111-1111-1111-111111111111', '2026-10-25', 400);
    raise exception 'se aceptó un peso imposible';
  exception when check_violation then null;
  end;
end $$;

-- Usuario B no ve nada de A
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
do $$ begin
  assert (select count(*) from public.weights) = 0, 'B ve pesos de A';
  assert (select count(*) from public.food_logs) = 0, 'B ve comidas de A';
  assert (select count(*) from public.consents) = 0, 'B ve consentimientos de A';
  assert (select nombre from public.profiles) = '', 'B ve el nombre de A';
end $$;
-- B intenta borrar el registro de A: no afecta filas
delete from public.food_logs where id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- Sin sesión (anon) no se ve nada personal
reset role;
set local role anon;
do $$ begin
  begin
    perform count(*) from public.weights;
    raise exception 'anon pudo leer pesos';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$ begin
  assert (select count(*) from public.food_logs) = 1, 'B borró un registro de A';
end $$;
select 'RLS OK' as resultado;
rollback;
