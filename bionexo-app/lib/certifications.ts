"use client";

/* -------------------------------------------------------------------------- */
/*  Sellos y certificaciones ambientales de vendedores       */
/*                                                                            */
/*  Esta versión NO toca la base de datos ni Supabase: todo el estado vive    */
/*  en el navegador (localStorage) para mostrar el circuito completo.         */
/*                                                                            */
/*  BioNexo NO emite ni otorga estos sellos. Solo registra la documentación   */
/*  que presenta el vendedor y simula la verificación de un administrador.    */
/* -------------------------------------------------------------------------- */

export type SelloType = "bioproducto" | "epd" | "saprocea";

/** Estado guardado del sello. "expired" (Vencido) se calcula con la fecha de vencimiento. */
export type SelloEstadoStored = "none" | "pending" | "verified";
export type SelloEstado = SelloEstadoStored | "expired";

export interface SelloDef {
  key: SelloType;
  nombre: string;
  descripcion: string;
  sitioOficial: string;
  documentoSugerido: string;
}

export const SELLOS_AMBIENTALES: Record<SelloType, SelloDef> = {
  bioproducto: {
    key: "bioproducto",
    nombre: "Sello Bioproducto Argentino",
    descripcion:
      "Distinción oficial de la Secretaría de Agricultura, Ganadería y Pesca de la Nación para bioproductos elaborados con materias primas renovables de la actividad agroindustrial (Resoluciones 235/2017 y 132/2021).",
    sitioOficial: "https://www.argentina.gob.ar/agricultura/sello-bioproducto-argentino",
    documentoSugerido: "Resolución/acta de otorgamiento del sello y ficha del producto certificado.",
  },
  epd: {
    key: "epd",
    nombre: "Declaración Ambiental de Producto (EPD)",
    descripcion:
      "Declaración ambiental tipo III verificada mediante análisis de ciclo de vida, dentro del programa EPD Argentina del INTI.",
    sitioOficial: "https://epd.inti.gob.ar/argentina",
    documentoSugerido: "EPD publicada y certificado emitido por el INTI / Organismo de Certificación.",
  },
  saprocea: {
    key: "saprocea",
    nombre: "Sello Argentino de Sustentabilidad (SAPROCEA)",
    descripcion:
      "Certificación de sustentabilidad empresarial según su alcance y criterios, con resolución de certificación y vigencia definida.",
    sitioOficial: "https://selloargentinodesustentabilidadsaprocea.com.ar/empresas-certificadas/",
    documentoSugerido: "Resolución de certificación SAPROCEA y acta de alcance certificada.",
  },
};

export const ESTADO_LABEL: Record<SelloEstado, { label: string; color: string; bg: string }> = {
  none: { label: "No posee", color: "#6b7280", bg: "#f3f4f6" },
  pending: { label: "Pendiente de verificación", color: "#92400e", bg: "#fef3c7" },
  verified: { label: "Verificado", color: "#166534", bg: "#dcfce7" },
  expired: { label: "Vencido", color: "#991b1b", bg: "#fee2e2" },
};

export const ORDEN_SELLOS: SelloType[] = ["bioproducto", "epd", "saprocea"];

export interface SellerSeal {
  id: string;
  seller_id: string;
  seal_type: SelloType;
  status: SelloEstadoStored;
  certificate_number: string;
  issuing_entity: string;
  issue_date: string | null;
  expiry_date: string | null;
  scope: string;
  doc_name: string;
  doc_size: number;
  reviewed_at: string | null;
  review_notes: string;
  updated_at: string;
}

export interface SelloDatos {
  certificate_number: string;
  issuing_entity: string;
  issue_date: string | null;
  expiry_date: string | null;
  scope: string;
  doc_name: string;
  doc_size: number;
}

export interface ResultadoMock {
  ok: boolean;
  message: string;
}

/* --------------------------- estados de vigencia -------------------------- */

