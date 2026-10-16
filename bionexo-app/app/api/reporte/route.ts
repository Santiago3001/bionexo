import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { CITIES, CO2_FACTOR, km } from "@/lib/data";

/* ------------------------------------------------------------------ */
/*  Tipos                                                              */
/* ------------------------------------------------------------------ */

type TipoReporte = "impacto" | "sostenibilidad";

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
      `Las emisiones de transporte se estiman con un factor de ${factorTxt} tCO2e por tonelada transportada por kilometro (transporte rodado, carga completa). La distancia se calcula con la formula haversine entre la ciudad del usuario y la ciudad de cada oferta, sobre las ${ciudadesRed} localidades de la red NEA, con un factor de correccion de ruta de 1,25 (radio terrestre de 6.371 km). Formula: emisiones = toneladas x distancia (km) x ${factorTxt} tCO2e/t*km. El total es la suma sobre las ofertas del usuario; el promedio se divide entre la cantidad de ofertas. Para las ordenes se aplica el mismo factor entre la ciudad de origen y la de destino.`,
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
      co2Ofertas += num(o.quantity_tons) * d * CO2_FACTOR;
    }
    let co2Ordenes = 0;
    for (const o of ordenes) {
      co2Ordenes += num(o.quantity_tons) * km(o.origin_city, o.destination_city) * CO2_FACTOR;
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

    const tipo: TipoReporte =
      new URL(request.url).searchParams.get("tipo") === "sostenibilidad" ? "sostenibilidad" : "impacto";

    const datos: DatosReporte = {
      tipo,
      perfil,
      kpis,
      fecha: new Date().toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" }),
      ciudadesRed: Object.keys(CITIES).length,
    };

    // 5) PDF.
    const pdf = await generarPdf(datos);

    return new Response(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="reporte-bionexo.pdf"',
      },
    });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error inesperado al generar el reporte";
    return Response.json({ error: mensaje }, { status: 500 });
  }
}
