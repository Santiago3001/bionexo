import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { CITIES, CO2_FACTOR, km } from "@/lib/data";
import { FACTORES, REQUISITOS_BASE } from "@/lib/carbon-core";

/* ------------------------------------------------------------------ */
/*  Tipos                                                              */
/* ------------------------------------------------------------------ */

type TipoReporte = "impacto" | "sostenibilidad" | "carbono";

interface PerfilRow {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  cuit: string;
  city: string;
  role: string;
}

interface OfertaRow {
  city: string;
  quantity_tons: number | string;
}

interface OrdenRow {
  quantity_tons: number | string;
  origin_city: string;
  destination_city: string;
}

interface ContratoRow {
  id: string;
  product: string;
  quantity_tons: number | string;
  unit_price: number | string;
  frequency: string;
  duration_months: number;
  start_date: string;
  status: string;
}

interface EntregaRow {
  due_date: string;
  quantity_tons: number | string;
  status: string;
}

interface Kpis {
  ofertas: number;
  tonPublicadas: number;
  ordenes: number;
  tonOrdenes: number;
  contratosActivos: number;
  tonContratadas: number;
  entregasProgramadas: number;
  tonProgramadas: number;
  entregasRealizadas: number;
  tonEntregadas: number;
  entregasRetrasadas: number;
  co2Ofertas: number;
  co2PromedioOferta: number;
  co2Ordenes: number;
  distPromedio: number;
}

interface DatosReporte {
  tipo: TipoReporte;
  perfil: PerfilRow;
  kpis: Kpis;
  fecha: string;
  ciudadesRed: number;
}

/* --- Datos exclusivos del reporte BioNexo Carbon ------------------- */

interface OfertaCarbonRow {
  id: number;
  product: string;
  city: string;
  quantity_tons: number | string;
}

interface AnalisisCarbonRow {
  id: number;
  product: string;
  tons: number | string;
  source: string;
  summary: string;
  pathway: string;
  co2_avoided: number | string | null;
  co2_stored: number | string | null;
  certification_level: string;
  certification_requirements: unknown;
  created_at: string;
}

interface AcuerdoCarbonRow {
  id: number;
  seller_id: string;
  buyer_id: string;
  product: string;
  tons: number | string;
  seller_share_pct: number | string;
  buyer_share_pct: number | string;
  status: string;
  notes: string;
  created_at: string;
}

interface DemandaFila {
  product: string;
  compradores: number;
  toneladas: number | string;
  ciudades: string[];
}

