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

-- ---------------------------------------------------------------------
-- Etapa 2 · eventos del usuario
-- ---------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
insert into public.user_events (user_id, tipo, clave, valor, fecha)
  values ('11111111-1111-1111-1111-111111111111', 'ajuste_semanal', '2026-W44', '-150', '2026-11-02');
do $$ begin
  begin
    insert into public.user_events (user_id, tipo, clave, valor, fecha)
      values ('11111111-1111-1111-1111-111111111111', 'ajuste_semanal', '2026-W45', '-9000', '2026-11-09');
    raise exception 'se aceptó un ajuste imposible';
  exception when check_violation then null;
  end;
  begin
    insert into public.user_events (user_id, tipo, clave, fecha)
      values ('22222222-2222-2222-2222-222222222222', 'dia_terminado', '2026-11-02', '2026-11-02');
    raise exception 'RLS falló: A creó un evento de B';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
do $$ begin
  assert (select count(*) from public.user_events) = 0, 'B ve eventos de A';
end $$;

-- ---------------------------------------------------------------------
-- Etapa 2 · lista de espera: se inscribe cualquiera, nadie la lee
-- ---------------------------------------------------------------------
reset role;
set local role anon;
insert into public.waitlist (email, consentimiento, version_consentimiento) values ('persona@ejemplo.cl', true, '2026-10-29');
do $$ begin
  begin
    perform count(*) from public.waitlist;
    raise exception 'anon pudo leer la lista de espera';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.waitlist (email, consentimiento, version_consentimiento) values ('otra@ejemplo.cl', false, '2026-10-29');
    raise exception 'se inscribió alguien sin consentimiento';
  exception when check_violation or insufficient_privilege then null;
  end;
  begin
    insert into public.waitlist (email, consentimiento, version_consentimiento) values ('no-es-correo', true, '2026-10-29');
    raise exception 'se aceptó un correo inválido';
  exception when check_violation then null;
  end;
end $$;
reset role;
set local role authenticated;
do $$ begin
  begin
    perform count(*) from public.waitlist;
    raise exception 'un usuario pudo leer la lista de espera';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$ begin
  assert (select count(*) from public.waitlist) = 1, 'la inscripción no quedó guardada';
end $$;
-- Darse de baja con el token borra la inscripción
select public.baja_lista_espera(token_baja) from public.waitlist where email = 'persona@ejemplo.cl';
do $$ begin
  assert (select count(*) from public.waitlist) = 0, 'la baja no borró la inscripción';
end $$;

-- ---------------------------------------------------------------------
-- Etapa 2 · Sprint 2 · registro del día (agua y nota)
-- ---------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
insert into public.daily_entries (user_id, fecha, agua_ml, nota)
  values ('11111111-1111-1111-1111-111111111111', '2026-11-02', 750, 'Dormí poco');
do $$ begin
  assert (select vaso_ml from public.profiles) = 250, 'el vaso no parte en 250 ml';
  begin
    insert into public.daily_entries (user_id, fecha, agua_ml)
      values ('11111111-1111-1111-1111-111111111111', '2026-11-03', 20000);
    raise exception 'se aceptó una cantidad de agua imposible';
  exception when check_violation then null;
  end;
  begin
    insert into public.daily_entries (user_id, fecha, nota)
      values ('11111111-1111-1111-1111-111111111111', '2026-11-04', repeat('a', 1001));
    raise exception 'se aceptó una nota demasiado larga';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set vaso_ml = 5000;
    raise exception 'se aceptó un vaso imposible';
  exception when check_violation then null;
  end;
  begin
    insert into public.daily_entries (user_id, fecha, agua_ml)
      values ('22222222-2222-2222-2222-222222222222', '2026-11-02', 250);
    raise exception 'RLS falló: A anotó agua de B';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
insert into public.daily_entries (user_id, fecha, agua_ml)
  values ('22222222-2222-2222-2222-222222222222', '2026-11-02', 500);
do $$ begin
  assert (select count(*) from public.daily_entries) = 1, 'B ve el día de A';
end $$;

-- ---------------------------------------------------------------------
-- Comunidad de Discord: reportes desde la app, vincular cuenta y votos
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
insert into public.app_feedback (id, user_id, tipo, descripcion, plataforma, version_app)
  values ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'bug', 'La app se cerró al guardar mi almuerzo', 'Web en PC', '0.2.0-beta');
