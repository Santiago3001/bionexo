"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Condiciones } from "@/lib/chat";

export type EstadoEntrega = "pendiente" | "entregada" | "retrasada" | "cancelada";
export type EstadoContrato = "borrador" | "activo" | "completado" | "cancelado";

export interface Entrega {
  id: number;
  dueDate: string;
  quantityTons: number;
  status: EstadoEntrega;
  deliveredAt: string | null;
  notes: string;
}

export interface Contrato {
  id: string;
  conversationId: string | null;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  product: string;
  quantityTons: number;
  unitPrice: number;
  frequency: string;
  durationMonths: number;
  startDate: string;
  terms: string;
  status: EstadoContrato;
  createdBy: string;
  createdAt: string;
  entregas: Entrega[];
  soyComprador: boolean;
}

interface ContratoRow {
  id: string;
  conversation_id: string | null;
  buyer_id: string;
  seller_id: string;
  product: string;
  quantity_tons: number;
  unit_price: number;
  frequency: string;
  duration_months: number;
  start_date: string;
  terms: string;
  status: EstadoContrato;
  created_by: string;
  created_at: string;
  contract_deliveries: {
    id: number;
    due_date: string;
    quantity_tons: number;
    status: EstadoEntrega;
    delivered_at: string | null;
    notes: string;
  }[] | null;
}

const SELECT_CONTRATOS =
  "id, conversation_id, buyer_id, seller_id, product, quantity_tons, unit_price, frequency, duration_months, start_date, terms, status, created_by, created_at, contract_deliveries(id, due_date, quantity_tons, status, delivered_at, notes)";

async function nombresDe(ids: string[]): Promise<Record<string, string>> {
  const supabase = getSupabaseBrowserClient();
  const mapa: Record<string, string> = {};
  if (!supabase || ids.length === 0) return mapa;
  const { data } = await supabase.rpc("ver_perfiles", { p_ids: ids });
  for (const fila of (data ?? []) as { id: string; full_name: string; company_name: string }[]) {
    mapa[fila.id] = fila.company_name || fila.full_name;
  }
  return mapa;
}

function mapearContrato(fila: ContratoRow, nombres: Record<string, string>, userId: string): Contrato {
  const entregas = (fila.contract_deliveries ?? [])
    .map<Entrega>((e) => ({
      id: e.id,
      dueDate: e.due_date,
      quantityTons: e.quantity_tons,
      status: e.status,
      deliveredAt: e.delivered_at,
      notes: e.notes,
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return {
    id: fila.id,
    conversationId: fila.conversation_id,
    buyerId: fila.buyer_id,
    sellerId: fila.seller_id,
    buyerName: nombres[fila.buyer_id] ?? "Comprador",
    sellerName: nombres[fila.seller_id] ?? "Vendedor",
    product: fila.product,
    quantityTons: fila.quantity_tons,
    unitPrice: fila.unit_price,
    frequency: fila.frequency,
    durationMonths: fila.duration_months,
    startDate: fila.start_date,
    terms: fila.terms,
    status: fila.status,
    createdBy: fila.created_by,
    createdAt: fila.created_at,
    entregas,
    soyComprador: fila.buyer_id === userId,
  };
}

export async function listarContratos(userId: string): Promise<Contrato[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("contracts")
    .select(SELECT_CONTRATOS)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  const filas = (data as unknown as ContratoRow[]) ?? [];
  const nombres = await nombresDe([...new Set(filas.flatMap((f) => [f.buyer_id, f.seller_id]))]);
  return filas.map((fila) => mapearContrato(fila, nombres, userId));
}

/** Crea el borrador de contrato y su calendario de entregas (función segura en BD). */
export async function crearContrato(
  conversacionId: string | null,
  buyerId: string,
  sellerId: string,
  producto: string,
  condiciones: Condiciones,
  userId: string,
): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Sin conexión." };

  const { error } = await supabase.rpc("crear_contrato", {
    p_conversation_id: conversacionId,
    p_buyer_id: buyerId,
    p_seller_id: sellerId,
    p_product: producto,
    p_quantity_tons: condiciones.quantityTons,
    p_unit_price: condiciones.unitPrice,
    p_frequency: condiciones.frequency,
    p_duration_months: condiciones.durationMonths,
    p_start_date: new Date().toISOString().slice(0, 10),
    p_terms: condiciones.terms,
    p_created_by: userId,
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Borrador de contrato generado con su calendario de entregas." };
}

export async function cambiarEstadoContrato(
  contractId: string,
  status: EstadoContrato,
): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Sin conexión." };
  const { error } = await supabase.from("contracts").update({ status }).eq("id", contractId);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: status === "activo" ? "Contrato activado." : "Estado actualizado." };
}

export async function marcarEntrega(entregaId: number): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Sin conexión." };
  const { error } = await supabase
    .from("contract_deliveries")
    .update({ status: "entregada", delivered_at: new Date().toISOString() })
    .eq("id", entregaId);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Entrega marcada como realizada." };
}

/**
 * Entregas de los próximos días que aún están pendientes (recordatorio local).
 * Se llama una vez por sesión desde el Shell; deja marcado en localStorage
 * que el aviso del día ya fue emitido.
 */
export async function recordatoriosDeEntregas(
  userId: string,
): Promise<{ title: string; body: string; id: number }[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const desde = new Date().toISOString().slice(0, 10);
  const hasta = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("contract_deliveries")
    .select("id, due_date, quantity_tons, status, contracts!inner(product, buyer_id, seller_id, status)")
    .gte("due_date", desde)
    .lte("due_date", hasta)
    .eq("status", "pendiente")
    .eq("contracts.status", "activo");

  if (!data) return [];

  const avisos: { title: string; body: string; id: number }[] = [];
  for (const fila of data as unknown as {
    id: number;
    due_date: string;
    quantity_tons: number;
    contracts: { product: string; buyer_id: string; seller_id: string };
  }[]) {
    const contrato = fila.contracts;
    if (contrato.buyer_id !== userId && contrato.seller_id !== userId) continue;
    avisos.push({
      id: fila.id,
      title: `Entrega próxima: ${contrato.product}`,
      body: `${fila.quantity_tons} t con vencimiento el ${fila.due_date}.`,
    });
  }
  return avisos;
}
