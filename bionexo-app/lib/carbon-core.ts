/* ---------------------------------------------------------------------------
 * BioNexo Carbon — núcleo compartido entre la app (cliente) y las rutas API.
 *
 * Principios:
 *  1. Tres categorías SIEMPRE separadas:
 *       - impacto estimado      → cálculo con factores documentados
 *       - potencial de certificación → qué faltaría para certificar
 *       - créditos certificados → sólo si hay un verificador y registro que lo
 *                                 avale; acá siempre arranca en 0.
 *  2. No se inventan compradores, bonos, precios ni resultados ambientales:
 *     los números salen de los factores de FACTORES y de los datos de la base.
 *  3. Cuando falta un dato (línea base real del proceso) el valor es `null`
 *     y la app explica qué dato hace falta, en lugar de inventar una cifra.
 * ------------------------------------------------------------------------ */

export type NivelCertificacion = "bajo" | "medio" | "alto";
export type FuenteAnalisis = "reglas" | "ia";
export type EstadoFactor = "referencia" | "requiere_verificacion" | "pendiente_dato";
export type Verificabilidad = "alta" | "media" | "baja";

export interface FactorEmision {
  id: string;
  nombre: string;
  valor: number | null;
  unidad: string;
  fuente: string;
  estado: EstadoFactor;
}

export interface DestinoAmbiental {
  destino: string;
  /** tCO2e evitadas por tonelada. `null` = no calculable sin línea base real. */
  evitacion: number | null;
  /** tCO2e almacenadas por tonelada (sólo caminos que fijan carbono). */
  almacenamiento: number | null;
  verificabilidad: Verificabilidad;
  nota: string;
}

export interface DemandaProducto {
  producto: string;
  compradores: number;
  toneladas: number;
  ciudades: string[];
}

export interface CompradorDirecto {
  nombre: string;
  producto: string;
  conversacionId: string;
}

export interface AnalisisCarbono {
  fuente: FuenteAnalisis;
  model: string | null;
  producto: string;
  toneladas: number;
  ciudad: string;
  resumen: string;
  destinos: DestinoAmbiental[];
  certificacion: {
    nivel: NivelCertificacion;
    esquemas: string[];
    requisitos: string[];
    nota: string;
  };
  transporte: { km: number; toneladas: number; tco2e: number; factor: number };
  almacenamientoBiochar: number | null;
  demanda: DemandaProducto[];
  compradoresDirectos: CompradorDirecto[];
  creditosCertificados: number;
  advertencias: string[];
}

/* --------------------------- Factores verificables ---------------------- */

export const FACTORES: FactorEmision[] = [
  {
    id: "transporte",
    nombre: "Transporte de carga por carretera",
    valor: 0.062,
    unidad: "kg CO2e / t·km",
    fuente:
      "Factor interno de BioNexo (lib/data.ts, CO2_FACTOR). Orden de magnitud de flota pesada, distancia haversine corregida ×1,25 sobre las ciudades de la red.",
    estado: "referencia",
  },
  {
    id: "carbono_materia_seca",
    nombre: "Contenido de carbono de materia seca lignocelulósica",
    valor: 0.5,
    unidad: "tC / t materia seca",
    fuente:
      "Composición típica de biomasa vegetal (~50% carbono). Se confirma sólo con análisis de laboratorio del material (carbono, humedad, cenizas).",
    estado: "requiere_verificacion",
  },
  {
    id: "estabilizacion_biochar",
    nombre: "Fracción de carbono estabilizada en biochar (horizonte 100 años)",
    valor: 0.8,
    unidad: "fracción 0–1",
    fuente:
      "Parámetro de estabilidad de pirólisis lenta. Depende de la temperatura de proceso y debe verificarse con el protocolo del esquema elegido.",
    estado: "requiere_verificacion",
  },
  {
    id: "linea_base_disposicion",
    nombre: "Evitación por desplazamiento de la disposición actual",
    valor: null,
    unidad: "tCO2e / t",
    fuente:
      "Depende de qué haga hoy el productor con el material (quema a cielo abierto, playa de disposición, vertedero, uso energético previo). Sin ese dato la app no calcula la cifra.",
    estado: "pendiente_dato",
  },
];

