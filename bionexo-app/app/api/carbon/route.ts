import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CITIES, km, type CityName } from "@/lib/data";
import {
  analizarPorReglas,
  construirPromptCarbono,
  fusionarConModelo,
  type AnalisisCarbono,
  type CompradorDirecto,
  type DemandaProducto,
  type InsumoAnalisis,
} from "@/lib/carbon-core";

/* ------------------------------------------------------------------ */
/*  BioNexo Carbon — análisis ambiental del material publicado.        */
/*                                                                    */
/*  Calcula con factores documentados (transporte y almacenamiento     */
/*  potencial) y, si hay GEMINI_API_KEY, le pide a la IA que interprete */
/*  el caso. SIN clave la respuesta sale igual, por reglas: nunca se   */
/*  inventan compradores, bonos ni resultados ambientales.             */
/* ------------------------------------------------------------------ */

interface OfertaRow {
  id: number;
  product: string;
  city: string;
  quantity_tons: number | string;
}

interface PerfilRow {
  id: string;
  full_name: string;
  company_name: string;
  city: string;
  role: string;
}

function numero(v: number | string | null | undefined): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clienteServidor(token: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
}

/** Ofertas propias del usuario (RLS: el dueño siempre ve las suyas). */
async function ofertasPropias(supabase: SupabaseClient, userId: string): Promise<OfertaRow[]> {
  const { data, error } = await supabase
    .from("offers")
    .select("id, product, city, quantity_tons")
    .eq("owner_id", userId)
    .order("id", { ascending: false });
  if (error || !data) return [];
  return data as unknown as OfertaRow[];
}

/** Demanda agregada de compradores (RPC propio; no expone datos personales). */
async function demanda(supabase: SupabaseClient): Promise<DemandaProducto[]> {
  const { data, error } = await supabase.rpc("demanda_por_producto");
  if (error || !data) return [];
  return (data as unknown as {
    product: string;
    compradores: number;
    toneladas: number | string;
    ciudades: string[];
  }[]).map((d) => ({
    producto: d.product,
    compradores: Number(d.compradores ?? 0),
    toneladas: numero(d.toneladas),
    ciudades: Array.isArray(d.ciudades) ? d.ciudades.filter((c) => typeof c === "string") : [],
  }));
}

/**
 * Compradores con los que YA hay conversación abierta: esos nombres existen
 * en la base y están visibles por RLS para este usuario (nada inventado).
 */
async function compradoresEnConversacion(
  supabase: SupabaseClient,
  userId: string,
  producto: string,
): Promise<CompradorDirecto[]> {
  const { data: convs, error } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, offer_id, status")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .neq("status", "cerrada")
    .limit(60);
  if (error || !convs || convs.length === 0) return [];

  const filas = convs as unknown as {
    id: string;
    buyer_id: string | null;
    seller_id: string | null;
    offer_id: number | null;
    status: string;
  }[];

  const ofertas = await supabase.from("offers").select("id, product");
  const mapaProducto = new Map<number, string>();
  for (const o of (ofertas.data ?? []) as unknown as { id: number; product: string }[]) {
    mapaProducto.set(o.id, o.product);
  }

  // Sólo el vendedor ve "compradores": los que escribieron a sus publicaciones.
  const candidatos = filas.filter((f) => {
    if (f.seller_id !== userId || !f.buyer_id) return false;
    const prod = f.offer_id !== null ? mapaProducto.get(f.offer_id) : undefined;
    return prod ? prod.toLowerCase() === producto.toLowerCase() : true;
  });
  if (candidatos.length === 0) return [];

  const ids = [...new Set(candidatos.map((c) => c.buyer_id as string))];
  const { data: perfiles } = await supabase.rpc("ver_perfiles", { p_ids: ids });
  const nombres = new Map<string, string>();
  for (const p of (perfiles ?? []) as unknown as PerfilRow[]) {
    nombres.set(p.id, p.company_name || p.full_name || "Empresa compradora");
  }

  return candidatos.slice(0, 8).map((c) => ({
    nombre: nombres.get(c.buyer_id as string) ?? "Comprador en la plataforma",
    producto: (c.offer_id !== null ? mapaProducto.get(c.offer_id) : undefined) ?? producto,
    conversacionId: c.id,
  }));
}

