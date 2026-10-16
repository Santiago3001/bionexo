import { createClient } from "@supabase/supabase-js";
import { CITIES } from "@/lib/data";


interface Match {
  offer_id: number;
  reason: string;
}

interface IAInterpreted {
  product: string;
  tons: number;
  city: string;
  frequency: string;
}

interface IAParsed {
  reply: string;
  interpreted: IAInterpreted;
  matches: Match[];
}

function parseModelJson(raw: string): IAParsed {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) throw new Error("La IA no devolvió un objeto.");
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.reply !== "string" || !obj.reply.trim()) throw new Error("La IA no devolvió 'reply'.");

  const interpretedRaw: Record<string, unknown> =
    typeof obj.interpreted === "object" && obj.interpreted !== null
      ? (obj.interpreted as Record<string, unknown>)
      : {};
  const matchesRaw: unknown[] = Array.isArray(obj.matches) ? obj.matches : [];
  const matches: Match[] = [];
  for (const m of matchesRaw.slice(0, 5)) {
    if (typeof m !== "object" || m === null) continue;
    const mm = m as Record<string, unknown>;
    if (typeof mm.offer_id !== "number" || !Number.isFinite(mm.offer_id)) continue;
    matches.push({
      offer_id: mm.offer_id,
      reason: typeof mm.reason === "string" ? mm.reason : "",
    });
  }

  return {
    reply: obj.reply,
    interpreted: {
      product: typeof interpretedRaw.product === "string" ? interpretedRaw.product : "",
      tons: typeof interpretedRaw.tons === "number" && Number.isFinite(interpretedRaw.tons) ? interpretedRaw.tons : 0,
      city: typeof interpretedRaw.city === "string" ? interpretedRaw.city : "",
      frequency: typeof interpretedRaw.frequency === "string" ? interpretedRaw.frequency : "",
    },
    matches,
  };
}