export const ESQUEMAS_CERTIFICACION = [
  "Verra VCS",
  "Gold Standard",
  "Plan Vivo",
  "CAM – Contribución de Argentina a la Mitigación Climática",
];

export const REQUISITOS_BASE: string[] = [
  "Línea base: qué ocurre hoy con el material (destino actual y emisiones de ese destino).",
  "Delimitación del proyecto, periodo de crédito y reglas del esquema elegido.",
  "Laboratorio del material: contenido de carbono, humedad y cenizas.",
  "Trazabilidad de masa: recepción, procesamiento, transporte y entrega con registros.",
  "Adicionalidad: demostrar que el proyecto no ocurre sin el ingreso por créditos.",
  "Monitoreo periódico y verificación por tercero acreditado.",
  "Registro público del proyecto en el esquema elegido.",
  "Contrato entre comprador y vendedor para repartir el ingreso por créditos (registrable acá).",
];

/* --------------------------------- Destinos ----------------------------- */

const DESTINO_BIOCHAR: DestinoAmbiental = {
  destino: "Biochar (pirólisis)",
  evitacion: null,
  almacenamiento: null,
  verificabilidad: "media",
  nota: "Candidato más robusto para almacenar carbono: fija una fracción del carbono en forma estable. Para certificar hace falta trazabilidad de masa, análisis de carbono y estabilidad, línea base y verificación por tercero.",
};

const DESTINO_BIOMASA: DestinoAmbiental = {
  destino: "Biomasa energética (combustión controlada)",
  evitacion: null,
  almacenamiento: 0,
  verificabilidad: "media",
  nota: "No almacena: el carbono del material se libera al combustionar. Puede evitar emisiones sólo si desplaza un combustible fósil concreto; para cuantificarlo falta saber qué sustituye y su línea base.",
};

const DESTINO_CONSTRUCCION: DestinoAmbiental = {
  destino: "Construcción (cemento, ladrillo, adipe, relleno)",
  evitacion: null,
  almacenamiento: 0,
  verificabilidad: "baja",
  nota: "El carbono se libera si el material se cuece. El aporte ambiental vendría de reemplazar material virgen: eso se mide aparte, con la línea base del material sustituido.",
};

const DESTINO_COMPOST: DestinoAmbiental = {
  destino: "Compostaje / enmienda de suelos",
  evitacion: null,
  almacenamiento: null,
  verificabilidad: "baja",
  nota: "La retención de carbono es incierta y hay que medir las emisiones de CH4 y N2O del proceso. Sin protocolo de medición no se calcula un valor.",
};

const DESTINO_USO_DIRECTO: DestinoAmbiental = {
  destino: "Uso directo (envase, relleno, cama animal)",
  evitacion: null,
  almacenamiento: 0,
  verificabilidad: "media",
  nota: "Almacenamiento de corto plazo: el carbono vuelve al ciclo cuando el producto se descarta o se quema. La evitación depende de qué material reemplaza hoy, dato que falta.",
};

const DESTINO_ENERGIA_SIN_CARBONO: DestinoAmbiental = {
  destino: "Relave / aprovechamiento sin transformación",
  evitacion: null,
  almacenamiento: 0,
  verificabilidad: "baja",
  nota: "No transforma el material: no genera almacenamiento ni una evitación medible por sí solo.",
};