async function llamarIA(
  apiKey: string,
  base: AnalisisCarbono,
  insumo: InsumoAnalisis,
  mensaje: string,
): Promise<{ ok: boolean; analisis?: AnalisisCarbono; detalle?: string }> {
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const respuesta = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          { role: "system", content: construirPromptCarbono({ insumo, base }) },
          {
            role: "user",
            content:
              mensaje.trim() ||
              `Analizá el potencial ambiental y de certificación de ${insumo.producto} (${insumo.toneladas} t).`,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => "");
      return { ok: false, detalle: `Gemini respondió ${respuesta.status}. ${detalle.slice(0, 200)}` };
    }

    const completion = (await respuesta.json()) as { choices?: { message?: { content?: string } }[] };
    const content = completion.choices?.[0]?.message?.content;
    if (!content) return { ok: false, detalle: "Gemini devolvió una respuesta vacía." };

    const analisis = fusionarConModelo(base, content, model);
    return { ok: true, analisis };
  } catch (e) {
    return { ok: false, detalle: e instanceof Error ? e.message : "Error llamando a Gemini." };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return Response.json({ error: "No autenticado" }, { status: 401 });

    const supabase = clienteServidor(token);
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) return Response.json({ error: "No autenticado" }, { status: 401 });
    const userId = auth.user.id;

    const body = (await request.json().catch(() => ({}))) as {
      offerId?: number | null;
      ciudad?: string;
      message?: string;
    };

    const { data: perfil, error: perfilError } = await supabase
      .from("profiles")
      .select("full_name, company_name, city, role")
      .eq("id", userId)
      .maybeSingle();
    if (perfilError || !perfil) {
      return Response.json({ error: "sin_perfil", message: "No pudimos leer tu perfil." }, { status: 400 });
    }
    const miCiudad = (perfil as unknown as PerfilRow).city || "Resistencia";

    const ofertas = await ofertasPropias(supabase, userId);
    if (ofertas.length === 0) {
      return Response.json(
        {
          error: "sin_publicaciones",
          message: "Publicá primero un producto o subproducto: el análisis trabaja sobre tus publicaciones.",
        },
        { status: 400 },
      );
    }

    const oferta =
      typeof body.offerId === "number" ? ofertas.find((o) => o.id === body.offerId) : undefined;
    if (typeof body.offerId === "number" && !oferta) {
      return Response.json(
        { error: "oferta_invalida", message: "Esa publicación no es tuya o ya no existe." },
        { status: 400 },
      );
    }
    const elegida = oferta ?? ofertas[0];

    const producto = elegida.product;
    const toneladas = numero(elegida.quantity_tons);
    const ciudadOferta = elegida.city;
    const distanciaKm =
      ciudadOferta in CITIES && miCiudad in CITIES
        ? Math.round(km(miCiudad as CityName, ciudadOferta as CityName))
        : 0;

    const [demandaReal, compradores] = await Promise.all([
      demanda(supabase),
      compradoresEnConversacion(supabase, userId, producto),
    ]);

    const insumo: InsumoAnalisis = {
      producto,
      toneladas,
      ciudad: ciudadOferta,
      distanciaKm,
      demanda: demandaReal,
      compradoresDirectos: compradores,
    };

    const base = analizarPorReglas(insumo);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({
        analisis: base,
        iaDisponible: false,
        message: "IA no configurada: análisis generado con los factores documentados de la app.",
      });
    }

    const resultado = await llamarIA(apiKey, base, insumo, body.message ?? "");
    if (!resultado.ok || !resultado.analisis) {
      return Response.json({
        analisis: base,
        iaDisponible: false,
        message: `La IA no respondió (${resultado.detalle ?? "sin detalle"}): usamos el análisis por reglas.`,
      });
    }

    return Response.json({ analisis: resultado.analisis, iaDisponible: true });
  } catch (e) {
    return Response.json(
      { error: "error_interno", message: e instanceof Error ? e.message : "Error inesperado." },
      { status: 500 },
    );
  }
}
