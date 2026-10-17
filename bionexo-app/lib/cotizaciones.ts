// Cotizaciones de la bolsa agro — DATO SIMULADO.
// Valores de referencia tomados como ejemplo de news.agrofy.com.ar/granos.
// No son cotizaciones en vivo: ningún valor de este archivo debe usarse
// para una decisión comercial real.

export const COTIZACION_BOLSA_URL = "https://news.agrofy.com.ar/granos";

export interface CotizacionRow {
  /** Grano o subproducto (ej. "Soja", "Cascarilla de arroz"). */
  grano: string;
  /** Bolsa o mercado (ej. "Pizarra", "CBOT", "MtR", "Oficial", "Físico"). */
  mercado: string;
  /** Posición o plaza (ej. "Rosario", "Continua", "NOV-2026"). */
  posicion: string;
  /** Cotización ya formateada para mostrar (ej. "$ 560.000", "U$S 463,42", "S/C"). */
  valor: string;
  /** Variación porcentual contra el cierre anterior. `null` cuando no hay cotización. */
  variacion: number | null;
  /** Fecha y hora de la última actualización que informa la fuente. */
  actualizado: string;
}

export type CotizacionTab = "Resumen" | "Cascarilla" | "Soja" | "Maíz" | "Trigo" | "Girasol" | "Arroz";

export const COTIZACION_TABS: CotizacionTab[] = [
  "Resumen",
  "Cascarilla",
  "Soja",
  "Maíz",
  "Trigo",
  "Girasol",
  "Arroz",
];

const SOJA: CotizacionRow[] = [
  { grano: "Soja", mercado: "Pizarra", posicion: "Rosario", valor: "$ 560.000", variacion: 0.54, actualizado: "16/10/2026" },
  { grano: "Soja", mercado: "CBOT", posicion: "Continua", valor: "U$S 463,42", variacion: 0, actualizado: "17/10/2026 00:43" },
  { grano: "Soja", mercado: "MtR", posicion: "NOV-2026", valor: "U$S 370", variacion: -0.27, actualizado: "16/10/2026 17:24" },
  { grano: "Soja", mercado: "Oficial", posicion: "FAS dispo", valor: "S/C", variacion: null, actualizado: "16/10/2026" },
  { grano: "Soja", mercado: "Oficial", posicion: "FOB dispo", valor: "U$/ton 493", variacion: 0, actualizado: "16/10/2026" },
  { grano: "Soja", mercado: "Físico", posicion: "Inmediata", valor: "$ 310.000", variacion: 0, actualizado: "28/01/2025" },
];

const MAIZ: CotizacionRow[] = [
  { grano: "Maíz", mercado: "Pizarra", posicion: "Rosario", valor: "$ 286.500", variacion: 0.17, actualizado: "16/10/2026" },
  { grano: "Maíz", mercado: "CBOT", posicion: "Continua", valor: "U$S 186,71", variacion: -0.79, actualizado: "16/10/2026 15:53" },
  { grano: "Maíz", mercado: "MtR", posicion: "OCT-2026", valor: "U$S 192", variacion: -0.52, actualizado: "16/10/2026 17:24" },
  { grano: "Maíz", mercado: "Oficial", posicion: "FAS dispo", valor: "S/C", variacion: null, actualizado: "16/10/2026" },
  { grano: "Maíz", mercado: "Oficial", posicion: "FOB dispo", valor: "U$/ton 211", variacion: 0, actualizado: "16/10/2026" },
  { grano: "Maíz", mercado: "Físico", posicion: "Inmediata", valor: "$ 215.000", variacion: 0, actualizado: "28/01/2025" },
];

