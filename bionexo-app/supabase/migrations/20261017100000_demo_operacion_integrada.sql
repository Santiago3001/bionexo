-- Flujo demo real: contrato activo -> orden compartida -> transportista asignado.

alter table public.orders add column if not exists buyer_id uuid references public.profiles(id) on delete set null;
alter table public.orders add column if not exists seller_id uuid references public.profiles(id) on delete set null;
alter table public.orders add column if not exists carrier_id uuid references public.profiles(id) on delete set null;
alter table public.orders add column if not exists contract_id uuid references public.contracts(id) on delete set null;

create unique index if not exists orders_contract_uidx
  on public.orders (contract_id) where contract_id is not null;
create index if not exists orders_carrier_idx on public.orders (carrier_id, status_step, created_at desc);
create index if not exists orders_participants_idx on public.orders (buyer_id, seller_id, created_at desc);

drop policy if exists "orders_manage_own" on public.orders;
drop policy if exists "orders_participants_select" on public.orders;
create policy "orders_participants_select" on public.orders for select to authenticated
using (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
  or carrier_id = auth.uid()
  or (
    carrier_id is null
    and status_step = 0
    and public.current_user_has_role('transportista')
  )
);

create or replace function public.activar_contrato_y_crear_operacion(p_contract_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contract public.contracts%rowtype;
  v_buyer public.profiles%rowtype;
  v_seller public.profiles%rowtype;
  v_order_id text;
begin
  if auth.uid() is null then
    raise exception 'Sesión inválida';
  end if;

  select * into v_contract from public.contracts where id = p_contract_id for update;
  if not found then raise exception 'Contrato inexistente'; end if;
  if auth.uid() not in (v_contract.buyer_id, v_contract.seller_id) then
    raise exception 'Solo las partes pueden activar el contrato';
  end if;
  if v_contract.status = 'cancelado' then raise exception 'El contrato está cancelado'; end if;

  update public.contracts set status = 'activo' where id = p_contract_id;
  select * into v_buyer from public.profiles where id = v_contract.buyer_id;
  select * into v_seller from public.profiles where id = v_contract.seller_id;
  v_order_id := 'OP-' || upper(substr(replace(p_contract_id::text, '-', ''), 1, 10));

  insert into public.orders (
    id, created_by, kind, product, quantity_tons, origin_city, destination_city,
    buyer_name, seller_name, carrier_name, status_step, eta, value_usd,
    buyer_id, seller_id, carrier_id, contract_id
  ) values (
    v_order_id, auth.uid(), 'compra', v_contract.product, v_contract.quantity_tons,
    coalesce(nullif(v_seller.city, ''), 'Origen a coordinar'),
    coalesce(nullif(v_buyer.city, ''), 'Destino a coordinar'),
    coalesce(nullif(v_buyer.company_name, ''), v_buyer.full_name, 'Comprador'),
    coalesce(nullif(v_seller.company_name, ''), v_seller.full_name, 'Vendedor'),
    '', 0, 'A coordinar', v_contract.quantity_tons * v_contract.unit_price,
    v_contract.buyer_id, v_contract.seller_id, null, v_contract.id
  )
  on conflict (id) do nothing;

  insert into public.notifications (user_id, type, title, body, link)
  select id, 'sistema', 'Operación lista para transporte',
    v_contract.product || ' · ' || v_contract.quantity_tons || ' t · ' || v_order_id,
    '/transportista/mapa'
  from public.profiles where role = 'transportista';

  return v_order_id;
end;
$$;

create or replace function public.tomar_operacion_transporte(p_order_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_carrier public.profiles%rowtype;
  v_order public.orders%rowtype;
begin
  select * into v_carrier from public.profiles where id = auth.uid();
  if not found or v_carrier.role <> 'transportista' then
    raise exception 'Solo un transportista puede tomar la operación';
  end if;

  update public.orders
  set carrier_id = auth.uid(),
      carrier_name = coalesce(nullif(v_carrier.company_name, ''), v_carrier.full_name, 'Transportista'),
      status_step = 1,
      eta = 'A coordinar'
  where id = p_order_id and carrier_id is null and status_step = 0
  returning * into v_order;
  if not found then raise exception 'La operación ya fue tomada o no está disponible'; end if;

  insert into public.notifications (user_id, type, title, body, link)
  values
    (v_order.buyer_id, 'sistema', 'Transportista asignado', v_order.carrier_name || ' tomó ' || p_order_id, '/comprador/seguimiento'),
    (v_order.seller_id, 'sistema', 'Transportista asignado', v_order.carrier_name || ' tomó ' || p_order_id, '/vendedor/ventas');
end;
$$;

create or replace function public.avanzar_operacion_transporte(p_order_id text)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  update public.orders
  set status_step = least(status_step + 1, 4),
      eta = case when status_step + 1 >= 4 then 'Entregado' else eta end
  where id = p_order_id and carrier_id = auth.uid() and status_step < 4
  returning * into v_order;
  if not found then raise exception 'No podés avanzar esta operación'; end if;

  insert into public.notifications (user_id, type, title, body, link)
  values
    (v_order.buyer_id, 'sistema', 'Estado logístico actualizado', p_order_id || ' avanzó de estado', '/comprador/seguimiento'),
    (v_order.seller_id, 'sistema', 'Estado logístico actualizado', p_order_id || ' avanzó de estado', '/vendedor/ventas');
  return v_order.status_step;
end;
$$;

revoke execute on function public.activar_contrato_y_crear_operacion(uuid) from public, anon;
revoke execute on function public.tomar_operacion_transporte(text) from public, anon;
revoke execute on function public.avanzar_operacion_transporte(text) from public, anon;
grant execute on function public.activar_contrato_y_crear_operacion(uuid) to authenticated;
grant execute on function public.tomar_operacion_transporte(text) to authenticated;
grant execute on function public.avanzar_operacion_transporte(text) to authenticated;
