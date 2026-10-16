"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface OfertaBase {
  id: number;
  ownerId: string | null;
  sellerName: string;
  product: string;
  city: string;
}

export interface Condiciones {
  quantityTons: number;
  unitPrice: number;
  frequency: string;
  durationMonths: number;
  terms: string;
  startDate?: string;
  contractType?: "spot" | "futuro";
  downPaymentPct?: number;
  penaltyPct?: number;
}

export type EstadoAcuerdo = "sin_propuesta" | "propuesto" | "acordado";

export interface Conversacion {
  id: string;
  offerId: number | null;
  product: string;
  sellerName: string;
  buyerId: string;
  sellerId: string | null;
  buyerName: string;
  sellerDisplay: string;
  city: string;
  status: "abierta" | "acordada" | "cerrada";
  agreedStatus: EstadoAcuerdo;
  proposal: Condiciones | null;
  proposedBy: string | null;
  buyerConfirmedAt: string | null;
  sellerConfirmedAt: string | null;
  updated_at: string;
  ultimaMensaje: string | null;
  ultimaAt: string | null;
  soyComprador: boolean;
}

export interface Mensaje {
  id: number;
  conversationId: string;
  senderId: string;
  body: string;
  attachmentName: string | null;
  createdAt: string;
}

export interface Notificacion {
  id: number;
  type: "mensaje" | "contrato" | "entrega" | "sistema";
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface ConversacionRow {
  id: string;
  offer_id: number | null;
  buyer_id: string;
  seller_id: string | null;
  status: Conversacion["status"];
  agreed_status: EstadoAcuerdo;
  proposal: Condiciones | null;
  proposed_by: string | null;
  buyer_confirmed_at: string | null;
  seller_confirmed_at: string | null;
  updated_at: string;
  offers: { id: number; product: string; seller_name: string; city: string } | null;
}

// ---------------------------------------------------------------------------
// Conversaciones
// ---------------------------------------------------------------------------

/** Abre (o reutiliza) el hilo entre el comprador y la oferta elegida. */
export async function abrirConversacion(oferta: OfertaBase, compradorId: string): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { error } = await supabase.from("conversations").insert({
    offer_id: oferta.id,
    buyer_id: compradorId,
    seller_id: oferta.ownerId,
  });

  // 23505 = ya existía (índice único oferta+comprador)
  if (error && error.code !== "23505") return null;

  const { data, error: selectError } = await supabase
    .from("conversations")
    .select("id")
    .eq("offer_id", oferta.id)
    .eq("buyer_id", compradorId)
    .maybeSingle();

  if (selectError) return null;
  return data?.id ?? null;
}

/** Abre una consulta general (sin oferta asociada). */
export async function abrirConsultaGeneral(compradorId: string): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ offer_id: null, buyer_id: compradorId, seller_id: null })
    .select("id")
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

async function cargarNombres(ids: string[]): Promise<Record<string, string>> {
  const supabase = getSupabaseBrowserClient();
  const mapa: Record<string, string> = {};
  if (!supabase || ids.length === 0) return mapa;
  const { data } = await supabase.rpc("ver_perfiles", { p_ids: ids });
  for (const fila of (data ?? []) as { id: string; full_name: string; company_name: string }[]) {
    mapa[fila.id] = fila.company_name || fila.full_name;
  }
  return mapa;
}