const TRIGO: CotizacionRow[] = [
  { grano: "Trigo", mercado: "Pizarra", posicion: "Rosario", valor: "$ 350.450", variacion: 1.29, actualizado: "16/10/2026" },
  { grano: "Trigo", mercado: "CBOT", posicion: "Continua", valor: "U$S 242,69", variacion: -1.44, actualizado: "16/10/2026 16:21" },
  { grano: "Trigo", mercado: "MtR", posicion: "NOV-2026", valor: "U$S 230,5", variacion: 1.08, actualizado: "16/10/2026 17:24" },
  { grano: "Trigo", mercado: "Oficial", posicion: "FAS dispo", valor: "S/C", variacion: null, actualizado: "16/10/2026" },
  { grano: "Trigo", mercado: "Oficial", posicion: "FOB dispo", valor: "U$/ton 254", variacion: 0, actualizado: "16/10/2026" },
  { grano: "Trigo", mercado: "Físico", posicion: "Inmediata", valor: "$ 200.000", variacion: 0, actualizado: "25/09/2024" },
];

const GIRASOL: CotizacionRow[] = [
  { grano: "Girasol", mercado: "Pizarra", posicion: "Rosario", valor: "S/C", variacion: null, actualizado: "16/10/2026" },
  { grano: "Girasol", mercado: "Oficial", posicion: "FAS dispo", valor: "S/C", variacion: null, actualizado: "16/10/2026" },
  { grano: "Girasol", mercado: "Oficial", posicion: "FOB dispo", valor: "U$/ton 593", variacion: 0, actualizado: "16/10/2026" },
  { grano: "Girasol", mercado: "Físico", posicion: "Inmediata", valor: "U$S 480", variacion: 0, actualizado: "17/03/2021" },
];

const ARROZ: CotizacionRow[] = [
  { grano: "Arroz", mercado: "Pizarra", posicion: "Corrientes", valor: "$ 372.500", variacion: 0.65, actualizado: "16/10/2026" },
  { grano: "Arroz", mercado: "Pizarra", posicion: "Santa Fe", valor: "$ 368.900", variacion: 0.42, actualizado: "16/10/2026" },
  { grano: "Arroz", mercado: "Físico", posicion: "Inmediata", valor: "U$S 315", variacion: 0, actualizado: "16/10/2026" },
  { grano: "Arroz", mercado: "Oficial", posicion: "FOB dispo", valor: "U$/ton 512", variacion: 0, actualizado: "16/10/2026" },
];

// Referencia propia para el caso de la demo (cascarilla de arroz en el NEA).
// Se arma combinando el precio del arroz con el factor de subproducto que
// usa el cotizador. SUPUESTO: revisar con un especialista antes de usarlo
// fuera de la demo.
const CASCARILLA: CotizacionRow[] = [
  { grano: "Cascarilla de arroz", mercado: "Referencia NEA", posicion: "Spot", valor: "US$/t 38", variacion: 2.1, actualizado: "16/10/2026" },
  { grano: "Cascarilla de arroz", mercado: "Referencia NEA", posicion: "Futuro 90 días", valor: "US$/t 40", variacion: 1.3, actualizado: "16/10/2026" },
  { grano: "Cascarilla de arroz", mercado: "FOB", posicion: "Disponible", valor: "US$/t 41", variacion: 0, actualizado: "16/10/2026" },
  { grano: "Arroz paddy", mercado: "Pizarra", posicion: "Corrientes", valor: "$ 372.500", variacion: 0.65, actualizado: "16/10/2026" },
];

export const COTIZACIONES: Record<Exclude<CotizacionTab, "Resumen">, CotizacionRow[]> = {
  Cascarilla: CASCARILLA,
  Soja: SOJA,
  "Maíz": MAIZ,
  Trigo: TRIGO,
  Girasol: GIRASOL,
  Arroz: ARROZ,
};

/** Una fila principal por grano para la vista de resumen. */
export const RESUMEN: CotizacionRow[] = [
  CASCARILLA[0],
  SOJA[0],
  MAIZ[0],
  TRIGO[0],
  GIRASOL[2],
  ARROZ[0],
];

export function cotizacionesFor(tab: CotizacionTab): CotizacionRow[] {
  return tab === "Resumen" ? RESUMEN : COTIZACIONES[tab];
}