/** Estado de vigencia a partir del estado guardado y la fecha de vencimiento. */
export function estadoDesdeVencimiento(status: SelloEstadoStored, expiryDate: string | null): SelloEstado {
  if (status === "verified" && expiryDate) {
    const vencimiento = new Date(`${expiryDate}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (vencimiento < hoy) return "expired";
  }
  return status;
}

/** Estado que se muestra en pantalla: "Vencido" se calcula sobre la fecha de vencimiento. */
export function estadoVisible(sello: SellerSeal): SelloEstado {
  return estadoDesdeVencimiento(sello.status, sello.expiry_date);
}

/** Texto de vigencia para mostrar al comprador. */
export function textoVigencia(status: SelloEstadoStored, expiryDate: string | null): string {
  const estado = estadoDesdeVencimiento(status, expiryDate);
  const fecha = expiryDate ? new Date(`${expiryDate}T00:00:00`).toLocaleDateString("es-AR") : "";
  if (estado === "expired") return fecha ? `Vencido el ${fecha}` : "Vencido";
  return fecha ? `Vigente hasta el ${fecha}` : "Sin fecha de vencimiento declarada";
}

export function formatearFecha(fecha: string | null): string {
  return fecha ? new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR") : "—";
}

export function formatearPeso(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ------------------------- almacén mock en el navegador -------------------- */

const CLAVE = "bionexo_sellos_v1";
const EVENTO = "sello:actualizado";

type Almacen = Record<string, SellerSeal[]>;

/** Datos iniciales con los cuatro estados representados. */
function semilla(sellerId: string): SellerSeal[] {
  const base = (parcial: Omit<SellerSeal, "id" | "seller_id">): SellerSeal => ({
    id: `${sellerId}:${parcial.seal_type}`,
    seller_id: sellerId,
    ...parcial,
  });
  return [
    base({
      seal_type: "bioproducto",
      status: "verified",
      certificate_number: "BP-2025-0142",
      issuing_entity: "SAGyP – Sello Bioproducto Argentino",
      issue_date: "2025-03-12",
      expiry_date: "2027-03-12",
      scope: "Cascarilla de arroz pelletizada, Planta El Sauce (Resistencia, Chaco).",
      doc_name: "resolucion-sello-bioproducto.pdf",
      doc_size: 284_512,
      reviewed_at: "2025-03-20T14:05:00.000Z",
      review_notes: "Documentación completa.",
      updated_at: "2025-03-20T14:05:00.000Z",
    }),
    base({
      seal_type: "epd",
      status: "pending",
      certificate_number: "EPD-INTI-2026-0088",
      issuing_entity: "INTI – Programa EPD Argentina",
      issue_date: "2026-06-01",
      expiry_date: "2031-06-01",
      scope: "Declaración de ciclo de vida (cuna a puerta) de pellets de cascarilla de arroz.",
      doc_name: "epd-inti-pellets-cascarilla.pdf",
      doc_size: 1_310_720,
      reviewed_at: null,
      review_notes: "",
      updated_at: "2026-09-30T11:20:00.000Z",
    }),
    base({
      seal_type: "saprocea",
      status: "verified",
      certificate_number: "SAP-2024-0773",
      issuing_entity: "SAPROCEA",
      issue_date: "2024-12-01",
      expiry_date: "2025-11-30",
      scope: "Gestión de residuos agroindustriales y economía circular en planta.",
      doc_name: "certificado-saprocea-2024.pdf",
      doc_size: 512_000,
      reviewed_at: "2024-12-10T09:00:00.000Z",
      review_notes: "Verificado con acta de alcance.",
      updated_at: "2024-12-10T09:00:00.000Z",
    }),
  ];
}

function leerAlmacen(): Almacen {
  if (typeof window === "undefined") return {};
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as Almacen) : {};
  } catch {
    return {};
  }
}

function escribirAlmacen(almacen: Almacen) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(almacen));
  } catch {
    /* si el navegador no lo permite, seguimos solo en memoria */
  }
  window.dispatchEvent(new CustomEvent(EVENTO));
}

/** Suscripción al evento de cambios (para refrescar las vistas de la demo). */
export function alActualizar(listener: () => void): () => void {
  window.addEventListener(EVENTO, listener);
  return () => window.removeEventListener(EVENTO, listener);
}

/** Devuelve los tres sellos del vendedor; la primera lectura siembra los datos iniciales. */
export function listarSellosDe(sellerId: string): SellerSeal[] {
  const almacen = leerAlmacen();
  const guardados = almacen[sellerId];
  if (!guardados || guardados.length === 0) {
    const nuevos = semilla(sellerId);
    escribirAlmacen({ ...almacen, [sellerId]: nuevos });
    return nuevos;
  }
  const porTipo = new Map(guardados.map((s) => [s.seal_type, s]));
  return ORDEN_SELLOS.map((tipo) => porTipo.get(tipo) ?? semilla(sellerId).find((s) => s.seal_type === tipo)!);
}

/** Solo sellos verificados y vigentes (vista pública del comprador). */
export function listarSellosPublicos(sellerId: string): SellerSeal[] {
  return listarSellosDe(sellerId).filter((s) => s.status === "verified");
}

function actualizarSello(
  sellerId: string,
  tipo: SelloType,
  cambios: Partial<SellerSeal>,
): ResultadoMock {
  const almacen = leerAlmacen();
  const actuales = almacen[sellerId] ?? semilla(sellerId);
  const siguientes = actuales.map((s) =>
    s.seal_type === tipo ? { ...s, ...cambios, updated_at: new Date().toISOString() } : s,
  );
  escribirAlmacen({ ...almacen, [sellerId]: siguientes });
  return { ok: true, message: "" };
}

/** El vendedor presenta documentación: pasa a "Pendiente de verificación". */
export function guardarSelloMock(sellerId: string, tipo: SelloType, datos: SelloDatos): ResultadoMock {
  if (!datos.certificate_number.trim()) {
    return { ok: false, message: "El número de certificado es obligatorio." };
  }
  if (!datos.doc_name) {
    return { ok: false, message: "Adjuntá la documentación que respalda el sello." };
  }
  const r = actualizarSello(sellerId, tipo, {
    status: "pending",
    certificate_number: datos.certificate_number.trim(),
    issuing_entity: datos.issuing_entity.trim(),
    issue_date: datos.issue_date,
    expiry_date: datos.expiry_date,
    scope: datos.scope.trim(),
    doc_name: datos.doc_name,
    doc_size: datos.doc_size,
    reviewed_at: null,
    review_notes: "",
  });
  return { ...r, message: "Documentación presentada: queda pendiente de verificación administrativa." };
}

/** El vendedor declara que no posee el sello. */
export function quitarSelloMock(sellerId: string, tipo: SelloType): ResultadoMock {
  const r = actualizarSello(sellerId, tipo, {
    status: "none",
    certificate_number: "",
    issuing_entity: "",
    issue_date: null,
    expiry_date: null,
    scope: "",
    doc_name: "",
    doc_size: 0,
    reviewed_at: null,
    review_notes: "",
  });
  return { ...r, message: "El sello quedó marcado como “No posee”." };
}

/** El administrador aprueba la documentación. */
export function aprobarSelloMock(sellerId: string, tipo: SelloType, notas: string): ResultadoMock {
  const r = actualizarSello(sellerId, tipo, {
    status: "verified",
    reviewed_at: new Date().toISOString(),
    review_notes: notas.trim(),
  });
  return { ...r, message: "Sello verificado: ya se muestra en el perfil público del vendedor." };
}

/** El administrador rechaza la documentación. */
export function rechazarSelloMock(sellerId: string, tipo: SelloType, notas: string): ResultadoMock {
  const r = actualizarSello(sellerId, tipo, {
    status: "pending",
    reviewed_at: new Date().toISOString(),
    review_notes: `Rechazado: ${notas.trim() || "documentación insuficiente"}`,
  });
  return { ...r, message: "Documentación rechazada. El vendedor debe reenviarla con las correcciones." };
}

/** Restablece los datos iniciales. */
export function restablecerDemo(sellerId: string): void {
  const almacen = leerAlmacen();
  escribirAlmacen({ ...almacen, [sellerId]: semilla(sellerId) });
}
