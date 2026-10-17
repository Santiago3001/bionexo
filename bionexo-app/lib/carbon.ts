"use client";

/* ---------------------------------------------------------------------------
 * BioNexo Carbon — acceso a datos desde el navegador.
 *  - análisis ambientales guardados (trazabilidad del material)
 *  - acuerdos de reparto de beneficios entre comprador y vendedor
 *  - llamada al endpoint /api/carbon (IA con respaldo por reglas)
 * ------------------------------------------------------------------------ */

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { km, type CityName } from "@/lib/data";
import type { AnalisisCarbono } from "@/lib/carbon-core";

export type EstadoAcuerdoCarbon = "propuesto" | "aceptado" | "rechazado" | "archivado";

export interface AnalisisGuardado {
  id: number;
  offerId: number | null;
  product: string;
  tons: number;
  source: "reglas" | "ia";
  summary: string;
  pathway: string;
  co2Avoided: number | null;
  co2Stored: number | null;
  certificationLevel: string;
  createdAt: string;
}

export interface AcuerdoCarbon {
  id: number;
  conversationId: string | null;
  contractId: string | null;
  offerId: number | null;
  sellerId: string;
  buyerId: string;
  product: string;
  tons: number;
  sellerSharePct: number;
  buyerSharePct: number;
  status: EstadoAcuerdoCarbon;
  proposedBy: string;
  notes: string;
  createdAt: string;
  respondedAt: string | null;
}

interface AnalisisRow {
  id: number;
  offer_id: number | null;
  product: string;
  tons: string | number;
  source: string;
  summary: string;
  pathway: string;
  co2_avoided: string | number | null;
  co2_stored: string | number | null;
  certification_level: string;
  created_at: string;
}

interface AcuerdoRow {
  id: number;
  conversation_id: string | null;
  contract_id: string | null;
  offer_id: number | null;
  seller_id: string;
  buyer_id: string;
  product: string;
  tons: string | number;
  seller_share_pct: string | number;
  buyer_share_pct: string | number;
  status: string;
  proposed_by: string;
  notes: string;
  created_at: string;
  responded_at: string | null;
}

function numero(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function analisisFromRow(row: AnalisisRow): AnalisisGuardado {
  return {
    id: row.id,
    offerId: row.offer_id,
    product: row.product,
    tons: Number(row.tons ?? 0),
    source: row.source === "ia" ? "ia" : "reglas",
    summary: row.summary ?? "",
    pathway: row.pathway ?? "",
    co2Avoided: numero(row.co2_avoided),
    co2Stored: numero(row.co2_stored),
    certificationLevel: row.certification_level ?? "bajo",
    createdAt: row.created_at,
  };
}

function acuerdoFromRow(row: AcuerdoRow): AcuerdoCarbon {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    contractId: row.contract_id,
    offerId: row.offer_id,
    sellerId: row.seller_id,
    buyerId: row.buyer_id,
    product: row.product,
    tons: Number(row.tons ?? 0),
    sellerSharePct: Number(row.seller_share_pct ?? 50),
    buyerSharePct: Number(row.buyer_share_pct ?? 50),
    status: (row.status as EstadoAcuerdoCarbon) ?? "propuesto",
    proposedBy: row.proposed_by,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    respondedAt: row.responded_at,
  };
}

/* ------------------------- Análisis con IA / reglas --------------------- */

async function tokenDeSesion(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function solicitarAnalisis(
  ofertaId: number | null,
  ciudad: string,
  mensaje?: string,
): Promise<{ ok: boolean; analisis?: AnalisisCarbono; message: string; iaDisponible?: boolean }> {
  const token = await tokenDeSesion();
  if (!token) return { ok: false, message: "Necesitás iniciar sesión para analizar el material." };

  try {
    const res = await fetch("/api/carbon", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ offerId: ofertaId, ciudad, message: mensaje ?? "" }),
    });
    const cuerpo = (await res.json().catch(() => ({}))) as {
      analisis?: AnalisisCarbono;
      iaDisponible?: boolean;
      error?: string;
      message?: string;
    };
    if (!res.ok || !cuerpo.analisis) {
      return { ok: false, message: cuerpo.message ?? cuerpo.error ?? `Error ${res.status}` };
    }
    return {
      ok: true,
      analisis: cuerpo.analisis,
      message: cuerpo.message ?? "Análisis listo.",
      iaDisponible: cuerpo.iaDisponible ?? cuerpo.analisis.fuente === "ia",
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "No se pudo pedir el análisis." };
  }
}

