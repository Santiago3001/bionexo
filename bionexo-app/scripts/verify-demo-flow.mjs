import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const base = env.NEXT_PUBLIC_SUPABASE_URL;
const apiKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const password = "Bionexo2026!";
if (!base || !apiKey) throw new Error("Falta la configuración pública de Supabase.");

async function request(path, token, init = {}) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${path}: ${response.status} ${text}`);
  return data;
}

async function login(email) {
  return request("/auth/v1/token?grant_type=password", apiKey, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

async function rpc(name, token, body) {
  return request(`/rest/v1/rpc/${name}`, token, { method: "POST", body: JSON.stringify(body) });
}

const [buyer, seller, carrier] = await Promise.all([
  login("demo.comprador@bionexo.dev"),
  login("demo.vendedor@bionexo.dev"),
  login("demo.transportista@bionexo.dev"),
]);

const buyerToken = buyer.access_token;
const sellerToken = seller.access_token;
const carrierToken = carrier.access_token;
const buyerId = buyer.user.id;
const sellerId = seller.user.id;

const offers = await request(
  `/rest/v1/offers?select=id,product,price_per_ton,quantity_tons&owner_id=eq.${sellerId}&is_simulated=eq.false&status=eq.active&order=created_at.desc&limit=1`,
  buyerToken,
);
if (!offers[0]) throw new Error("El vendedor demo no tiene una oferta real activa.");
const offer = offers[0];

let conversations = await request(
  `/rest/v1/conversations?select=id&offer_id=eq.${offer.id}&buyer_id=eq.${buyerId}&limit=1`,
  buyerToken,
);
if (!conversations[0]) {
  await request("/rest/v1/conversations", buyerToken, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ offer_id: offer.id, buyer_id: buyerId, seller_id: sellerId }),
  });
  conversations = await request(
    `/rest/v1/conversations?select=id&offer_id=eq.${offer.id}&buyer_id=eq.${buyerId}&limit=1`,
    buyerToken,
  );
}
const conversationId = conversations[0]?.id;
if (!conversationId) throw new Error("No se pudo abrir la conversación real.");

const proposal = {
  quantityTons: Math.min(10, Number(offer.quantity_tons)),
  unitPrice: Number(offer.price_per_ton),
  frequency: "Mensual",
  durationMonths: 6,
  terms: "Demo E2E: retiro coordinado, control de calidad antes de la carga y pago contra entrega.",
  startDate: new Date().toISOString().slice(0, 10),
  contractType: "spot",
  downPaymentPct: 0,
  penaltyPct: 0,
};
await request(`/rest/v1/conversations?id=eq.${conversationId}`, buyerToken, {
  method: "PATCH",
  headers: { Prefer: "return=minimal" },
  body: JSON.stringify({
    proposal,
    proposed_by: buyerId,
    agreed_status: "propuesto",
    buyer_confirmed_at: new Date().toISOString(),
    seller_confirmed_at: null,
    status: "abierta",
  }),
});
await request(`/rest/v1/conversations?id=eq.${conversationId}`, sellerToken, {
  method: "PATCH",
  headers: { Prefer: "return=minimal" },
  body: JSON.stringify({
    seller_confirmed_at: new Date().toISOString(),
    agreed_status: "acordado",
    status: "acordada",
  }),
});

const contractId = await rpc("crear_contrato", buyerToken, {
  p_conversation_id: conversationId,
  p_buyer_id: buyerId,
  p_seller_id: sellerId,
  p_product: offer.product,
  p_quantity_tons: proposal.quantityTons,
  p_unit_price: proposal.unitPrice,
  p_frequency: proposal.frequency,
  p_duration_months: proposal.durationMonths,
  p_start_date: proposal.startDate,
  p_terms: proposal.terms,
  p_created_by: buyerId,
  p_contract_type: "spot",
  p_down_payment_pct: 0,
  p_penalty_pct: 0,
});
const orderId = await rpc("activar_contrato_y_crear_operacion", buyerToken, { p_contract_id: contractId });
await rpc("tomar_operacion_transporte", carrierToken, { p_order_id: orderId });
await rpc("avanzar_operacion_transporte", carrierToken, { p_order_id: orderId });

async function visibleOrder(token) {
  const rows = await request(
    `/rest/v1/orders?select=id,product,quantity_tons,status_step,buyer_id,seller_id,carrier_id,contract_id&id=eq.${encodeURIComponent(orderId)}`,
    token,
  );
  return rows[0] ?? null;
}

const [buyerOrder, sellerOrder, carrierOrder] = await Promise.all([
  visibleOrder(buyerToken),
  visibleOrder(sellerToken),
  visibleOrder(carrierToken),
]);
if (!buyerOrder || !sellerOrder || !carrierOrder) {
  throw new Error("La operación no es visible para los tres participantes.");
}
if (new Set([buyerOrder.id, sellerOrder.id, carrierOrder.id]).size !== 1 || buyerOrder.status_step !== 2) {
  throw new Error("Los participantes no comparten el mismo estado logístico.");
}

console.log(JSON.stringify({
  ok: true,
  conversationId,
  contractId,
  orderId,
  product: buyerOrder.product,
  quantityTons: buyerOrder.quantity_tons,
  statusStep: buyerOrder.status_step,
  visibleFor: ["comprador", "vendedor", "transportista"],
}, null, 2));
