-- BioNexo NEA: realtime del chat, conversaciones con empresas simuladas
-- y función segura para crear contratos con su calendario de entregas.

-- En la demo el comprador puede escribir a ofertas simuladas cuyo vendedor
-- todavía no tiene cuenta en la plataforma.
alter table public.conversations alter column seller_id drop not null;

-- Publicar tablas en Realtime (idempotente).
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.conversations;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
end;
$$;

-- Crea el contrato, genera el calendario de entregas y avisa a la otra parte.
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
  p_created_by uuid
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

  insert into public.contracts (
    conversation_id, buyer_id, seller_id, product, quantity_tons, unit_price,
    frequency, duration_months, start_date, terms, status, created_by
  ) values (
    p_conversation_id, p_buyer_id, p_seller_id, p_product, p_quantity_tons,
    p_unit_price, p_frequency, p_duration_months, p_start_date, p_terms,
    'borrador', p_created_by
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
    'Borrador de contrato de abastecimiento',
    p_product || ' · ' || p_quantity_tons || ' t · ' || p_duration_months || ' meses',
    '/contratos'
  );

  return v_id;
end;
$$;

revoke execute on function public.crear_contrato(uuid, uuid, uuid, text, numeric, numeric, text, integer, date, text, uuid) from public, anon;
grant execute on function public.crear_contrato(uuid, uuid, uuid, text, numeric, numeric, text, integer, date, text, uuid) to authenticated;