export async function POST(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return Response.json(
      { error: "no_autenticado", message: "Falta el token de Supabase en el header Authorization." },
      { status: 401 },
    );
  }

  let body: { message?: unknown; need?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body_invalido", message: "El body debe ser JSON válido." }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "mensaje_vacio", message: "Falta el campo 'message'." }, { status: 400 });
  }
  const needBody =
    typeof body.need === "object" && body.need !== null
      ? (body.need as { product?: unknown; t?: unknown; city?: unknown })
      : null;
  const need = needBody
    ? {
        product: typeof needBody.product === "string" ? needBody.product : "",
        t: typeof needBody.t === "number" && Number.isFinite(needBody.t) ? needBody.t : 0,
        city: typeof needBody.city === "string" ? needBody.city : "",
      }
    : null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return Response.json(
      { error: "supabase_no_configurado", message: "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY." },
      { status: 503 },
    );
  }

  // Cliente con el token del usuario para que RLS aplique en las consultas.
  const supabase = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return Response.json(
      { error: "token_invalido", message: "El token de Supabase es inválido o expiró." },
      { status: 401 },
    );
  }

  const [{ data: offersRows, error: offersError }, { data: needsRows }] = await Promise.all([
    supabase
      .from("offers")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("purchase_needs")
      .select("*")
      .eq("buyer_id", userData.user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  if (offersError) {
    return Response.json(
      { error: "ofertas_error", message: `No pude leer las ofertas: ${offersError.message}` },
      { status: 502 },
    );
  }

  type OfferRow = Record<string, unknown>;
  const catalogo = (offersRows ?? []).map((row) => {
    const r = row as OfferRow;
    return {
      id: Number(r.id),
      seller_name: String(r.seller_name ?? ""),
      product: String(r.product ?? ""),
      city: String(r.city ?? ""),
      quantity_tons: Number(r.quantity_tons ?? 0),
      price_per_ton: Number(r.price_per_ton ?? 0),
      quality_score: Number(r.quality_score ?? 0),
      frequency: String(r.frequency ?? "Mensual"),
    };
  });

  const necesidadesGuardadas = (needsRows ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      product: String(r.product ?? ""),
      quantity_tons: Number(r.quantity_tons ?? 0),
      delivery_city: String(r.delivery_city ?? ""),
      frequency: String(r.frequency ?? "Mensual"),
    };
  });

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return Response.json(
      { error: "ia_no_configurada", message: "Falta OPENAI_API_KEY en .env.local" },
      { status: 503 },
    );
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const systemPrompt = [
    "Sos el asistente comercial de BioNexo NEA, un marketplace B2B de biomasa residual del Litoral argentino (Chaco, Corrientes, Misiones, Formosa y Santa Fe). Respondés SIEMPRE en español rioplatense, concreto y breve.",
    "",
    "Tenés PROHIBIDO inventar proveedores, precios, ciudades, cantidades o cualquier dato que no esté en el CATÁLOGO de abajo. Usá SOLO los datos provistos. Si no hay ofertas realmente compatibles, devolvé matches: [] y explicá claramente en 'reply' por qué no hay coincidencias y qué podría ajustar el usuario (otro producto, otra ciudad u otra cantidad).",
    "",
    "CATÁLOGO DE OFERTAS ACTIVAS (JSON real de la base, máximo 20):",
    JSON.stringify(catalogo),
    "",
    "NECESIDAD QUE ENVÍA EL COMPRADOR DESDE LA APP (puede ser null):",
    JSON.stringify(need),
    "",
    "NECESIDADES GUARDADAS DEL COMPRADOR EN LA BASE (puede ser []):",
    JSON.stringify(necesidadesGuardadas),
    "",
    "CIUDADES DISPONIBLES CON COORDENADAS (para calcular cercanía relativa):",
    JSON.stringify(CITIES),
    "",
    "REGLAS:",
    "1. Interpretá la petición: producto (usá nombres exactos del catálogo cuando sea posible), cantidad en toneladas por mes, ciudad de entrega (una de las ciudades disponibles) y frecuencia (ej. 'Mensual'). Si el usuario no menciona un dato, conservá el de la necesidad que envía la app.",
    "2. Elegí como máximo 5 ofertas realmente compatibles del catálogo: priorizá mismo producto, después ciudad cercana o igual, después precio y calidad. No descartes una oferta solo porque tenga menos toneladas; mencioná esa diferencia.",
    "3. Para cada match justificá en 'reason' con una frase corta y un dato concreto (precio por tonelada, distancia/ciudad, calidad o disponibilidad).",
    "4. 'reply' debe ser conversacional: respondé al pedido, resumí qué encontraste (o qué faltó), mencioná 1 o 2 ofertas clave con precio y ciudad, y sugerí el siguiente paso (usar el botón Comprar o afinar la búsqueda).",
    "",
    "FORMATO DE SALIDA: devolvé EXCLUSIVAMENTE un objeto JSON válido (sin markdown, sin texto fuera) con esta forma exacta:",
    '{ "reply": "respuesta conversacional en español", "interpreted": { "product": "nombre del producto", "tons": 20, "city": "Ciudad", "frequency": "Mensual" }, "matches": [ { "offer_id": 1, "reason": "motivo concreto" } ] }',
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const respuesta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
      signal: controller.signal,
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => "");
      return Response.json(
        { error: "openai_error", message: `OpenAI respondió ${respuesta.status}. ${detalle.slice(0, 300)}` },
        { status: 502 },
      );
    }

    const completion = (await respuesta.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      return Response.json(
        { error: "respuesta_vacia", message: "OpenAI devolvió una respuesta vacía." },
        { status: 502 },
      );
    }

    let parsed: IAParsed;
    try {
      parsed = parseModelJson(content);
    } catch (err) {
      return Response.json(
        { error: "respuesta_invalida", message: `No pude interpretar la respuesta de la IA: ${err instanceof Error ? err.message : "JSON inválido"}` },
        { status: 502 },
      );
    }

    return Response.json({ ...parsed, model });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return Response.json(
        { error: "timeout", message: "La IA tardó más de 25 segundos en responder." },
        { status: 504 },
      );
    }
    return Response.json(
      { error: "openai_error", message: `No se pudo consultar la IA: ${err instanceof Error ? err.message : "error desconocido"}` },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
