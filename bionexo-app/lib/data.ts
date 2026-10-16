export type CityName =
  | "Resistencia" | "Corrientes" | "Formosa" | "Posadas"
  | "Roque Sáenz Peña" | "Goya" | "Reconquista" | "Clorinda"
  | "Oberá" | "Paso de los Libres";

export const CITIES: Record<CityName, { lat: number; lon: number }> = {
  "Resistencia": { lat: -27.45, lon: -58.99 },
  "Corrientes": { lat: -27.47, lon: -58.83 },
  "Formosa": { lat: -26.18, lon: -58.18 },
  "Posadas": { lat: -27.37, lon: -55.9 },
  "Roque Sáenz Peña": { lat: -26.79, lon: -60.44 },
  "Goya": { lat: -29.14, lon: -59.26 },
  "Reconquista": { lat: -29.15, lon: -59.65 },
  "Clorinda": { lat: -25.29, lon: -57.72 },
  "Oberá": { lat: -27.49, lon: -55.12 },
  "Paso de los Libres": { lat: -29.7, lon: -57.09 },
};

export const PRODUCTS = [
  "Cascarilla de arroz",
  "Aserrín de pino",
  "Bagazo de caña",
  "Residuo de yerba",
  "Afrechillo de trigo",
  "Viruta de madera dura",
];

export interface Pub {
  id: number;
  seller: string;
  product: string;
  city: CityName;
  t: number;
  price: number;
  q: number;
  km?: number;
  score?: number;
  cost?: number;
  flete?: number;
  total?: number;
  co2?: number;
  category?: string;
  originProcess?: string;
  frequency?: string;
  availabilityMonths?: number;
  presentation?: string;
  qualityNotes?: string;
  minLotTons?: number;
  pickupTerms?: string;
  loadingMethod?: string;
  storageRestrictions?: string;
  documentsNotes?: string;
  simulated?: boolean;
  ownerId?: string | null;
}

export const INITIAL_PUBS: Pub[] = [
  { id: 1, seller: "Arrocera El Sauce", product: "Cascarilla de arroz", city: "Corrientes", t: 20, price: 38, q: 8 },
  { id: 2, seller: "Aserradero Litoral", product: "Aserrín de pino", city: "Oberá", t: 15, price: 42, q: 7 },
  { id: 3, seller: "Ingenio Cañero Chaco", product: "Bagazo de caña", city: "Roque Sáenz Peña", t: 60, price: 18, q: 6 },
  { id: 4, seller: "Yerbatera Misiones", product: "Residuo de yerba", city: "Posadas", t: 12, price: 25, q: 7 },
  { id: 5, seller: "Molino del Norte", product: "Afrechillo de trigo", city: "Formosa", t: 25, price: 22, q: 7 },
  { id: 6, seller: "Carpintería Reconquista", product: "Viruta de madera dura", city: "Reconquista", t: 8, price: 30, q: 6 },
  { id: 7, seller: "Arrocera Goya Norte", product: "Cascarilla de arroz", city: "Goya", t: 14, price: 35, q: 7 },
  { id: 8, seller: "Aserradero Clorinda", product: "Aserrín de pino", city: "Clorinda", t: 10, price: 40, q: 6 },
  { id: 9, seller: "Biomasa Chaco SA", product: "Aserrín de pino", city: "Resistencia", t: 10, price: 42, q: 7 },
];

export const NEEDS: Record<string, { product: string; t: number }> = {
  "Arrocera El Sauce": { product: "Aserrín de pino", t: 10 },
};

export const RATE = 0.09;
export const CO2_FACTOR = 0.062;

export function km(a: string, b: string): number {
  const A = CITIES[a as CityName];
  const B = CITIES[b as CityName];
  if (!A || !B) return 300;
  const R = 6371;
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(B.lat - A.lat);
  const dLon = r(B.lon - A.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r(A.lat)) * Math.cos(r(B.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.25);
}

export function usd(n: number): string {
  return "US$ " + Math.round(n).toLocaleString("es-AR");
}

export function proj(lat: number, lon: number): [number, number] {
  return [(lon + 61.2) * 120, (-25 - lat) * 110];
}

export interface Need {
  product: string;
  t: number;
  city: string;
}

export function computeMatches(pubs: Pub[], need: Need, buyerCompany: string, filterCity: string, sort: string): Pub[] {
  const list = pubs
    .filter((p) => p.product === need.product && p.seller !== buyerCompany && (!filterCity || p.city === filterCity))
    .map((p) => ({ ...p }));
  if (!list.length) return list;
  const minP = Math.min(...list.map((p) => p.price), 1);
  list.forEach((p) => {
    const pkm = km(need.city, p.city);
    p.km = pkm;
    const dist = Math.max(0, 1 - pkm / 1000);
    const price = minP / p.price;
    const avail = Math.min(1, p.t / need.t);
    const qual = p.q / 10;
    p.score = Math.round((0.35 * dist + 0.3 * price + 0.2 * avail + 0.15 * qual) * 100);
    p.cost = p.t * p.price;
    p.flete = p.t * pkm * RATE;
    p.total = p.cost + p.flete;
    p.co2 = (p.t * pkm * CO2_FACTOR) / 1000;
  });
  const sorters: Record<string, (a: Pub, b: Pub) => number> = {
    score: (a, b) => (b.score ?? 0) - (a.score ?? 0),
    price: (a, b) => a.price - b.price,
    dist: (a, b) => (a.km ?? 0) - (b.km ?? 0),
  };
  return list.sort(sorters[sort] ?? sorters.score);
}

export function canjeFor(pub: Pub, myPubs: Pub[]): Pub | null {
  const n = NEEDS[pub.seller];
  if (!n) return null;
  return myPubs.find((x) => x.product === n.product) ?? null;
}

export interface Order {
  id: string;
  kind: "compra" | "venta" | "trueque";
  product: string;
  t: number;
  from: string;
  to: string;
  buyer: string;
  seller: string;
  carrier: string;
  st: number;
  eta: string;
  value: number;
}

export const ORDER_STEPS = ["Orden confirmada", "Flete asignado", "Retirado", "En tránsito", "Entregado"];