/** Destinos comparados por producto. `Cascarilla de arroz` tiene el set completo. */
export const DESTINOS_POR_PRODUCTO: Record<string, DestinoAmbiental[]> = {
  "Cascarilla de arroz": [
    DESTINO_BIOCHAR,
    DESTINO_BIOMASA,
    DESTINO_CONSTRUCCION,
    DESTINO_COMPOST,
    DESTINO_USO_DIRECTO,
  ],
  "Aserrín de pino": [DESTINO_BIOCHAR, DESTINO_BIOMASA, DESTINO_COMPOST, DESTINO_USO_DIRECTO],
  "Bagazo de caña": [DESTINO_BIOCHAR, DESTINO_BIOMASA, DESTINO_CONSTRUCCION, DESTINO_COMPOST],
  "Residuo de yerba": [DESTINO_BIOCHAR, DESTINO_COMPOST, DESTINO_USO_DIRECTO],
  "Afrechillo de trigo": [DESTINO_BIOMASA, DESTINO_COMPOST, DESTINO_USO_DIRECTO],
  "Viruta de madera dura": [DESTINO_BIOCHAR, DESTINO_BIOMASA, DESTINO_CONSTRUCCION, DESTINO_COMPOST],
};

export function destinosPara(producto: string): DestinoAmbiental[] {
  return DESTINOS_POR_PRODUCTO[producto] ?? [
    DESTINO_BIOCHAR,
    DESTINO_BIOMASA,
    DESTINO_COMPOST,
    DESTINO_ENERGIA_SIN_CARBONO,
  ];
}

/* -------------------------------- Cálculos ------------------------------ */

/** Emisiones de transporte para un volumen que recorre `distancia` km. */
export function emisionesTransporte(toneladas: number, distancia: number): number {
  const factor = FACTORES.find((f) => f.id === "transporte")?.valor ?? 0.062;
  return (toneladas * distancia * factor) / 1000;
}

/** No se cuantifica sin rendimiento de pirólisis, carbono, humedad y estabilidad medidos. */
export function almacenamientoBiochar(): null {
  return null;
}

/** Nivel de certificación que se puede afirmar SIN verificador externo. */
export function nivelPorReglas(hayDemanda: boolean): NivelCertificacion {
  return hayDemanda ? "medio" : "bajo";
}

/* --------------------------- Análisis por reglas ------------------------ */

export interface InsumoAnalisis {
  producto: string;
  toneladas: number;
  ciudad: string;
  distanciaKm: number;
  demanda: DemandaProducto[];
  compradoresDirectos: CompradorDirecto[];
}

/**
 * Análisis reproducible sin IA: sólo usa los factores documentados y los datos
 * reales de la plataforma. Nunca inventa evitaciones: deja `evitacion: null`.
 */
