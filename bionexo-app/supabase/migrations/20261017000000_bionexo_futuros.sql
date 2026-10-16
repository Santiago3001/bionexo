-- BioNexo NEA: contratos a futuro / preventa de residuos.
-- Una arrocera puede publicar hoy 20 t disponibles en 6 meses y fijar precio con seña.

alter table public.offers
  add column if not exists offer_type text not null default 'spot'
    check (offer_type in ('spot', 'futuro'));
alter table public.offers
  add column if not exists available_from date not null default current_date;

alter table public.contracts
  add column if not exists contract_type text not null default 'spot'
    check (contract_type in ('spot', 'futuro'));
alter table public.contracts
  add column if not exists down_payment_pct numeric(5,2) not null default 0
    check (down_payment_pct >= 0 and down_payment_pct <= 100);
alter table public.contracts
  add column if not exists penalty_pct numeric(5,2) not null default 0
    check (penalty_pct >= 0 and penalty_pct <= 100);

create index if not exists offers_futuro_idx
  on public.offers (offer_type, available_from) where status = 'active';
create index if not exists contracts_futuro_idx
  on public.contracts (contract_type, start_date);

-- Nueva versión de crear_contrato con soporte futuro. Los 3 últimos
-- parámetros tienen default para no romper llamadas viejas (spot).
-- Se elimina la versión anterior de 11 args para evitar sobrecargas.
drop function if exists public.crear_contrato(uuid, uuid, uuid, text, numeric, numeric, text, integer, date, text, uuid);
create or replace function public.crear_contrato(
  p_conversation_id uuid,
  p_buyer_id uuid,
  p_seller_id uuid,
  p_product text,
  p_quantity_tons numeric,
  p_unit_price numeric,
  p_frequency text,
  p_duration_months integer,
  p_start_date date,
  p_terms text,
  p_created_by uuid,
  p_contract_type text default 'spot',
  p_down_payment_pct numeric default 0,
  p_penalty_pct numeric default 0
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_other uuid;
begin
  if auth.uid() is null or auth.uid() <> p_created_by then
    raise exception 'Sesión inválida';
  end if;

  if p_buyer_id is null or p_seller_id is null
     or (p_buyer_id <> auth.uid() and p_seller_id <> auth.uid()) then
    raise exception 'Solo las partes del acuerdo pueden preparar el contrato';
  end if;

  if p_quantity_tons <= 0 or p_unit_price < 0 or p_duration_months < 1 then
    raise exception 'Condiciones inválidas';
  end if;

  if p_contract_type not in ('spot', 'futuro') then
    raise exception 'Tipo de contrato inválido';
  end if;

  if p_down_payment_pct < 0 or p_down_payment_pct > 100
     or p_penalty_pct < 0 or p_penalty_pct > 100 then
    raise exception 'Seña o penalidad fuera de rango 0-100';
  end if;

  insert into public.contracts (
    conversation_id, buyer_id, seller_id, product, quantity_tons, unit_price,
    frequency, duration_months, start_date, terms, status, created_by,
    contract_type, down_payment_pct, penalty_pct
  ) values (
    p_conversation_id, p_buyer_id, p_seller_id, p_product, p_quantity_tons,
    p_unit_price, p_frequency, p_duration_months, p_start_date, p_terms,
    'borrador', p_created_by,
    p_contract_type, p_down_payment_pct, p_penalty_pct
  )
  returning id into v_id;

  insert into public.contract_deliveries (contract_id, due_date, quantity_tons)
  select v_id, (p_start_date + (n || ' month')::interval)::date, p_quantity_tons
  from generate_series(0, p_duration_months - 1) as n;

  v_other := case when auth.uid() = p_buyer_id then p_seller_id else p_buyer_id end;

  insert into public.notifications (user_id, type, title, body, link)
  values (
    v_other,
    'contrato',
    case when p_contract_type = 'futuro'
      then 'Borrador de contrato a futuro (preventa)'
      else 'Borrador de contrato de abastecimiento' end,
    p_product || ' · ' || p_quantity_tons || ' t · ' || p_duration_months
      || ' meses · inicio ' || p_start_date
      || case when p_contract_type = 'futuro'
        then ' · seña ' || p_down_payment_pct || '%' else '' end,
    '/contratos'
  );

  return v_id;
end;
$$;

revoke execute on function public.crear_contrato(uuid, uuid, uuid, text, numeric, numeric, text, integer, date, text, uuid, text, numeric, numeric) from public, anon;
grant execute on function public.crear_contrato(uuid, uuid, uuid, text, numeric, numeric, text, integer, date, text, uuid, text, numeric, numeric) to authenticated;
