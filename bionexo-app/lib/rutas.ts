export type Tramo = "vacio" | "cargado" | "vuelta";

export const CIUDADES: Record<string, [number, number]> = {
  res: [-58.98, -27.46], cor: [-58.83, -27.47], obe: [-55.12, -27.49],
  rsp: [-60.45, -26.79], goy: [-59.26, -29.14], pos: [-55.89, -27.37],
};

export const NOMBRES: Record<string, string> = {
  res: "Resistencia", cor: "Corrientes", obe: "Oberá",
  rsp: "Roque Sáenz Peña", goy: "Goya", pos: "Posadas",
};

export interface Combo {
  id: string;
  nombre: string;
  etiqueta: string;
  usd: number;
  km: number;
  horas: string;
  toneladas: number;
  detalle: string;
  paradas: string[];
  tramos: [string, string, Tramo][];
}

export const CAPACIDAD = 30;

export const COMBOS: Combo[] = [
  {
    id: "max", nombre: "Máxima ganancia", etiqueta: "MEJOR US$", usd: 741, km: 477, horas: "7 h 10", toneladas: 15,
    detalle: "Aserrín de pino · 15 t", paradas: ["res", "obe", "res"],
    tramos: [["res", "obe", "vacio"], ["obe", "res", "cargado"]],
  },
  {
    id: "doble", nombre: "Doble parada a la ida", etiqueta: "DOBLE PARADA", usd: 430, km: 260, horas: "4 h 30", toneladas: 30,
    detalle: "Cascarilla 20 t + 10 t en Goya", paradas: ["res", "cor", "goy", "res"],
    tramos: [["res", "cor", "vacio"], ["cor", "goy", "cargado"], ["goy", "res", "cargado"]],
  },
  {
    id: "ida-vuelta", nombre: "Ida y vuelta con carga", etiqueta: "IDA Y VUELTA", usd: 612, km: 402, horas: "6 h 00", toneladas: 40,
    detalle: "Insumos 10 t ida · bagazo 30 t vuelta", paradas: ["res", "rsp", "res"],
    tramos: [["res", "rsp", "cargado"], ["rsp", "res", "vuelta"]],
  },
];

export const TRAMO_META: Record<Tramo, { color: string; label: string; hint: string; ancho: number }> = {
  cargado: { color: "#1f9d4c", label: "Cargado", hint: "Con carga hacia destino", ancho: 6 },
  vuelta: { color: "#2f6fed", label: "Vuelta cargada", hint: "Retorno con carga", ancho: 6 },
  vacio: { color: "#9aa59d", label: "Vacío", hint: "Sin carga (se cobra igual)", ancho: 3.5 },
};

/** Distancia en línea recta entre dos claves, en km (suavizado x1.25 como ruta real). */
export function distKm(a: string, b: string): number {
  const A = CIUDADES[a];
  const B = CIUDADES[b];
  if (!A || !B) return 0;
  const R = 6371;
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(B[1] - A[1]);
  const dLon = r(B[0] - A[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(A[1])) * Math.cos(r(B[1])) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.25);
}

/** Etiqueta corta para el marcador del mapa. */
export function etiquetaCorta(clave: string): string {
  const n = NOMBRES[clave] ?? clave;
  return n === "Roque Sáenz Peña" ? "R. Sáenz Peña" : n;
}