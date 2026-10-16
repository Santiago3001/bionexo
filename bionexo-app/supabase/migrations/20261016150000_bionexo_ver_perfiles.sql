-- BioNexo NEA: lectura segura de los datos públicos de otra empresa
-- (necesario para mostrar la contraparte en el chat y en los contratos).
-- Los perfiles propios ya se leen por RLS; esta función expone sólo los
-- campos de contacto comercial a usuarios autenticados.

create or replace function public.ver_perfiles(p_ids uuid[])
returns table (
  id uuid,
  full_name text,
  company_name text,
  city text,
  business_type text,
  role text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.company_name, p.city, p.business_type, p.role
  from public.profiles p
  where p.id = any (p_ids);
$$;

revoke execute on function public.ver_perfiles(uuid[]) from public, anon;
grant execute on function public.ver_perfiles(uuid[]) to authenticated;