/** Guarda el análisis en la base (trazabilidad del material). */
export async function guardarAnalisis(
  analisis: AnalisisCarbono,
  ofertaId: number | null,
  userId: string,
): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Supabase no está configurado." };

  const top = analisis.destinos.find((d) => (d.almacenamiento ?? 0) > 0) ?? analisis.destinos[0];
  const { error } = await supabase.from("carbon_analyses").insert({
    user_id: userId,
    offer_id: ofertaId,
    product: analisis.producto,
    tons: analisis.toneladas,
    source: analisis.fuente,
    model: analisis.model,
    summary: analisis.resumen,
    pathway: top?.destino ?? "",
    co2_avoided: null,
    co2_stored: analisis.almacenamientoBiochar ?? null,
    certification_level: analisis.certificacion.nivel,
    certification_requirements: analisis.certificacion.requisitos,
    destinations: analisis.destinos,
    warnings: analisis.advertencias,
  });

  if (error) return { ok: false, message: `No se pudo guardar: ${error.message}` };
  return { ok: true, message: "Análisis guardado en la trazabilidad del material." };
}

export async function listarAnalisis(userId: string): Promise<AnalisisGuardado[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("carbon_analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error || !data) return [];
  return (data as unknown as AnalisisRow[]).map(analisisFromRow);
}

/* ----------------------------- Acuerdos --------------------------------- */

export interface AcuerdoInput {
  conversationId: string | null;
  contractId?: string | null;
  offerId: number | null;
  sellerId: string;
  buyerId: string;
  product: string;
  tons: number;
  sellerSharePct: number;
  buyerSharePct: number;
  notes: string;
  proposedBy: string;
}

export async function proponerAcuerdo(
  input: AcuerdoInput,
): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Supabase no está configurado." };

  const { error } = await supabase.from("carbon_agreements").insert({
    conversation_id: input.conversationId,
    contract_id: input.contractId ?? null,
    offer_id: input.offerId,
    seller_id: input.sellerId,
    buyer_id: input.buyerId,
    product: input.product,
    tons: input.tons,
    seller_share_pct: input.sellerSharePct,
    buyer_share_pct: input.buyerSharePct,
    proposed_by: input.proposedBy,
    notes: input.notes,
  });

  if (error) return { ok: false, message: `No se pudo proponer: ${error.message}` };
  return { ok: true, message: "Propuesta de acuerdo registrada. La otra parte debe aceptarla." };
}

export async function responderAcuerdo(
  acuerdoId: number,
  aceptar: boolean,
): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Supabase no está configurado." };

  const { error } = await supabase
    .from("carbon_agreements")
    .update({ status: aceptar ? "aceptado" : "rechazado", responded_at: new Date().toISOString() })
    .eq("id", acuerdoId);

  if (error) return { ok: false, message: `No se pudo responder: ${error.message}` };
  return { ok: true, message: aceptar ? "Acuerdo aceptado." : "Acuerdo rechazado." };
}

export async function listarAcuerdos(userId: string): Promise<AcuerdoCarbon[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("carbon_agreements")
    .select("*")
    .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return (data as unknown as AcuerdoRow[]).map(acuerdoFromRow);
}

export async function listarAcuerdosDeConversacion(
  conversationId: string,
): Promise<AcuerdoCarbon[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("carbon_agreements")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as AcuerdoRow[]).map(acuerdoFromRow);
}

/** Realtime de acuerdos (tópico único por conversación o por usuario). */
export function suscribirseAAcuerdos(topico: string, filtro: string, onCambio: () => void): { close: () => void } {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { close: () => undefined };
  const canal = supabase
    .channel(topico)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "carbon_agreements", filter: filtro },
      onCambio,
    )
    .subscribe();
  return { close: () => void supabase.removeChannel(canal) };
}

/* ------------------------------ Utilidades ------------------------------ */

/** Nombres de contrapartes vía RPC ver_perfiles (ya existente). */
export async function cargarNombresCarbon(ids: string[]): Promise<Record<string, string>> {
  const supabase = getSupabaseBrowserClient();
  const unicos = [...new Set(ids.filter(Boolean))];
  if (!supabase || unicos.length === 0) return {};
  const { data } = await supabase.rpc("ver_perfiles", { p_ids: unicos });
  const mapa: Record<string, string> = {};
  for (const fila of (data ?? []) as { id: string; company_name?: string; full_name?: string }[]) {
    mapa[fila.id] = fila.company_name || fila.full_name || "Empresa";
  }
  return mapa;
}

export function distanciaDeCiudad(ciudadOrigen: string, ciudadOferta: string): number {
  return km(ciudadOrigen as CityName, ciudadOferta as CityName);
}