/** Lista las conversaciones del usuario con la contraparte y el último mensaje. */
export async function listarConversaciones(userId: string): Promise<Conversacion[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, offer_id, buyer_id, seller_id, status, agreed_status, proposal, proposed_by, buyer_confirmed_at, seller_confirmed_at, updated_at, offers(id, product, seller_name, city)",
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  const filas = (data as unknown as ConversacionRow[]) ?? [];

  const ids: string[] = [];
  for (const fila of filas) {
    if (fila.buyer_id) ids.push(fila.buyer_id);
    if (fila.seller_id) ids.push(fila.seller_id);
  }
  const nombres = await cargarNombres([...new Set(ids)]);

  const conversaciones = filas.map<Conversacion>((fila) => {
    const soyComprador = fila.buyer_id === userId;
    const empresaSimulada = fila.offers?.seller_name ?? "Empresa simulada";
    return {
      id: fila.id,
      offerId: fila.offer_id,
      product: fila.offers?.product ?? "Consulta comercial",
      sellerName: fila.offers?.seller_name ?? empresaSimulada,
      buyerId: fila.buyer_id,
      sellerId: fila.seller_id,
      buyerName: nombres[fila.buyer_id] ?? "Comprador",
      sellerDisplay: fila.seller_id
        ? nombres[fila.seller_id] ?? fila.offers?.seller_name ?? "Vendedor"
        : empresaSimulada,
      city: fila.offers?.city ?? "",
      status: fila.status,
      agreedStatus: fila.agreed_status,
      proposal: fila.proposal,
      proposedBy: fila.proposed_by,
      buyerConfirmedAt: fila.buyer_confirmed_at,
      sellerConfirmedAt: fila.seller_confirmed_at,
      updated_at: fila.updated_at,
      ultimaMensaje: null,
      ultimaAt: null,
      soyComprador,
    };
  });

  if (conversaciones.length === 0) return conversaciones;

  const { data: mensajes } = await supabase
    .from("messages")
    .select("conversation_id, body, created_at")
    .in("conversation_id", conversaciones.map((c) => c.id))
    .order("created_at", { ascending: false })
    .limit(120);

  for (const mensaje of (mensajes ?? []) as { conversation_id: string; body: string; created_at: string }[]) {
    const destino = conversaciones.find((c) => c.id === mensaje.conversation_id);
    if (destino && !destino.ultimaMensaje) {
      destino.ultimaMensaje = mensaje.body;
      destino.ultimaAt = mensaje.created_at;
    }
  }

  return conversaciones;
}

// ---------------------------------------------------------------------------
// Mensajes
// ---------------------------------------------------------------------------

export async function cargarMensajes(conversationId: string): Promise<Mensaje[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, attachment_name, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error || !data) return [];
  return (data as {
    id: number;
    conversation_id: string;
    sender_id: string;
    body: string;
    attachment_name: string | null;
    created_at: string;
  }[]).map((fila) => ({
    id: fila.id,
    conversationId: fila.conversation_id,
    senderId: fila.sender_id,
    body: fila.body,
    attachmentName: fila.attachment_name,
    createdAt: fila.created_at,
  }));
}

export async function enviarMensaje(
  conversationId: string,
  senderId: string,
  body: string,
  attachmentName?: string,
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    body,
    attachment_name: attachmentName || null,
  });
  return !error;
}

/** Realtime del hilo. Si falla, el llamador debe usar polling. */
export function suscribirseAHilos(
  conversationId: string,
  onNuevo: () => void,
): { close: () => void } {
  return suscribirseATabla(
    `chat:${conversationId}`,
    "messages",
    `conversation_id=eq.${conversationId}`,
    "INSERT",
    onNuevo,
  );
}

// ---------------------------------------------------------------------------
// Suscripciones realtime compartidas (un canal por tópico, varios oyentes)
// ---------------------------------------------------------------------------

interface Entrada {
  oyentes: Set<() => void>;
  close: () => void;
}

const CANALES = new Map<string, Entrada>();

/**
 * supabase-js lanza "cannot add postgres_changes callbacks ... after
 * subscribe()" si dos componentes abren el mismo tópico. Acá cada tópico se
 * suscribe una sola vez y se comparte entre oyentes.
 */