interface DatosCarbono {
  perfil: PerfilRow;
  fecha: string;
  ciudadesRed: number;
  kpis: Kpis;
  ofertas: OfertaCarbonRow[];
  analisis: AnalisisCarbonRow[];
  acuerdos: AcuerdoCarbonRow[];
  demanda: DemandaFila[];
  nombres: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Geometría y colores del PDF                                        */
/* ------------------------------------------------------------------ */

const A4: [number, number] = [595.28, 841.89];
const ANCHO = A4[0];
const ALTO = A4[1];
const M = 54; // margen
const ENC_H = 74; // alto del encabezado

const VERDE = rgb(0.133, 0.545, 0.133); // #228b22
const OSCURO = rgb(0.1, 0.13, 0.1);
const GRIS = rgb(0.4, 0.44, 0.4);
const LINEA = rgb(0.85, 0.88, 0.85);
const FONDO = rgb(0.969, 0.98, 0.969);
const BLANCO = rgb(1, 1, 1);

/* ------------------------------------------------------------------ */
/*  Utilidades                                                         */
/* ------------------------------------------------------------------ */

// La Helvetica de pdf-lib se dibuja en ASCII: quitamos tildes y ñ.
const REEMPLAZOS_ASCII: Record<string, string> = {
  "·": " ",
  "–": "-",
  "—": "-",
  "×": "x",
  "º": "o",
  "ª": "a",
  "¿": "?",
  "¡": "!",
  "“": '"',
  "”": '"',
  "‘": "'",
  "’": "'",
};

function ascii(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\u0020-\u007E]/g, (c) => REEMPLAZOS_ASCII[c] ?? "");
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function n1(v: number): string {
  return v.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

function n2(v: number): string {
  return v.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

function partirLineas(texto: string, fuente: PDFFont, tam: number, ancho: number): string[] {
  const palabras = ascii(texto).split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const cand = actual ? `${actual} ${p}` : p;
    if (fuente.widthOfTextAtSize(cand, tam) <= ancho) {
      actual = cand;
    } else {
      if (actual) lineas.push(actual);
      actual = p;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

function dibujarAjustado(
  page: PDFPage,
  texto: string,
  opts: { x: number; y: number; size: number; font: PDFFont; color: RGB; max: number },
): void {
  const t = ascii(texto);
  let s = opts.size;
  while (s > 5.5 && opts.font.widthOfTextAtSize(t, s) > opts.max) s -= 0.5;
  page.drawText(t, { x: opts.x, y: opts.y, size: s, font: opts.font, color: opts.color });
}

function dibujarEncabezado(page: PDFPage, regular: PDFFont, negrita: PDFFont, derecha: string): void {
  page.drawRectangle({ x: 0, y: ALTO - ENC_H, width: ANCHO, height: ENC_H, color: VERDE });
  page.drawText(ascii("BioNexo NEA"), { x: M, y: ALTO - 44, size: 20, font: negrita, color: BLANCO });
  page.drawText(ascii("Plataforma B2B de subproductos agroindustriales del NEA"), {
    x: M,
    y: ALTO - 60,
    size: 9,
    font: regular,
    color: BLANCO,
  });
  const t = ascii(derecha);
  const w = regular.widthOfTextAtSize(t, 9);
  page.drawText(t, { x: ANCHO - M - w, y: ALTO - 52, size: 9, font: regular, color: BLANCO });
}

function dibujarParrafo(
  page: PDFPage,
  lineas: string[],
  x: number,
  y: number,
  size: number,
  interlineado: number,
  font: PDFFont,
  color: RGB,
): number {
  let ly = y;
  for (const l of lineas) {
    page.drawText(l, { x, y: ly, size, font, color });
    ly -= interlineado;
  }
  return ly;
}

/* ------------------------------------------------------------------ */
/*  Generación del PDF                                                 */
/* ------------------------------------------------------------------ */

async function generarPdf(datos: DatosReporte): Promise<Uint8Array> {
  const { perfil, kpis, tipo, fecha, ciudadesRed } = datos;

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);

  const titulo =
    tipo === "sostenibilidad" ? "Reporte de Sostenibilidad" : "Reporte de Impacto Ambiental y Comercial";

  let page = doc.addPage(A4);
  dibujarEncabezado(page, regular, negrita, titulo);
  const contenidoW = ANCHO - 2 * M;
  let y = ALTO - ENC_H - 34;

  // Crea una página nueva si no entra lo suficiente.
  const asegurar = (alto: number): void => {
    if (y - alto < 52) {
      page = doc.addPage(A4);
      dibujarEncabezado(page, regular, negrita, titulo);
      y = ALTO - ENC_H - 30;
    }
  };

  // --- Título y fecha ---
  asegurar(70);
  page.drawText(ascii(titulo), { x: M, y, size: 16, font: negrita, color: OSCURO });
  y -= 19;
  page.drawText(ascii(`Generado el ${fecha} · Uso informativo, no es una certificacion`), {
    x: M,
    y,
    size: 9.5,
    font: regular,
    color: GRIS,
  });
  y -= 26;

  // --- Datos de la empresa ---
  const boxAlto = 70;
  asegurar(boxAlto + 16);
  page.drawRectangle({
    x: M,
    y: y - boxAlto,
    width: contenidoW,
    height: boxAlto,
    color: FONDO,
    borderColor: LINEA,
    borderWidth: 1,
  });
  const colIzq = M + 12;
  const colDer = M + contenidoW / 2 + 4;
  const mitadMax = contenidoW / 2 - 16;
  const filasIzq: Array<[string, string]> = [
    ["Empresa", perfil.company_name],
    ["Ciudad", perfil.city],
    ["CUIT", perfil.cuit || "sin dato"],
  ];
  const filasDer: Array<[string, string]> = [
    ["Titular", perfil.full_name],
    ["Rol", perfil.role],
    ["Emitido", fecha],
  ];
  const pintarFila = (x: number, top: number, par: [string, string]): void => {
    page.drawText(ascii(par[0]), { x, y: top, size: 8, font: regular, color: GRIS });
    dibujarAjustado(page, par[1], {
      x: x + 72,
      y: top - 1,
      size: 9.5,
      font: negrita,
      color: OSCURO,
      max: mitadMax - 72,
    });
  };
  let filaY = y - 20;
  for (const par of filasIzq) {
    pintarFila(colIzq, filaY, par);
    filaY -= 17;
  }
  filaY = y - 20;
  for (const par of filasDer) {
    pintarFila(colDer, filaY, par);
    filaY -= 17;
  }
  y -= boxAlto + 22;

  // --- Tabla de KPIs ---
  asegurar(60);
  page.drawText(ascii("Indicadores clave"), { x: M, y, size: 11.5, font: negrita, color: VERDE });
  y -= 8;
  page.drawRectangle({ x: M, y: y - 2.5, width: 64, height: 2.5, color: VERDE });
  y -= 22;

  const filas: Array<[string, string]> = [
    ["Toneladas publicadas en ofertas", `${n1(kpis.tonPublicadas)} t`],
    ["Ofertas registradas", `${kpis.ofertas}`],
    ["Toneladas en ordenes", `${n1(kpis.tonOrdenes)} t`],
    ["Ordenes registradas", `${kpis.ordenes}`],
    ["Contratos activos", `${kpis.contratosActivos}`],
    ["Toneladas contratadas (activas)", `${n1(kpis.tonContratadas)} t`],
    ["Entregas programadas", `${kpis.entregasProgramadas} (${n1(kpis.tonProgramadas)} t)`],
    ["Entregas realizadas", `${kpis.entregasRealizadas} (${n1(kpis.tonEntregadas)} t)`],
    ["Entregas retrasadas", `${kpis.entregasRetrasadas}`],
  ];
  if (tipo === "impacto") {
    filas.push(
      ["Emisiones estimadas (ofertas, total)", `${n2(kpis.co2Ofertas)} tCO2e`],
      ["Emision media por oferta", `${n2(kpis.co2PromedioOferta)} tCO2e`],
      ["Emisiones estimadas (ordenes)", `${n2(kpis.co2Ordenes)} tCO2e`],
      ["Distancia media usuario-oferta", `${Math.round(kpis.distPromedio)} km`],
    );
  }

  const filaAlto = 17;
  const cabAlto = 18;
  asegurar(filas.length * filaAlto + cabAlto + 26);
  const tablaTop = y;
  let ry = y;
  page.drawRectangle({ x: M, y: ry - cabAlto, width: contenidoW, height: cabAlto, color: VERDE });
  const cabBase = ry - cabAlto + 5.5;
  page.drawText(ascii("Indicador"), { x: M + 8, y: cabBase, size: 9, font: negrita, color: BLANCO });
  const cabValor = "Valor";
  const cabValorW = negrita.widthOfTextAtSize(cabValor, 9);
  page.drawText(cabValor, {
    x: M + contenidoW - 8 - cabValorW,
    y: cabBase,
    size: 9,
    font: negrita,
    color: BLANCO,
  });
  ry -= cabAlto;
  filas.forEach(([k, v], i) => {
    if (i % 2 === 1) {
      page.drawRectangle({ x: M, y: ry - filaAlto, width: contenidoW, height: filaAlto, color: FONDO });
    }
    const base = ry - filaAlto + 5.5;
    page.drawText(ascii(k), { x: M + 8, y: base, size: 9, font: regular, color: OSCURO });
    const val = ascii(v);
    const vw = negrita.widthOfTextAtSize(val, 9);
    page.drawText(val, {
      x: M + contenidoW - 8 - vw,
      y: base,
      size: 9,
      font: negrita,
      color: VERDE,
    });
    ry -= filaAlto;
  });
  page.drawRectangle({
    x: M,
    y: ry,
    width: contenidoW,
    height: tablaTop - ry,
    borderColor: LINEA,
    borderWidth: 1,
  });
  y = ry - 22;

  // --- Metodología y supuestos ---
  asegurar(70);
  page.drawText(ascii("Metodologia y supuestos"), { x: M, y, size: 11.5, font: negrita, color: VERDE });
  y -= 8;
  page.drawRectangle({ x: M, y: y - 2.5, width: 138, height: 2.5, color: VERDE });
  y -= 20;

  const factorTxt = CO2_FACTOR.toString().replace(".", ",");
  const parrafos: string[] = [];
  if (tipo === "impacto") {
    parrafos.push(
      `Las emisiones de transporte se estiman con un factor de ${factorTxt} kg CO2e por tonelada transportada por kilometro. La distancia se calcula con la formula haversine entre la ciudad del usuario y la ciudad de cada oferta, sobre las ${ciudadesRed} localidades de la red NEA, con un factor de correccion de ruta de 1,25 (radio terrestre de 6.371 km). Formula: emisiones (tCO2e) = toneladas x distancia (km) x ${factorTxt} kg CO2e/t*km / 1.000. El total es la suma sobre las ofertas del usuario; el promedio se divide entre la cantidad de ofertas. Para las ordenes se aplica el mismo factor entre la ciudad de origen y la de destino.`,
    );
  } else {
    parrafos.push(
      "Este reporte resume la actividad registrada en la plataforma: ofertas publicadas, ordenes, contratos de abastecimiento y calendario de entregas. El avance por clausulas hacia ISO 14001 se calcula en el modulo de Sostenibilidad con datos de demostracion y no se incluye aqui como evaluacion de conformidad.",
    );
  }
  parrafos.push(
    "Los indicadores comerciales (toneladas publicadas, ordenes, contratos activos y entregas) provienen de los registros propios del usuario en la plataforma, consultados con el nivel de acceso del usuario (politicas RLS de Supabase). Las emisiones, cuando se informan, son una estimacion informativa y comparativa: no son una medicion de inventario conforme a la GHG Protocol ni una atribucion certificada, y no reemplazan el calculo de huella de carbono de alcance 1, 2 o 3 de una organizacion.",
  );

  for (const p of parrafos) {
    const lineas = partirLineas(p, regular, 9, contenidoW);
    asegurar(lineas.length * 12 + 14);
    y = dibujarParrafo(page, lineas, M, y, 9, 12, regular, OSCURO) - 8;
  }

  // --- Aviso destacado ---
  const disclaimer =
    "Documento informativo generado por BioNexo NEA. No constituye una certificacion ambiental oficial. Datos de demostracion identificados como simulados cuando corresponda.";
  const lineasDisp = partirLineas(disclaimer, negrita, 9, contenidoW - 24);
  const dispAlto = lineasDisp.length * 12 + 18;
  asegurar(dispAlto + 30);
  page.drawText(ascii("Aviso importante"), { x: M, y: y - 12, size: 9.5, font: negrita, color: VERDE });
  y -= 18;
  page.drawRectangle({
    x: M,
    y: y - dispAlto,
    width: contenidoW,
    height: dispAlto,
    color: rgb(1, 0.976, 0.929),
    borderColor: VERDE,
    borderWidth: 1.5,
  });
  let dy = y - 17;
  for (const l of lineasDisp) {
    page.drawText(l, { x: M + 12, y: dy, size: 9, font: negrita, color: OSCURO });
    dy -= 12;
  }
  y -= dispAlto;

  // --- Pie de página en todas las hojas ---
  const paginas = doc.getPages();
  paginas.forEach((p, i) => {
    const txt = ascii(`BioNexo NEA · Reporte informativo · Pagina ${i + 1} de ${paginas.length}`);
    const w = regular.widthOfTextAtSize(txt, 8);
    p.drawText(txt, { x: (ANCHO - w) / 2, y: 28, size: 8, font: regular, color: GRIS });
  });

  return doc.save();
}

/* ------------------------------------------------------------------ */
/*  PDF BioNexo Carbon (tipo=carbono)                                  */
/* ------------------------------------------------------------------ */

async function generarPdfCarbono(d: DatosCarbono): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);

  const ROTULO = "BioNexo Carbon";
  let page = doc.addPage(A4);
  dibujarEncabezado(page, regular, negrita, ROTULO);
  const contenidoW = ANCHO - 2 * M;
  let y = ALTO - ENC_H - 34;

  const asegurar = (alto: number): void => {
    if (y - alto < 52) {
      page = doc.addPage(A4);
      dibujarEncabezado(page, regular, negrita, ROTULO);
      y = ALTO - ENC_H - 30;
    }
  };

  const seccion = (texto: string): void => {
    asegurar(48);
    page.drawText(ascii(texto), { x: M, y, size: 11.5, font: negrita, color: VERDE });
    y -= 8;
    page.drawRectangle({ x: M, y: y - 2.5, width: Math.min(260, contenidoW), height: 2.5, color: VERDE });
    y -= 20;
  };

  const parrafo = (
    texto: string,
    opts?: { bold?: boolean; size?: number; color?: RGB; despues?: number },
  ): void => {
    const size = opts?.size ?? 9;
    const font = opts?.bold ? negrita : regular;
    const lineas = partirLineas(texto, font, size, contenidoW);
    if (lineas.length === 0) return;
    asegurar(lineas.length * (size + 3) + 14);
    y = dibujarParrafo(page, lineas, M, y, size, size + 3, font, opts?.color ?? OSCURO) - (opts?.despues ?? 8);
  };

  const item = (texto: string): void => {
    const size = 9;
    const lineas = partirLineas(texto, regular, size, contenidoW - 18);
    if (lineas.length === 0) return;
    asegurar(lineas.length * 12 + 8);
    let ly = y;
    page.drawText(ascii("-"), { x: M + 6, y: ly, size, font: negrita, color: VERDE });
    for (const l of lineas) {
      page.drawText(l, { x: M + 18, y: ly, size, font: regular, color: OSCURO });
      ly -= 12;
    }
    y = ly - 4;
  };

  const tabla = (cols: { label: string; w: number }[], filas: string[][]): void => {
    if (filas.length === 0) return;
    const filaAlto = 16;
    const cabAlto = 18;
    const encabezado = (): void => {
      page.drawRectangle({ x: M, y: y - cabAlto, width: contenidoW, height: cabAlto, color: VERDE });
      let cx = M + 8;
      for (const c of cols) {
        page.drawText(ascii(c.label), { x: cx, y: y - cabAlto + 5.5, size: 9, font: negrita, color: BLANCO });
        cx += c.w;
      }
    };

    asegurar(cabAlto + filaAlto + 8);
    let tablaTop = y;
    encabezado();
    let ry = y - cabAlto;

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      if (ry - filaAlto < 52) {
        page.drawRectangle({ x: M, y: ry, width: contenidoW, height: tablaTop - ry, borderColor: LINEA, borderWidth: 1 });
        asegurar(cabAlto + filaAlto + 8);
        tablaTop = y;
        encabezado();
        ry = y - cabAlto;
      }
      if (i % 2 === 1) {
        page.drawRectangle({ x: M, y: ry - filaAlto, width: contenidoW, height: filaAlto, color: FONDO });
      }
      let fx = M + 8;
      fila.forEach((celda, j) => {
        const col = cols[j];
        if (!col) return;
        dibujarAjustado(page, celda, {
          x: fx,
          y: ry - filaAlto + 5.5,
          size: 8.5,
          font: regular,
          color: OSCURO,
          max: col.w - 8,
        });
        fx += col.w;
      });
      ry -= filaAlto;
    }

    page.drawRectangle({ x: M, y: ry, width: contenidoW, height: tablaTop - ry, borderColor: LINEA, borderWidth: 1 });
    y = ry - 22;
  };

  const aviso = (titulo: string, texto: string): void => {
    const lineas = partirLineas(texto, negrita, 9, contenidoW - 24);
    const alto = lineas.length * 12 + 34;
    asegurar(alto + 30);
    page.drawText(ascii(titulo), { x: M, y: y - 12, size: 9.5, font: negrita, color: VERDE });
    y -= 18;
    page.drawRectangle({ x: M, y: y - alto, width: contenidoW, height: alto, color: rgb(1, 0.976, 0.929), borderColor: VERDE, borderWidth: 1.5 });
    let dy = y - 17;
    for (const l of lineas) {
      page.drawText(l, { x: M + 12, y: dy, size: 9, font: negrita, color: OSCURO });
      dy -= 12;
    }
    y -= alto;
  };

  /* ------------------------------ Contenido ------------------------------ */

  asegurar(90);
  page.drawText(ascii("Analisis ambiental y potencial de certificacion"), {
    x: M,
    y,
    size: 16,
    font: negrita,
    color: OSCURO,
  });
  y -= 19;
  page.drawText(
    ascii(
      `${d.perfil.company_name || d.perfil.full_name || "Empresa"} · ${d.perfil.city || "-"} · ${d.kpis.ofertas} publicacion(es)`,
    ),
    { x: M, y, size: 9.5, font: regular, color: GRIS },
  );
  y -= 13;
  page.drawText(ascii(`Generado el ${d.fecha}`), { x: M, y, size: 9, font: regular, color: GRIS });
  y -= 24;

  aviso(
    "Las tres categorias de este informe",
    "Impacto estimado: calculado con los factores documentados de la plataforma (seccion 3), es una estimacion informativa y NO una medicion certificada. Potencial de certificacion: describe que faltaria para certificar un proyecto (linea base, laboratorio, trazabilidad, verificador y registro). Creditos certificados: 0 - ni una publicacion ni un acuerdo registrado generan creditos de carbono por si solos.",
  );
  y -= 10;

  // 1. Material publicado y trazabilidad.
  seccion("1. Material publicado y trazabilidad");
  if (d.ofertas.length > 0) {
    tabla(
      [
        { label: "Producto / subproducto", w: 220 },
        { label: "Ciudad", w: 150 },
        { label: "Toneladas", w: 117 },
      ],
      d.ofertas.map((o) => [o.product, o.city, `${n1(num(o.quantity_tons))} t`]),
    );
  } else {
    parrafo("No hay publicaciones propias registradas en este periodo.");
  }
  parrafo(
    `Cada analisis guardado quedo asociado al material publicado (producto, toneladas y fecha) y puede reutilizarse en el chat comercial y en los contratos existentes. Distancia promedio de tu red: ${n1(d.kpis.distPromedio)} km.`,
  );

  // 2. Análisis ambientales guardados.
  seccion("2. Análisis ambientales guardados");
  if (d.analisis.length === 0) {
    parrafo(
      "Todavia no hay analisis guardados en la trazabilidad. Desde el panel de Reporte de Impacto se genera el analisis de cada publicacion y se guarda con su fecha, destino evaluado y factores aplicados.",
    );
  } else {
    d.analisis.forEach((a, idx) => {
      const fecha = new Date(a.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const fuente = a.source === "ia" ? "IA asistida" : "reglas documentadas";
      parrafo(`${idx + 1}) ${fecha} · ${a.product} · ${n1(num(a.tons))} t · fuente: ${fuente}`, {
        bold: true,
        size: 9.5,
        despues: 4,
      });
      if (a.pathway) parrafo(`Destino evaluado principal: ${a.pathway}.`);
      const almacenado = a.co2_stored === null ? "no calculable" : `${n2(num(a.co2_stored))} tCO2e (potencial teorico)`;
      const evitado =
        a.co2_avoided === null ? "sin linea base: no se calculan" : `${n2(num(a.co2_avoided))} tCO2e`;
      parrafo(`Almacenamiento: ${almacenado}. Emisiones evitadas: ${evitado}. Nivel de certificacion: ${a.certification_level} (sin verificador externo).`);
      if (a.summary) parrafo(a.summary, { size: 8.5, color: GRIS });
      const requisitos = Array.isArray(a.certification_requirements)
        ? (a.certification_requirements as unknown[]).filter((r): r is string => typeof r === "string").slice(0, 6)
        : [];
      requisitos.forEach((r) => item(r));
      y -= 6;
    });
  }

  // 3. Factores.
  seccion("3. Factores de calculo y emisiones estimadas");
  tabla(
    [
      { label: "Factor", w: 240 },
      { label: "Valor y unidad", w: 130 },
      { label: "Estado", w: 117 },
    ],
    FACTORES.map((f) => [
      f.nombre,
      f.valor === null ? `no calculable · ${f.unidad}` : `${String(f.valor).replace(".", ",")} · ${f.unidad}`,
      f.estado === "requiere_verificacion"
        ? "requiere verificacion"
        : f.estado === "pendiente_dato"
          ? "pendiente de dato"
          : "referencia",
    ]),
  );
  FACTORES.forEach((f) => parrafo(`${f.nombre}: ${f.fuente}`, { size: 8.5, color: GRIS, despues: 5 }));
  parrafo(
    `Emisiones de transporte de tus publicaciones con el factor interno de ${String(CO2_FACTOR).replace(".", ",")} kg CO2e/t*km: ${n2(d.kpis.co2Ofertas)} tCO2e en total y ${n2(d.kpis.co2PromedioOferta)} tCO2e en promedio por publicacion.`,
    { bold: true },
  );

  // 4. Compradores disponibles.
  seccion("4. Compradores disponibles y requisitos");
  if (d.demanda.length > 0) {
    tabla(
      [
        { label: "Producto demandado", w: 180 },
        { label: "Compradores", w: 100 },
        { label: "Toneladas", w: 100 },
        { label: "Ciudades", w: 107 },
      ],
      d.demanda.map((x) => [
        x.product,
        String(x.compradores),
        `${n1(num(x.toneladas))} t`,
        x.ciudades.slice(0, 4).join(", ") || "-",
      ]),
    );
    parrafo(
      "La demanda se muestra agregada (conteo y volumen) para no exponer datos personales de los compradores. Los nombres propios aparecen unicamente cuando ya existe una conversacion comercial en la plataforma.",
      { size: 8.5, color: GRIS },
    );
  } else {
    parrafo("Hoy no hay necesidades de compra activas publicadas en la plataforma para estos productos.");
  }

  // 5. Acuerdos de reparto.
  seccion("5. Acuerdos de reparto de beneficios por creditos");
  if (d.acuerdos.length === 0) {
    parrafo(
      "No hay acuerdos de reparto registrados. Se proponen desde el chat comercial o desde el panel de BioNexo Carbon y la otra parte debe aceptarlos para quedar en estado 'aceptado'.",
    );
  } else {
    tabla(
      [
        { label: "Fecha", w: 62 },
        { label: "Material", w: 138 },
        { label: "Vendedor / Comprador", w: 150 },
        { label: "Reparto", w: 75 },
        { label: "Estado", w: 62 },
      ],
      d.acuerdos.map((a) => [
        new Date(a.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }),
        `${a.product} · ${n1(num(a.tons))} t`,
        `${d.nombres[a.seller_id] ?? "Vendedor"} / ${d.nombres[a.buyer_id] ?? "Comprador"}`,
        `${n1(num(a.seller_share_pct))}% / ${n1(num(a.buyer_share_pct))}%`,
        a.status,
      ]),
    );
    d.acuerdos
      .filter((a) => a.notes && a.notes.trim())
      .forEach((a) => parrafo(`Nota (${a.product}): ${a.notes}`, { size: 8.5, color: GRIS, despues: 5 }));
    parrafo(
      "Un acuerdo de reparto no genera creditos: fija por anticipado como se repartiria el ingreso si el proyecto llega a certificarse.",
      { size: 8.5, color: GRIS },
    );
  }

  // 6. Requisitos de certificación.
  seccion("6. Requisitos para una posible certificacion");
  parrafo(
    "Esquemas habituales de referencia (verificar vigencia y elegibilidad con un verificador antes de invertir): Verra VCS, Gold Standard, Plan Vivo y CAM - Contribucion de Argentina a la Mitigacion Climatica.",
  );
  REQUISITOS_BASE.forEach((r) => item(r));

  // 7. Metodología.
  seccion("7. Metodologia y limites");
  parrafo(
    "El almacenamiento potencial en biochar no se cuantifica hasta contar con rendimiento de pirolisis, contenido de carbono, humedad y estabilidad medidos bajo el protocolo elegido. Las emisiones evitadas tampoco se calculan: dependen de la linea base real del destino actual del material, dato que debe aportar el productor.",
  );
  parrafo(
    "Las cifras son estimaciones informativas y comparativas: no constituyen una medicion conforme a la GHG Protocol, una verificacion de terceros ni una certificacion ambiental. Vender un subproducto no genera creditos de carbono automaticamente.",
  );

  aviso(
    "Aviso importante",
    "Documento informativo generado por BioNexo NEA. No constituye una certificacion ambiental, una evaluacion de conformidad ni una oferta de venta de creditos de carbono. Los creditos certificados informados en este documento son 0.",
  );

  // Pie de página.
  const paginas = doc.getPages();
  paginas.forEach((p, i) => {
    const txt = ascii(`BioNexo NEA · BioNexo Carbon · Pagina ${i + 1} de ${paginas.length}`);
    const w = regular.widthOfTextAtSize(txt, 8);
    p.drawText(txt, { x: (ANCHO - w) / 2, y: 28, size: 8, font: regular, color: GRIS });
  });

  return doc.save();
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

export async function GET(request: Request): Promise<Response> {
  try {
    // 1) Token de sesión de Supabase enviado por el cliente.
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!bearerToken) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2) Cliente servidor: el token viaja en los headers globales para que
    //    las políticas RLS de Supabase se apliquen como ese usuario.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${bearerToken}` } } },
    );

    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }
    const userId = auth.user.id;

    // 3) Datos del usuario (RLS incluida).
    const [perfilRes, ofertasRes, ordenesRes, contratosRes, entregasRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, company_name, cuit, city, role")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("offers").select("city, quantity_tons").eq("owner_id", userId),
      supabase
        .from("orders")
        .select("quantity_tons, origin_city, destination_city")
        .eq("created_by", userId),
      supabase
        .from("contracts")
        .select("id, product, quantity_tons, unit_price, frequency, duration_months, start_date, status"),
      supabase.from("contract_deliveries").select("due_date, quantity_tons, status"),
    ]);

    if (perfilRes.error) throw new Error(`Perfil: ${perfilRes.error.message}`);
    if (ofertasRes.error) throw new Error(`Ofertas: ${ofertasRes.error.message}`);
    if (ordenesRes.error) throw new Error(`Ordenes: ${ordenesRes.error.message}`);
    if (contratosRes.error) throw new Error(`Contratos: ${contratosRes.error.message}`);
    if (entregasRes.error) throw new Error(`Entregas: ${entregasRes.error.message}`);

    const perfil = perfilRes.data as PerfilRow | null;
    if (!perfil) throw new Error("No se encontro el perfil del usuario");

    const ofertas = (ofertasRes.data ?? []) as OfertaRow[];
    const ordenes = (ordenesRes.data ?? []) as OrdenRow[];
    const contratos = (contratosRes.data ?? []) as ContratoRow[];
    const entregas = (entregasRes.data ?? []) as EntregaRow[];

    // 4) KPIs.
    const contratosActivos = contratos.filter((c) => c.status === "activo");
    const entregasRealizadas = entregas.filter((e) => e.status === "entregada");
    const entregasRetrasadas = entregas.filter((e) => e.status === "retrasada");

    let co2Ofertas = 0;
    let distTotal = 0;
    for (const o of ofertas) {
      const d = km(perfil.city, o.city);
      distTotal += d;
      co2Ofertas += (num(o.quantity_tons) * d * CO2_FACTOR) / 1000;
    }
    let co2Ordenes = 0;
    for (const o of ordenes) {
      co2Ordenes += (num(o.quantity_tons) * km(o.origin_city, o.destination_city) * CO2_FACTOR) / 1000;
    }

    const kpis: Kpis = {
      ofertas: ofertas.length,
      tonPublicadas: ofertas.reduce((a, o) => a + num(o.quantity_tons), 0),
      ordenes: ordenes.length,
      tonOrdenes: ordenes.reduce((a, o) => a + num(o.quantity_tons), 0),
      contratosActivos: contratosActivos.length,
      tonContratadas: contratosActivos.reduce((a, c) => a + num(c.quantity_tons), 0),
      entregasProgramadas: entregas.length,
      tonProgramadas: entregas.reduce((a, e) => a + num(e.quantity_tons), 0),
      entregasRealizadas: entregasRealizadas.length,
      tonEntregadas: entregasRealizadas.reduce((a, e) => a + num(e.quantity_tons), 0),
      entregasRetrasadas: entregasRetrasadas.length,
      co2Ofertas,
      co2PromedioOferta: ofertas.length ? co2Ofertas / ofertas.length : 0,
      co2Ordenes,
      distPromedio: ofertas.length ? distTotal / ofertas.length : 0,
    };

    const tipoParam = new URL(request.url).searchParams.get("tipo");
    const tipo: TipoReporte =
      tipoParam === "sostenibilidad" ? "sostenibilidad" : tipoParam === "carbono" ? "carbono" : "impacto";

    const fecha = new Date().toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });

    // 5) PDF BioNexo Carbon (análisis + potencial de certificación).
    if (tipo === "carbono") {
      const [ofertasRes, analisisRes, acuerdosRes, demandaRes] = await Promise.all([
        supabase.from("offers").select("id, product, city, quantity_tons").eq("owner_id", userId),
        supabase
          .from("carbon_analyses")
          .select(
            "id, product, tons, source, summary, pathway, co2_avoided, co2_stored, certification_level, certification_requirements, created_at",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("carbon_agreements")
          .select("id, seller_id, buyer_id, product, tons, seller_share_pct, buyer_share_pct, status, notes, created_at")
          .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
          .order("created_at", { ascending: false })
          .limit(25),
        supabase.rpc("demanda_por_producto"),
      ]);

      // Si alguna consulta falla, el PDF lo informa como "sin datos" en vez de romper la descarga.
      if (ofertasRes.error) console.error("[reporte carbono] ofertas:", ofertasRes.error.message);
      if (analisisRes.error) console.error("[reporte carbono] analisis:", analisisRes.error.message);
      if (acuerdosRes.error) console.error("[reporte carbono] acuerdos:", acuerdosRes.error.message);
      if (demandaRes.error) console.error("[reporte carbono] demanda:", demandaRes.error.message);

      const analisis = analisisRes.error ? [] : ((analisisRes.data ?? []) as AnalisisCarbonRow[]);
      const acuerdos = acuerdosRes.error ? [] : ((acuerdosRes.data ?? []) as AcuerdoCarbonRow[]);
      const demanda = demandaRes.error ? [] : ((demandaRes.data ?? []) as DemandaFila[]);

      // Nombres de las partes de cada acuerdo (sólo contrapartes visibles por RLS).
      const nombres: Record<string, string> = {};
      const idsPartes = [...new Set(acuerdos.flatMap((a) => [a.seller_id, a.buyer_id]).filter(Boolean))];
      if (idsPartes.length > 0) {
        const { data: perfiles } = await supabase.rpc("ver_perfiles", { p_ids: idsPartes });
        for (const p of (perfiles ?? []) as { id: string; company_name?: string; full_name?: string }[]) {
          nombres[p.id] = p.company_name || p.full_name || "Empresa";
        }
      }

      const pdf = await generarPdfCarbono({
        perfil,
        fecha,
        ciudadesRed: Object.keys(CITIES).length,
        kpis,
        ofertas: ((ofertasRes.data ?? []) as OfertaCarbonRow[]) ?? [],
        analisis,
        acuerdos,
        demanda,
        nombres,
      });

      return new Response(pdf as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="bionexo-carbon.pdf"',
          // Nunca servir un PDF viejo desde la caché del navegador.
          "Cache-Control": "no-store, must-revalidate",
        },
      });
    }

    const datos: DatosReporte = {
      tipo,
      perfil,
      kpis,
      fecha,
      ciudadesRed: Object.keys(CITIES).length,
    };

    // 6) PDF.
    const pdf = await generarPdf(datos);

    return new Response(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="reporte-bionexo.pdf"',
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error inesperado al generar el reporte";
    return Response.json({ error: mensaje }, { status: 500 });
  }
}
