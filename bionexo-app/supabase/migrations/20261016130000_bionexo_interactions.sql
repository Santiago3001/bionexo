-- BioNexo NEA: chat comercial, notificaciones, contratos, entregas y rutas tomadas.
-- Ejecutar desde Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ============================================================
-- 1. CONVERSACIONES (hilo por oferta y comprador)
-- ============================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  offer_id bigint references public.offers(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'abierta' check (status in ('abierta', 'acordada', 'cerrada')),
  proposal jsonb,
  proposed_by uuid references public.profiles(id) on delete set null,
  buyer_confirmed_at timestamptz,
  seller_confirmed_at timestamptz,
  agreed_status text not null default 'sin_propuesta'
    check (agreed_status in ('sin_propuesta', 'propuesto', 'acordado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists conversations_offer_buyer_uidx
  on public.conversations (offer_id, buyer_id) where offer_id is not null;

create index if not exists conversations_buyer_idx on public.conversations (buyer_id, updated_at desc);
create index if not exists conversations_seller_idx on public.conversations (seller_id, updated_at desc);

-- ============================================================
-- 2. MENSAJES (inmutables: sin políticas de update/delete)
-- ============================================================
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  attachment_name text,
  created_at timestamptz not null default now()
);

create index if not exists messages_thread_idx on public.messages (conversation_id, created_at);

-- ============================================================
-- 3. NOTIFICACIONES (se crean por trigger, solo lectura del dueño)
-- ============================================================
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('mensaje', 'contrato', 'entrega', 'sistema')),
  title text not null,
  body text not null default '',
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, read, created_at desc);

-- ============================================================
-- 4. CONTRATOS DE ABASTECIMIENTO + CALENDARIO DE ENTREGAS
-- ============================================================
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete set null,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  product text not null,
  quantity_tons numeric(12,2) not null check (quantity_tons > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  frequency text not null default 'Mensual',
  duration_months integer not null default 12 check (duration_months between 1 and 60),
  start_date date not null default current_date,
  terms text not null default '',
  status text not null default 'borrador'
    check (status in ('borrador', 'activo', 'completado', 'cancelado')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contracts_buyer_idx on public.contracts (buyer_id, created_at desc);
create index if not exists contracts_seller_idx on public.contracts (seller_id, created_at desc);

create table if not exists public.contract_deliveries (
  id bigint generated always as identity primary key,
  contract_id uuid not null references public.contracts(id) on delete cascade,
  due_date date not null,
  quantity_tons numeric(12,2) not null check (quantity_tons > 0),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'entregada', 'retrasada', 'cancelada')),
  delivered_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (contract_id, due_date)
);

create index if not exists deliveries_contract_idx on public.contract_deliveries (contract_id, due_date);

-- ============================================================
-- 5. RUTAS DE TRANSPORTE: marca de "ruta tomada"
-- ============================================================
alter table public.transport_routes add column if not exists taken_by uuid references public.profiles(id) on delete set null;
alter table public.transport_routes add column if not exists taken_at timestamptz;

-- Una ruta puede estar publicada sin transportista asignado (cargas disponibles de la demo).
alter table public.transport_routes alter column carrier_id drop not null;

-- ============================================================
-- 6. TRIGGERS updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at before update on public.conversations
for each row execute function public.set_updated_at();

drop trigger if exists contracts_set_updated_at on public.contracts;
create trigger contracts_set_updated_at before update on public.contracts
for each row execute function public.set_updated_at();

-- ============================================================
-- 7. NOTIFICACIÓN AUTOMÁTICA AL LLEGAR UN MENSAJE
-- ============================================================
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
  author text;
  chat_subject text;
begin
  select case when c.buyer_id = new.sender_id then c.seller_id else c.buyer_id end,
         coalesce(p.full_name, 'Alguien'),
         coalesce(o.product, 'Consulta comercial')
  into target, author, chat_subject
  from public.conversations c
  left join public.profiles p on p.id = new.sender_id
  left join public.offers o on o.id = c.offer_id
  where c.id = new.conversation_id;

  if target is null or target = new.sender_id then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, link)
  values (
    target,
    'mensaje',
    'Nuevo mensaje de ' || author,
    left(new.body, 140),
    '/mensajes/' || new.conversation_id
  );
  return new;
end;
$$;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify after insert on public.messages
for each row execute function public.notify_new_message();

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_deliveries enable row level security;