export function analizarPorReglas(insumo: InsumoAnalisis): AnalisisCarbono {
  const destinos = destinosPara(insumo.producto);
  const demandaPropia = insumo.demanda.filter(
    (d) => d.producto.toLowerCase() === insumo.producto.toLowerCase(),
  );
  const compradores = demandaPropia.reduce((a, d) => a + d.compradores, 0);
  const tonDemandadas = demandaPropia.reduce((a, d) => a + d.toneladas, 0);
  const ciudades = [...new Set(demandaPropia.flatMap((d) => d.ciudades))];

  const tco2eTransporte = emisionesTransporte(insumo.toneladas, insumo.distanciaKm);
  const almacenamiento = almacenamientoBiochar();

  const resumen = [
    `Material: ${insumo.producto} · ${insumo.toneladas} t publicadas en ${insumo.ciudad || "tu ciudad"}.`,
    compradores > 0
      ? `Demanda real en la plataforma: ${compradores} comprador${compradores === 1 ? "" : "es"} activo${compradores === 1 ? "" : "es"} por ${tonDemandadas} t (${ciudades.join(", ") || "sin ciudad informada"}).`
      : "No hay necesidades de compra activas de este producto en la plataforma todavía.",
    insumo.compradoresDirectos.length > 0
      ? `Ya estás en conversación con: ${insumo.compradoresDirectos.map((c) => c.nombre).join(", ")}.`
      : "Todavía no hay conversaciones abiertas con compradores de este material.",
    `Transporte estimado (${insumo.distanciaKm} km): ${tco2eTransporte.toFixed(2)} tCO2e con el factor interno de 0,062 kg CO2e/t·km.`,
    "El almacenamiento potencial en biochar no se cuantifica sin rendimiento de pirólisis, carbono, humedad y estabilidad medidos.",
    "Las emisiones evitadas no se calculan: falta la línea base del destino actual del material.",
  ].join(" ");

  return {
    fuente: "reglas",
    model: null,
    producto: insumo.producto,
    toneladas: insumo.toneladas,
    ciudad: insumo.ciudad,
    resumen,
    destinos,
    certificacion: {
      nivel: nivelPorReglas(compradores > 0),
      esquemas: ESQUEMAS_CERTIFICACION,
      requisitos: REQUISITOS_BASE,
      nota: "Evaluación cualitativa hecha con los factores de la app. Ningún requisito está cumplido todavía: no hay crédito certificado.",
    },
    transporte: {
      km: insumo.distanciaKm,
      toneladas: insumo.toneladas,
      tco2e: tco2eTransporte,
      factor: FACTORES.find((f) => f.id === "transporte")?.valor ?? 0.062,
    },
    almacenamientoBiochar: almacenamiento,
    demanda: demandaPropia,
    compradoresDirectos: insumo.compradoresDirectos,
    creditosCertificados: 0,
    advertencias: [
      "Vender el subproducto no genera créditos de carbono: sólo se vuelve un crédito cuando un proyecto pasa verificación y registro.",
      "Los factores de carbono y estabilidad son parámetros documentados, no mediciones del material: requieren laboratorio.",
      "Toda cifra de 'emisiones evitadas' queda pendiente hasta tener la línea base del destino actual.",
    ],
  };
}

/* ----------------------------- Salida del modelo ------------------------ */

/**
 * Prompt del sistema para /api/carbon. Incluye sólo datos reales y le prohíbe
 * inventar compradores, bonos, precios o resultados ambientales.
 */
export function construirPromptCarbono(contexto: {
  insumo: InsumoAnalisis;
  base: AnalisisCarbono;
}): string {
  const { insumo, base } = contexto;
  return [
    "Sos el analista ambiental de BioNexo Carbon, módulo de BioNexo NEA (marketplace B2B de subproductos agroindustriales del Nordeste argentino). Respondés SIEMPRE en español rioplatense, concreto.",
    "",
    "REGLAS INQUEBRANTABLES:",
    "1. PROHIBIDO inventar compradores, precios, bonos, proyectos registrados, volúmenes o resultados ambientales. Todo dato numérico debe venir del CONTEXTO de abajo.",
    "2. Diferenciá SIEMPRE tres categorías: (a) impacto estimado, (b) potencial de certificación, (c) créditos realmente certificados. En este caso los créditos certificados son SIEMPRE 0.",
    "3. 'evitacion_tco2e_t' sólo puede ser null (no hay línea base). No calcules emisiones evitadas.",
    "4. 'almacenamiento_tco2e_t' sólo puede repetir el valor del CONTEXTO para ese destino, o null.",
    "5. 'nivel' de certificación sólo puede ser 'bajo' o 'medio': sin verificador externo no se puede afirmar 'alto'.",
    "6. Si un requisito ya está cumplido en el contexto, marcalo; si no, no digas que está cumplido.",
    "",
    "CONTEXTO (datos reales):",
    JSON.stringify({
      material: {
        producto: insumo.producto,
        toneladas: insumo.toneladas,
        ciudad: insumo.ciudad,
        distanciaKm: insumo.distanciaKm,
      },
      factores: FACTORES,
      destinosBase: base.destinos,
      emisionesTransporteTco2e: Number(base.transporte.tco2e.toFixed(3)),
      almacenamientoBiocharTco2e: base.almacenamientoBiochar,
      demandaRealCompradores: base.demanda,
      compradoresEnConversacion: base.compradoresDirectos,
      esquemasCertificacion: ESQUEMAS_CERTIFICACION,
      requisitosCertificacion: REQUISITOS_BASE,
    }),
    "",
    "Devolvé EXCLUSIVAMENTE un objeto JSON válido (sin markdown) con esta forma:",
    '{ "resumen": "3 a 5 frases con el potencial ambiental, qué es medible hoy y qué falta", "destinos": [ { "destino": "nombre exacto del destino", "evitacion": null, "almacenamiento": null, "verificabilidad": "media", "nota": "1-2 frases" } ], "certificacion": { "nivel": "bajo|medio", "esquemas": ["..."], "requisitos": ["..."], "nota": "..." }, "advertencias": ["..."] }',
  ].join("\n");
}

