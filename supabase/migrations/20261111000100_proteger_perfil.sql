-- =====================================================================
-- Kaibu · Proteger el perfil completo
-- Un perfil con el cuestionario terminado nunca vuelve a quedar vacío.
-- Si un dispositivo intenta subir un perfil sin terminar encima de uno completo
-- (por ejemplo, un celular nuevo que aún no bajó los datos), se ignora el cambio
-- y se conserva el perfil. Como updated_at igual avanza (trigger profiles_updated_at,
-- que corre después por orden alfabético), ese dispositivo baja el perfil completo
-- en su próxima sincronización y se corrige solo.
-- Se puede ejecutar más de una vez sin errores.
-- =====================================================================

create or replace function public.proteger_perfil_completo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.onboarding_completo and not new.onboarding_completo and new.deleted_at is null then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_proteger_completo on public.profiles;
create trigger profiles_proteger_completo before update on public.profiles
  for each row execute function public.proteger_perfil_completo();