-- Conversaciones: solo participantes
drop policy if exists "conversations_participants_select" on public.conversations;
create policy "conversations_participants_select" on public.conversations for select to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "conversations_create_own" on public.conversations;
create policy "conversations_create_own" on public.conversations for insert to authenticated
with check (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "conversations_update_participants" on public.conversations;
create policy "conversations_update_participants" on public.conversations for update to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid())
with check (buyer_id = auth.uid() or seller_id = auth.uid());

-- Mensajes: solo participantes del hilo; sin update ni delete (trazabilidad)
drop policy if exists "messages_participants_select" on public.messages;
create policy "messages_participants_select" on public.messages for select to authenticated
using (exists (
  select 1 from public.conversations c
  where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
));

drop policy if exists "messages_participants_insert" on public.messages;
create policy "messages_participants_insert" on public.messages for insert to authenticated
with check (
  sender_id = auth.uid() and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

-- Notificaciones: cada usuario ve y marca las suyas
drop policy if exists "notifications_read_own" on public.notifications;
create policy "notifications_read_own" on public.notifications for select to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Contratos: solo las partes
drop policy if exists "contracts_participants_select" on public.contracts;
create policy "contracts_participants_select" on public.contracts for select to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "contracts_create_participant" on public.contracts;
create policy "contracts_create_participant" on public.contracts for insert to authenticated
with check (created_by = auth.uid() and (buyer_id = auth.uid() or seller_id = auth.uid()));

drop policy if exists "contracts_update_participant" on public.contracts;
create policy "contracts_update_participant" on public.contracts for update to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid())
with check (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "contracts_delete_creator_draft" on public.contracts;
create policy "contracts_delete_creator_draft" on public.contracts for delete to authenticated
using (created_by = auth.uid() and status = 'borrador');

-- Entregas: solo las partes del contrato
drop policy if exists "deliveries_participants_select" on public.contract_deliveries;
create policy "deliveries_participants_select" on public.contract_deliveries for select to authenticated
using (exists (
  select 1 from public.contracts k
  where k.id = contract_id and (k.buyer_id = auth.uid() or k.seller_id = auth.uid())
));

drop policy if exists "deliveries_participants_insert" on public.contract_deliveries;
create policy "deliveries_participants_insert" on public.contract_deliveries for insert to authenticated
with check (exists (
  select 1 from public.contracts k
  where k.id = contract_id and (k.buyer_id = auth.uid() or k.seller_id = auth.uid())
));

drop policy if exists "deliveries_participants_update" on public.contract_deliveries;
create policy "deliveries_participants_update" on public.contract_deliveries for update to authenticated
using (exists (
  select 1 from public.contracts k
  where k.id = contract_id and (k.buyer_id = auth.uid() or k.seller_id = auth.uid())
))
with check (exists (
  select 1 from public.contracts k
  where k.id = contract_id and (k.buyer_id = auth.uid() or k.seller_id = auth.uid())
));

-- Rutas de transporte: reserva por cualquier transportista autenticado
drop policy if exists "carriers_reserve_routes" on public.transport_routes;
create policy "carriers_reserve_routes" on public.transport_routes for update to authenticated
using (carrier_id = auth.uid() or taken_by is null or taken_by = auth.uid())
with check (carrier_id = auth.uid() or taken_by = auth.uid());

-- ============================================================
-- 9. DATOS SIMULADOS DE RUTAS (demo)
-- ============================================================
insert into public.transport_routes
  (carrier_id, vehicle_type, capacity_tons, origin_city, destination_city, available_date, route_type, price_per_km, status)
select null, v.vehicle_type, v.capacity_tons, v.origin_city, v.destination_city, current_date + v.days, v.route_type, v.price_per_km, 'available'
from (values
  ('Camión 20 t', 18, 'Resistencia', 'Corrientes', 0, 'retorno', 0.85),
  ('Camión 15 t', 13, 'Resistencia', 'Posadas', 1, 'planificada', 0.95),
  ('Semirremolque', 28, 'Corrientes', 'Resistencia', 1, 'retorno', 0.75),
  ('Camión 20 t', 16, 'Oberá', 'Resistencia', 2, 'planificada', 1.05),
  ('Camión 10 t', 9, 'Roque Sáenz Peña', 'Resistencia', 2, 'retorno', 0.9),
  ('Camión 20 t', 19, 'Posadas', 'Resistencia', 3, 'retorno', 0.8),
  ('Semirremolque', 26, 'Resistencia', 'Oberá', 3, 'planificada', 1.1),
  ('Camión 12 t', 11, 'Resistencia', 'Roque Sáenz Peña', 4, 'retorno', 0.88)
) as v(vehicle_type, capacity_tons, origin_city, destination_city, days, route_type, price_per_km);