do $$ begin
  begin
    insert into public.app_feedback (id, user_id, tipo, descripcion, plataforma, version_app)
      values ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'bug', 'Reporte a nombre de otra persona', 'Web', '0.2.0-beta');
    raise exception 'RLS falló: A envió un reporte a nombre de B';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.app_feedback set estado = 'resuelto' where id = 'bbbbbbbb-0000-0000-0000-000000000001';
    raise exception 'un usuario pudo cambiar el estado de su reporte';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.app_feedback (id, user_id, tipo, descripcion, plataforma, version_app)
      values ('bbbbbbbb-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'sugerencia', 'Una sugerencia sin título', 'Web', '0.2.0-beta');
    raise exception 'se aceptó una sugerencia sin título';
  exception when check_violation then null;
  end;
  begin
    perform 1 from public.discord_guild_config;
    raise exception 'un usuario pudo leer la configuración del bot';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.discord_link_codes;
    raise exception 'un usuario pudo leer los códigos de vinculación';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.canjear_codigo_discord('AAAAAA', '123456789012345678', 'x');
    raise exception 'un usuario pudo canjear códigos (solo el bot)';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Límite de 10 envíos al día; volver a subir uno existente (sincronización) sí se permite.
insert into public.app_feedback (id, user_id, tipo, titulo, descripcion, plataforma, version_app)
  select ('bbbbbbbb-0000-0000-0000-0000000001' || lpad(n::text, 2, '0'))::uuid, '11111111-1111-1111-1111-111111111111',
    'sugerencia', 'Idea ' || n, 'Una sugerencia de prueba número ' || n, 'Web', '0.2.0-beta'
  from generate_series(1, 9) as n;
do $$ begin
  begin
    insert into public.app_feedback (id, user_id, tipo, descripcion, plataforma, version_app)
      values ('bbbbbbbb-0000-0000-0000-000000000099', '11111111-1111-1111-1111-111111111111', 'bug', 'El reporte número once del día', 'Web', '0.2.0-beta');
    raise exception 'se aceptó el envío número 11 del día';
  exception when check_violation then null;
  end;
end $$;
insert into public.app_feedback (id, user_id, tipo, descripcion, plataforma, version_app)
  values ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'bug', 'La app se cerró al guardar mi almuerzo (editado)', 'Web en PC', '0.2.0-beta')
  on conflict (id) do update set descripcion = excluded.descripcion;

-- Código de vinculación: lo crea la app, lo canjea el bot una sola vez.
select set_config('kaibu.codigo', public.crear_codigo_discord(), true);
reset role;
set local role service_role;
do $$ begin
  assert current_setting('kaibu.codigo') ~ '^[A-HJ-NP-Z2-9]{6}$', 'código con formato inválido';
  assert public.canjear_codigo_discord(lower(current_setting('kaibu.codigo')), '123456789012345678', 'ana')
    = '11111111-1111-1111-1111-111111111111', 'el bot no pudo canjear el código';
  assert public.canjear_codigo_discord(current_setting('kaibu.codigo'), '123456789012345679', 'otro') is null, 'el código sirvió dos veces';
  assert (select count(*) from public.discord_links) = 1, 'no quedó la vinculación';
  update public.app_feedback set estado = 'publicado', publicado_at = now() where id = 'bbbbbbbb-0000-0000-0000-000000000001';
end $$;

-- Votos atómicos
insert into public.discord_suggestions (id, user_id, user_tag, title, description)
  values ('cccccccc-0000-0000-0000-000000000001', '999', 'autor', 'Idea', 'Descripción de la idea');
do $$
declare
  r record;
begin
  select * into r from public.votar_sugerencia_discord('cccccccc-0000-0000-0000-000000000001', 'u1', true);
  assert r.a_favor = 1 and r.en_contra = 0, 'voto a favor no contó';
  select * into r from public.votar_sugerencia_discord('cccccccc-0000-0000-0000-000000000001', 'u1', true);
  assert r.a_favor = 0 and r.en_contra = 0, 'segundo toque no quitó el voto';
  perform public.votar_sugerencia_discord('cccccccc-0000-0000-0000-000000000001', 'u1', true);
  perform public.votar_sugerencia_discord('cccccccc-0000-0000-0000-000000000001', 'u2', false);
  select * into r from public.votar_sugerencia_discord('cccccccc-0000-0000-0000-000000000001', 'u1', false);
  assert r.a_favor = 0 and r.en_contra = 2, 'cambiar el voto no movió el voto';
  begin
    insert into public.discord_suggestions (user_id, user_tag, title, description, status)
      values ('999', 'autor', 'Otra', 'Descripción', 'inventado');
    raise exception 'se aceptó un estado de sugerencia inválido';
  exception when check_violation then null;
  end;
end $$;

-- La racha la informa la persona vinculada; B no ve lo de A.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select public.actualizar_racha_discord(12);
do $$ begin
  assert (select racha from public.discord_links) = 12, 'no se guardó la racha';
  assert (select estado from public.app_feedback where id = 'bbbbbbbb-0000-0000-0000-000000000001') = 'publicado', 'A no ve el estado de su reporte';
  begin
    insert into public.discord_links (user_id, discord_user_id) values ('11111111-1111-1111-1111-111111111111', '223456789012345678');
    raise exception 'un usuario pudo vincularse sin el bot';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------------------------------------------------------------------
-- Comunidad conectada: preferencias, publicar mi semana y actividad (solo el bot)
-- ---------------------------------------------------------------------
update public.discord_links set recordatorio = true, celebrar_rachas = true, avisos_dm = false;
do $$
declare
  id_semana uuid;