function suscribirseATabla(
  topico: string,
  tabla: "messages" | "notifications",
  filtro: string,
  evento: "INSERT" | "*",
  oyente: () => void,
): { close: () => void } {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { close: () => undefined };

  let entrada = CANALES.get(topico);

  if (!entrada) {
    const oyentes = new Set<() => void>();
    const canal = supabase
      .channel(topico)
      .on(
        "postgres_changes",
        { event: evento, schema: "public", table: tabla, filter: filtro },
        () => {
          for (const cb of CANALES.get(topico)?.oyentes ?? []) cb();
        },
      )
      .subscribe();

    entrada = {
      oyentes,
      close: () => {
        void supabase.removeChannel(canal);
      },
    };
    CANALES.set(topico, entrada);
  }

  entrada.oyentes.add(oyente);

  let cerrado = false;
  return {
    close: () => {
      if (cerrado) return;
      cerrado = true;
      const actual = CANALES.get(topico);
      if (!actual) return;
      actual.oyentes.delete(oyente);
      if (actual.oyentes.size === 0) {
        CANALES.delete(topico);
        actual.close();
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Condiciones acordadas
// ---------------------------------------------------------------------------

export async function proponerCondiciones(
  conversationId: string,
  condiciones: Condiciones,
  userId: string,
): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Sin conexión." };

  const { error } = await supabase
    .from("conversations")
    .update({
      proposal: condiciones,
      proposed_by: userId,
      agreed_status: "propuesto",
      buyer_confirmed_at: null,
      seller_confirmed_at: null,
    })
    .eq("id", conversationId);

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Condiciones propuestas. La otra parte debe confirmarlas." };
}

export async function confirmarAcuerdo(
  conversationId: string,
  userId: string,
): Promise<{ ok: boolean; message: string; acordado: boolean }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Sin conexión.", acordado: false };

  const { data: fila, error: leerError } = await supabase
    .from("conversations")
    .select("buyer_id, seller_id, buyer_confirmed_at, seller_confirmed_at, proposal")
    .eq("id", conversationId)
    .maybeSingle();

  if (leerError || !fila) return { ok: false, message: "No pudimos leer la conversación.", acordado: false };
  if (!fila.proposal) return { ok: false, message: "Todavía no hay una propuesta para confirmar.", acordado: false };
  if (fila.buyer_id !== userId && fila.seller_id !== userId) {
    return { ok: false, message: "Solo las partes del acuerdo pueden confirmar.", acordado: false };
  }

  const ahora = new Date().toISOString();
  const confirmacionComprador = fila.buyer_id === userId ? ahora : fila.buyer_confirmed_at;
  const confirmacionVendedor = fila.seller_id === userId ? ahora : fila.seller_confirmed_at;
  const acordado = Boolean(confirmacionComprador && confirmacionVendedor);

  const { error } = await supabase
    .from("conversations")
    .update({
      buyer_confirmed_at: confirmacionComprador,
      seller_confirmed_at: confirmacionVendedor,
      agreed_status: acordado ? "acordado" : "propuesto",
      status: acordado ? "acordada" : "abierta",
    })
    .eq("id", conversationId);

  if (error) return { ok: false, message: error.message, acordado: false };
  return acordado
    ? { ok: true, message: "Ambas partes confirmaron: condiciones acordadas.", acordado: true }
    : { ok: true, message: "Confirmaste vos. Falta la confirmación de la otra parte.", acordado: false };
}

/** Carga la conversación completa por id (para la pantalla del hilo). */
export async function cargarConversacion(
  conversationId: string,
  userId: string,
): Promise<Conversacion | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, offer_id, buyer_id, seller_id, status, agreed_status, proposal, proposed_by, buyer_confirmed_at, seller_confirmed_at, updated_at, offers(id, product, seller_name, city)",
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) return null;
  const fila = data as unknown as ConversacionRow;

  const ids = [fila.buyer_id, fila.seller_id].filter((x): x is string => Boolean(x));
  const nombres = await cargarNombres([...new Set(ids)]);
  const soyComprador = fila.buyer_id === userId;

  return {
    id: fila.id,
    offerId: fila.offer_id,
    product: fila.offers?.product ?? "Consulta comercial",
    sellerName: fila.offers?.seller_name ?? "Empresa simulada",
    buyerId: fila.buyer_id,
    sellerId: fila.seller_id,
    buyerName: nombres[fila.buyer_id] ?? "Comprador",
    sellerDisplay: fila.seller_id
      ? nombres[fila.seller_id] ?? fila.offers?.seller_name ?? "Vendedor"
      : fila.offers?.seller_name ?? "Empresa simulada",
    city: fila.offers?.city ?? "",
    status: fila.status,
    agreedStatus: fila.agreed_status,
    proposal: fila.proposal,
    proposedBy: fila.proposed_by,
    buyerConfirmedAt: fila.buyer_confirmed_at,
    sellerConfirmedAt: fila.seller_confirmed_at,
    updated_at: fila.updated_at,
    ultimaMensaje: null,
    ultimaAt: null,
    soyComprador,
  };
}

// ---------------------------------------------------------------------------
// Notificaciones
// ---------------------------------------------------------------------------

interface NotificacionRow {
  id: number;
  type: Notificacion["type"];
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

function mapearNotificacion(fila: NotificacionRow): Notificacion {
  return {
    id: fila.id,
    type: fila.type,
    title: fila.title,
    body: fila.body,
    link: fila.link,
    read: fila.read,
    createdAt: fila.created_at,
  };
}

export async function listarNotificaciones(userId: string): Promise<Notificacion[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error || !data) return [];
  return (data as NotificacionRow[]).map(mapearNotificacion);
}

export async function marcarNotificacionLeida(id: number): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function marcarTodasLeidas(userId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}

export function suscribirseANotificaciones(userId: string, onNueva: () => void): { close: () => void } {
  return suscribirseATabla(
    `notif:${userId}`,
    "notifications",
    `user_id=eq.${userId}`,
    "*",
    onNueva,
  );
}