interface ModeloSalida {
  resumen?: unknown;
  destinos?: unknown;
  certificacion?: unknown;
  advertencias?: unknown;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

/**
 * Fusiona la salida del modelo con la base calculada en el servidor.
 * Los números SIEMPRE quedan anclados a DESTINOS base: si el modelo propone un
 * valor que no existe en la base, se descarta y se usa el de la base.
 */
export function fusionarConModelo(base: AnalisisCarbono, raw: string, model: string): AnalisisCarbono {
  const parsed = JSON.parse(raw) as ModeloSalida;
  const destinosModelo = Array.isArray(parsed.destinos) ? parsed.destinos : [];

  const destinos: DestinoAmbiental[] = base.destinos.map((baseDestino) => {
    const cand = destinosModelo.find(
      (d) =>
        typeof d === "object" &&
        d !== null &&
        str((d as Record<string, unknown>).destino).toLowerCase() === baseDestino.destino.toLowerCase(),
    ) as Record<string, unknown> | undefined;
    const verif = cand ? str((cand as Record<string, unknown>).verificabilidad) : "";
    return {
      ...baseDestino,
      nota: cand ? str((cand as Record<string, unknown>).nota, baseDestino.nota) : baseDestino.nota,
      verificabilidad:
        verif === "alta" || verif === "media" || verif === "baja" ? verif : baseDestino.verificabilidad,
      // anclados a la base: el modelo no puede aportar números nuevos
      evitacion: baseDestino.evitacion,
      almacenamiento: baseDestino.almacenamiento,
    };
  });

  const certRaw = (
    typeof parsed.certificacion === "object" && parsed.certificacion !== null
      ? parsed.certificacion
      : {}
  ) as Record<string, unknown>;
  const nivelModelo = str(certRaw.nivel);
  const nivel: NivelCertificacion =
    nivelModelo === "bajo" || nivelModelo === "medio" ? nivelModelo : base.certificacion.nivel;
  const requisitosModelo = Array.isArray(certRaw.requisitos)
    ? certRaw.requisitos.filter((r): r is string => typeof r === "string" && r.trim().length > 0)
    : [];
  const esquemasModelo = Array.isArray(certRaw.esquemas)
    ? certRaw.esquemas.filter((s): s is string => typeof s === "string" && ESQUEMAS_CERTIFICACION.some((e) => e.toLowerCase() === s.toLowerCase()))
    : [];

  const advertenciasModelo = Array.isArray(parsed.advertencias)
    ? parsed.advertencias.filter((a): a is string => typeof a === "string" && a.trim().length > 0)
    : [];

  return {
    ...base,
    fuente: "ia",
    model,
    resumen: str(parsed.resumen, base.resumen),
    destinos,
    certificacion: {
      nivel,
      esquemas: esquemasModelo.length ? esquemasModelo : base.certificacion.esquemas,
      requisitos: [...new Set([...REQUISITOS_BASE, ...requisitosModelo])],
      nota: str(certRaw.nota, base.certificacion.nota),
    },
    advertencias: [...new Set([...base.advertencias, ...advertenciasModelo])],
    creditosCertificados: 0,
  };
}
