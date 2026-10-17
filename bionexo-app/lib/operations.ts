"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/data";

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    kind: String(row.kind) as Order["kind"],
    product: String(row.product),
    t: Number(row.quantity_tons),
    from: String(row.origin_city),
    to: String(row.destination_city),
    buyer: String(row.buyer_name),
    seller: String(row.seller_name),
    carrier: String(row.carrier_name ?? ""),
    st: Number(row.status_step),
    eta: String(row.eta ?? ""),
    value: Number(row.value_usd),
    buyerId: typeof row.buyer_id === "string" ? row.buyer_id : null,
    sellerId: typeof row.seller_id === "string" ? row.seller_id : null,
    carrierId: typeof row.carrier_id === "string" ? row.carrier_id : null,
    contractId: typeof row.contract_id === "string" ? row.contract_id : null,
  };
}

export async function listarOperacionesTransporte(): Promise<Order[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => mapOrder(row as Record<string, unknown>));
}

export async function tomarOperacion(orderId: string): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Sin conexión." };
  const { error } = await supabase.rpc("tomar_operacion_transporte", { p_order_id: orderId });
  return error ? { ok: false, message: error.message } : { ok: true, message: "Operación asignada a tu empresa." };
}

export async function avanzarOperacion(orderId: string): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Sin conexión." };
  const { error } = await supabase.rpc("avanzar_operacion_transporte", { p_order_id: orderId });
  return error ? { ok: false, message: error.message } : { ok: true, message: "Estado logístico actualizado." };
}