begin
  assert (select recordatorio and celebrar_rachas and not avisos_dm from public.discord_links), 'A no pudo cambiar sus preferencias';
  begin
    update public.discord_links set racha = 999;
    raise exception 'un usuario pudo cambiar su racha directo (solo con la función)';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.discord_links set recordado_el = current_date;
    raise exception 'un usuario pudo cambiar la fecha del recordatorio (la escribe el bot)';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.publicar_semana_discord('semana', 4, 4, 5, 2, 12);
    raise exception 'se aceptó una semana con más días en rango que días';
  exception when check_violation then null;
  end;
  id_semana := public.publicar_semana_discord('semana', 4, 7, 3, 2, 12);
  assert id_semana is not null, 'no se pudo publicar la semana';
  perform public.publicar_semana_discord('mes', 20, 30, 15, 12, 12, -2.4, 68.5);
  perform public.publicar_semana_discord('semana', 4, 7, 3, 2, 12);
  begin
    perform public.publicar_semana_discord('semana', 4, 7, 3, 2, 12);
    raise exception 'se aceptó la cuarta publicación del día';
  exception when check_violation then null;
  end;
  begin
    perform 1 from public.discord_week_shares;
    raise exception 'un usuario pudo leer la tabla de publicaciones';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.actividad_discord();
    raise exception 'un usuario pudo leer la actividad (solo el bot)';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
do $$ begin
  update public.discord_links set recordatorio = false;
  begin
    perform public.publicar_semana_discord('semana', 1, 7, 1, 1, 1);
    raise exception 'B publicó su semana sin tener Discord vinculado';
  exception when no_data_found then null;
  end;
end $$;
reset role;
set local role service_role;
do $$
declare
  r record;
begin
  assert (select recordatorio from public.discord_links) = true, 'B cambió las preferencias de A';
  select * into r from public.actividad_discord();
  assert r.discord_user_id = '123456789012345678', 'la actividad no trae a la persona vinculada';
  assert r.ultimo_registro = date '2026-10-24' and r.anoto_hoy = false, 'la actividad calculó mal el último registro';
  assert (select count(*) from public.discord_week_shares where publicado_at is null) = 3, 'el bot no ve las publicaciones pendientes';
  update public.discord_links set recordado_el = current_date;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
do $$ begin
  assert (select count(*) from public.discord_links) = 0, 'B ve la vinculación de A';
  assert (select count(*) from public.app_feedback) = 0, 'B ve los reportes de A';
end $$;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
delete from public.discord_links;
do $$ begin
  assert (select count(*) from public.discord_links) = 0, 'A no pudo desvincularse';
end $$;

-- ---------------------------------------------------------------------
-- Discord: postulaciones a beta tester (solo el bot)
-- ---------------------------------------------------------------------
do $$ begin
  begin
    perform 1 from public.discord_beta_applications;
    raise exception 'un usuario pudo leer las postulaciones a beta';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set local role service_role;
insert into public.discord_beta_applications (guild_id, discord_user_id, discord_tag, dias_por_semana, dispositivo, objetivo_gym, registro_actual, motivo)
  values ('123456789012345678', '223456789012345678', 'ana', '5 o más', 'Android', 'Bajar grasa, gym del barrio', 'MyFitnessPal', 'Quiero ayudar a mejorar la app');
do $$ begin
  begin
    insert into public.discord_beta_applications (guild_id, discord_user_id, discord_tag, dias_por_semana, dispositivo, objetivo_gym, registro_actual, motivo)
      values ('123456789012345678', '223456789012345678', 'ana', '5', 'Android', 'Bajar', 'Nada', 'Postulación repetida');
    raise exception 'se aceptaron dos postulaciones de la misma persona';
  exception when unique_violation then null;
  end;
  begin
    update public.discord_beta_applications set estado = 'inventado';
    raise exception 'se aceptó un estado de postulación inválido';
  exception when check_violation then null;
  end;
  begin
    update public.discord_beta_applications set seguimiento_dia = 5;
    raise exception 'se aceptó un día de seguimiento inválido';
  exception when check_violation then null;
  end;
  update public.discord_beta_applications set seguimiento_dia = 7;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

-- ---------------------------------------------------------------------
-- Etapa 2 · Sprint 2 · borrar mi cuenta: solo la propia, con todos sus datos
-- ---------------------------------------------------------------------
reset role;
set local role anon;
do $$ begin
  begin
    perform public.borrar_mi_cuenta();
    raise exception 'anon pudo llamar borrar_mi_cuenta';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select public.borrar_mi_cuenta();
reset role;
do $$ begin
  assert not exists (select 1 from auth.users where id = '22222222-2222-2222-2222-222222222222'), 'la cuenta de B no se borró';
  assert not exists (select 1 from public.profiles where user_id = '22222222-2222-2222-2222-222222222222'), 'quedó el perfil de B';
  assert not exists (select 1 from public.daily_entries where user_id = '22222222-2222-2222-2222-222222222222'), 'quedaron días de B';
  assert exists (select 1 from auth.users where id = '11111111-1111-1111-1111-111111111111'), 'se borró la cuenta de A';
  assert (select count(*) from public.daily_entries where user_id = '11111111-1111-1111-1111-111111111111') = 1, 'se borraron datos de A';
end $$;

select 'RLS OK' as resultado;
rollback;
