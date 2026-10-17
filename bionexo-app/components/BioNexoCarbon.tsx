"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, Btn, Muted, DemoTag } from "./ui";
import ReporteButton from "./ReporteButton";
import { useStore } from "@/lib/store";
import { km } from "@/lib/data";
import {
  FACTORES,
  emisionesTransporte,
  type AnalisisCarbono,
} from "@/lib/carbon-core";
import {
  cargarNombresCarbon,
  guardarAnalisis,
  listarAcuerdos,
  listarAnalisis,
  proponerAcuerdo,
  responderAcuerdo,
  solicitarAnalisis,
  suscribirseAAcuerdos,
  type AcuerdoCarbon,
  type AnalisisGuardado,
} from "@/lib/carbon";
import { listarConversaciones, type Conversacion } from "@/lib/chat";
import { listarContratos, type Contrato } from "@/lib/contracts";

/* -------------------------------------------------------------------------- */
/*  BioNexo Carbon — módulo principal dentro de "Reporte de Impacto".          */
/*  Arriba: análisis IA + destinos + certificación + compradores + acuerdos +  */
/*  trazabilidad + PDF. Abajo (en Impacto.tsx) queda todo lo existente.        */
/* -------------------------------------------------------------------------- */

const nf = (v: number, max = 2): string => v.toLocaleString("es-AR", { maximumFractionDigits: max });
const fechaCorta = (iso: string): string =>
  new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

const COLOR_ESTADO: Record<string, { c: string; b: string }> = {
  propuesto: { c: "#92400e", b: "#fef3c7" },
  aceptado: { c: "#166534", b: "#dcfce7" },
  rechazado: { c: "#991b1b", b: "#fee2e2" },
  archivado: { c: "#4b5563", b: "#f3f4f6" },
};

const TH: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 700,
  color: "var(--color-muted-fg)",
  borderBottom: "1px solid #e3e8e3",
  whiteSpace: "nowrap",
};

const TD: React.CSSProperties = {
  padding: "10px",
  fontSize: 13,
  verticalAlign: "top",
  borderBottom: "1px solid #eef1ee",
};

function Badge({
  children,
  color = "#4b5563",
  bg = "#f3f4f6",
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 700,
        color,
        background: bg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bn-card" style={{ padding: 16 }}>
      <div style={{ fontSize: 12, color: "var(--color-muted-fg)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{value}</div>
      {hint ? <div style={{ fontSize: 11.5, color: "var(--color-muted-fg)", marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}

function Seccion({
  n,
  titulo,
  hint,
  children,
}: {
  n: number;
  titulo: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>
          {n}. {titulo}
        </h3>
        {hint ? <Muted>{hint}</Muted> : null}
      </div>
      <div style={{ marginTop: 14, display: "grid", gap: 14 }}>{children}</div>
    </Card>
  );
}

function PanelPlegable({
  titulo,
  resumen,
  children,
}: {
  titulo: string;
  resumen: string;
  children: React.ReactNode;
}) {
  return (
    <details className="bn-card" style={{ padding: 0, overflow: "hidden" }}>
      <summary
        style={{
          cursor: "pointer",
          listStyle: "none",
          padding: "16px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span>
          <strong>{titulo}</strong>
          <span style={{ display: "block", marginTop: 3, fontSize: 12.5, color: "var(--color-muted-fg)" }}>
            {resumen}
          </span>
        </span>
        <Badge color="#166534" bg="#dcfce7">Ver detalle</Badge>
      </summary>
      <div style={{ borderTop: "1px solid var(--color-border)", padding: "16px 18px", display: "grid", gap: 14 }}>
        {children}
      </div>
    </details>
  );
}

export default function BioNexoCarbon() {
  const { pubs, user } = useStore();

  const [analisis, setAnalisis] = useState<AnalisisCarbono | null>(null);
  const [guardados, setGuardados] = useState<AnalisisGuardado[]>([]);
  const [acuerdos, setAcuerdos] = useState<AcuerdoCarbon[]>([]);
  const [convs, setConvs] = useState<Conversacion[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});

  const [ofertaSel, setOfertaSel] = useState<number | null>(null);
  const [pregunta, setPregunta] = useState("");
  const [cargandoAnalisis, setCargandoAnalisis] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error" | "info"; texto: string } | null>(null);

  const [formAbierto, setFormAbierto] = useState(false);
  const [convSel, setConvSel] = useState("");
  const [tonAcuerdo, setTonAcuerdo] = useState(10);
  const [pctVendedor, setPctVendedor] = useState(50);
  const [notas, setNotas] = useState("");

  const userId = user?.id ?? null;

  const mias = useMemo(
    () => (userId ? pubs.filter((p) => p.ownerId === userId && !p.simulated) : []),
    [pubs, userId],
  );

  const refrescar = useCallback(async () => {
    if (!userId) return;
    const [g, a, c, ct] = await Promise.all([
      listarAnalisis(userId),
      listarAcuerdos(userId),
      listarConversaciones(userId),
      listarContratos(userId),
    ]);
    setGuardados(g);
    setAcuerdos(a);
    setConvs(c.filter((x) => x.sellerId === userId && x.status !== "cerrada"));
    setContratos(ct);
    setNombres(
      await cargarNombresCarbon([...a.flatMap((x) => [x.sellerId, x.buyerId]), ...c.map((x) => x.buyerId)]),
    );
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refrescar(), 0);
    return () => window.clearTimeout(timer);
  }, [refrescar]);

  // Realtime: cada usuario escucha su propio tópico (seller y buyer).
  useEffect(() => {
    if (!userId) return;
    const canalVendedor = suscribirseAAcuerdos(
      `carbon-ac-vendedor-${userId}`,
      `seller_id.eq.${userId}`,
      () => void refrescar(),
    );
    const canalComprador = suscribirseAAcuerdos(
      `carbon-ac-comprador-${userId}`,
      `buyer_id.eq.${userId}`,
      () => void refrescar(),
    );
    return () => {
      canalVendedor.close();
      canalComprador.close();
    };
  }, [userId, refrescar]);

  const ofertaEfectiva = mias.some((p) => p.id === ofertaSel) ? ofertaSel : (mias[0]?.id ?? null);
  const pubSel = mias.find((p) => p.id === ofertaEfectiva) ?? null;
  const tPublicadas = mias.reduce((a, p) => a + p.t, 0);
  const emisionesTotales = mias.reduce(
    (a, p) => a + emisionesTransporte(p.t, km(user?.city ?? "", p.city)),
    0,
  );

  async function analizar(): Promise<void> {
    if (!pubSel) return;
    setCargandoAnalisis(true);
    setAviso(null);
    const r = await solicitarAnalisis(pubSel.id, pubSel.city, pregunta);
    if (r.ok && r.analisis) {
      setAnalisis(r.analisis);
      setAviso({ tipo: r.iaDisponible ? "ok" : "info", texto: r.message });
    } else {
      setAviso({ tipo: "error", texto: r.message });
    }
    setCargandoAnalisis(false);
  }

  async function guardar(): Promise<void> {
    if (!analisis || !userId) return;
    setGuardando(true);
    const r = await guardarAnalisis(analisis, ofertaEfectiva, userId);
    setAviso({ tipo: r.ok ? "ok" : "error", texto: r.message });
    setGuardando(false);
    if (r.ok) void refrescar();
  }

  async function responder(id: number, aceptar: boolean): Promise<void> {
    const r = await responderAcuerdo(id, aceptar);
    setAviso({ tipo: r.ok ? "ok" : "error", texto: r.message });
    if (r.ok) void refrescar();
  }

  function abrirFormulario(): void {
    const primera = convs[0];
    if (primera) {
      const pub = mias.find((p) => p.id === primera.offerId);
      setConvSel(primera.id);
      setTonAcuerdo(pub?.t ?? 10);
      setPctVendedor(50);
      setNotas("");
    }
    setFormAbierto((v) => !v);
  }

  async function proponer(): Promise<void> {
    const conv = convs.find((c) => c.id === convSel);
    if (!conv || !userId) return;
    const contrato = contratos.find((c) => c.conversationId === conv.id);
    const r = await proponerAcuerdo({
      conversationId: conv.id,
      contractId: contrato?.id ?? null,
      offerId: conv.offerId,
      sellerId: userId,
      buyerId: conv.buyerId,
      product: conv.product,
      tons: tonAcuerdo,
      sellerSharePct: pctVendedor,
      buyerSharePct: 100 - pctVendedor,
      notes: notas,
      proposedBy: userId,
    });
    setAviso({ tipo: r.ok ? "ok" : "error", texto: r.message });
    if (r.ok) {
      setFormAbierto(false);
      void refrescar();
    }
  }

  if (!user) return null;

  return (
    <>
      {/* ------------------------------ TÍTULO ------------------------------ */}
      <Card
        style={{
          background: "linear-gradient(135deg, #ecfdf5 0%, #f7fee7 55%, #ffffff 100%)",
          border: "1px solid #bbf7d0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div style={{ minWidth: 260, flex: "1 1 340px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>BioNexo Carbon</h2>
              <DemoTag />
              <Badge color="#166534" bg="#dcfce7">Módulo ambiental principal</Badge>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.5 }}>
              Analizá una publicación, compará destinos y registrá su trazabilidad y potencial de certificación.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Badge color="#1d4ed8" bg="#dbeafe">1. Impacto estimado</Badge>
            <Badge color="#92400e" bg="#fef3c7">2. Potencial de certificación</Badge>
            <Badge color="#991b1b" bg="#fee2e2">3. Créditos certificados: 0</Badge>
            <ReporteButton
              tipo="carbono"
              archivo="bionexo-carbon.pdf"
              label="Descargar PDF"
            />
          </div>
        </div>
        <p
          style={{
            margin: "14px 0 0",
            fontSize: 13,
            lineHeight: 1.5,
            color: "#92400e",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 12,
            padding: "10px 14px",
          }}
        >
          <strong>Importante:</strong> vender un subproducto no genera créditos automáticamente.
          Las estimaciones no son una certificación y sólo se muestran datos verificables de la plataforma.
        </p>
      </Card>

      {aviso ? (
        <p
          role={aviso.tipo === "error" ? "alert" : "status"}
          style={{
            margin: "0 0 16px",
            padding: "10px 14px",
            borderRadius: 12,
            fontSize: 13,
            background: aviso.tipo === "error" ? "#fee2e2" : aviso.tipo === "ok" ? "#dcfce7" : "#eef2ff",
            color: aviso.tipo === "error" ? "#991b1b" : aviso.tipo === "ok" ? "#166534" : "#3730a3",
            border: `1px solid ${aviso.tipo === "error" ? "#fecaca" : aviso.tipo === "ok" ? "#bbf7d0" : "#c7d2fe"}`,
          }}
        >
          {aviso.texto}
        </p>
      ) : null}

      {/* ------------------------ 1. ANÁLISIS CON IA ------------------------ */}
      <Seccion n={1} titulo="Análisis ambiental con IA" hint="trabajá sobre tus publicaciones reales">
        {mias.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14 }}>
            <Muted>
              Todavía no tenés publicaciones propias. Subí un producto o subproducto desde tu panel
              y volvé a este análisis.
            </Muted>
          </p>
        ) : (
          <>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
              <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>Publicación a analizar</span>
                <select
                  className="bn-input"
                  value={ofertaEfectiva ?? ""}
                  onChange={(e) => setOfertaSel(Number(e.target.value))}
                >
                  {mias.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product} · {nf(p.t, 1)} t · {p.city}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>Tu pregunta (opcional)</span>
                <input
                  className="bn-input"
                  value={pregunta}
                  onChange={(e) => setPregunta(e.target.value)}
                  placeholder="Ej.: ¿qué falta para certificar biochar con esta cascarilla?"
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Btn onClick={() => void analizar()} disabled={cargandoAnalisis || !pubSel}>
                {cargandoAnalisis ? "Analizando…" : "Analizar potencial con IA"}
              </Btn>
              {analisis ? (
                <Btn kind="sec" onClick={() => void guardar()} disabled={guardando}>
                  {guardando ? "Guardando…" : "Guardar análisis (trazabilidad)"}
                </Btn>
              ) : null}
              <Muted>
                {analisis
                  ? analisis.fuente === "ia"
                    ? `Fuente: IA (${analisis.model ?? "modelo"}) · datos y factores de la base`
                    : "Fuente: factores documentados de la app (IA sin configurar o sin respuesta)"
                  : "El análisis se calcula con datos reales de la plataforma y factores documentados."}
              </Muted>
            </div>
          </>
        )}

        {analisis ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
              }}
            >
              <Kpi
                label="Transporte del material"
                value={`${nf(analisis.transporte.tco2e)} tCO2e`}
                hint={`${nf(analisis.transporte.toneladas, 1)} t · ${nf(analisis.transporte.km, 0)} km · factor ${String(analisis.transporte.factor).replace(".", ",")}`}
              />
              <Kpi
                label="Almacenamiento potencial (biochar)"
                value={analisis.almacenamientoBiochar !== null ? `${nf(analisis.almacenamientoBiochar)} tCO2e` : "no calculable"}
                hint="Potencial teórico, no es un crédito"
              />
              <Kpi label="Emisiones evitadas" value="sin línea base" hint="Falta el dato del destino actual del material" />
              <Kpi
                label="Potencial de certificación"
                value={analisis.certificacion.nivel}
                hint="Evaluación cualitativa, sin verificador externo"
              />
            </div>

            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{analisis.resumen}</p>

            <details style={{ border: "1px solid var(--color-border)", borderRadius: 14, overflow: "hidden" }}>
              <summary style={{ cursor: "pointer", padding: "12px 14px", fontWeight: 700 }}>
                Ver destinos, compradores y requisitos de certificación
              </summary>
              <div style={{ borderTop: "1px solid var(--color-border)", padding: 14, display: "grid", gap: 16 }}>
              <div>
              <h4 style={{ margin: "0 0 8px" }}>Destinos comerciales y ambientales comparados</h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                  <thead>
                    <tr>
                      <th style={TH}>Destino</th>
                      <th style={TH}>Evitación (tCO2e/t)</th>
                      <th style={TH}>Almacenamiento (tCO2e/t)</th>
                      <th style={TH}>Verificabilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analisis.destinos.map((d) => (
                      <tr key={d.destino}>
                        <td style={TD}>
                          <strong>{d.destino}</strong>
                          <div style={{ color: "var(--color-muted-fg)", fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>
                            {d.nota}
                          </div>
                        </td>
                        <td style={TD}>{d.evitacion === null ? "sin línea base" : nf(d.evitacion)}</td>
                        <td style={TD}>{d.almacenamiento === null ? "no calculable" : nf(d.almacenamiento)}</td>
                        <td style={TD}>
                          <Badge
                            color={d.verificabilidad === "alta" ? "#166534" : d.verificabilidad === "media" ? "#92400e" : "#991b1b"}
                            bg={d.verificabilidad === "alta" ? "#dcfce7" : d.verificabilidad === "media" ? "#fef3c7" : "#fee2e2"}
                          >
                            {d.verificabilidad}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              }}
            >
              <div>
                <h4 style={{ margin: "0 0 8px" }}>
                  Potencial de certificación:{" "}
                  <span style={{ color: "var(--color-primary, #228b22)" }}>{analisis.certificacion.nivel}</span>
                </h4>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-muted-fg)" }}>
                  {analisis.certificacion.nota}
                </p>
                <p style={{ margin: "0 0 8px", fontSize: 13 }}>
                  <strong>Esquemas de referencia:</strong> {analisis.certificacion.esquemas.join(" · ")}
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontSize: 13 }}>
                  {analisis.certificacion.requisitos.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 style={{ margin: "0 0 8px" }}>Compradores disponibles</h4>
                {analisis.demanda.length === 0 && analisis.compradoresDirectos.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13 }}>
                    <Muted>No hay necesidades de compra activas ni conversaciones de este producto en la plataforma.</Muted>
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {analisis.demanda.map((d) => (
                      <div
                        key={d.producto}
                        style={{ border: "1px solid #e6eae6", borderRadius: 12, padding: "10px 12px", fontSize: 13 }}
                      >
                        <strong>{d.producto}</strong>: {d.compradores} comprador
                        {d.compradores === 1 ? "" : "es"} · {nf(d.toneladas, 1)} t
                        {d.ciudades.length ? <div style={{ fontSize: 12, color: "var(--color-muted-fg)" }}>{d.ciudades.join(" · ")}</div> : null}
                        <div style={{ fontSize: 11.5, color: "var(--color-muted-fg)" }}>
                          Demanda agregada: no se muestran datos personales.
                        </div>
                      </div>
                    ))}
                    {analisis.compradoresDirectos.map((c) => (
                      <div
                        key={c.conversacionId}
                        style={{
                          border: "1px solid #dbeafe",
                          background: "#f8faff",
                          borderRadius: 12,
                          padding: "10px 12px",
                          fontSize: 13,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <span>
                          <strong>{c.nombre}</strong> · en conversación por {c.producto}
                        </span>
                        <Link href={`/mensajes/${c.conversacionId}`} style={{ fontSize: 13 }}>
                          Ir al chat →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {analisis.advertencias.length > 0 ? (
              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "grid",
                  gap: 6,
                }}
              >
                {analisis.advertencias.map((a) => (
                  <div key={a} style={{ fontSize: 13, color: "#92400e" }}>
                    ⚠ {a}
                  </div>
                ))}
              </div>
            ) : null}
              </div>
            </details>
          </div>
        ) : null}
      </Seccion>

      {/* -------------------- 2. FACTORES Y EMISIONES -------------------- */}
      <PanelPlegable
        titulo="Metodología y factores ambientales"
        resumen={`${nf(tPublicadas, 1)} t publicadas · ${nf(emisionesTotales)} tCO2e de transporte estimado · créditos certificados: 0`}
      >
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
          <Kpi label="Toneladas publicadas por vos" value={`${nf(tPublicadas, 1)} t`} hint={`${mias.length} publicación(es)`} />
          <Kpi label="Emisiones de transporte" value={`${nf(emisionesTotales)} tCO2e`} hint="Σ t × km × 0,062 kg CO2e/t·km ÷ 1.000" />
          <Kpi
            label="Almacenamiento potencial en biochar"
            value="no calculable"
            hint="Faltan rendimiento de pirólisis y análisis de laboratorio"
          />
          <Kpi label="Créditos certificados" value="0" hint="Requiere verificación y registro" />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr>
                <th style={TH}>Factor</th>
                <th style={TH}>Valor</th>
                <th style={TH}>Unidad</th>
                <th style={TH}>Estado</th>
                <th style={TH}>Fuente</th>
              </tr>
            </thead>
            <tbody>
              {FACTORES.map((f) => (
                <tr key={f.id}>
                  <td style={TD}>
                    <strong>{f.nombre}</strong>
                  </td>
                  <td style={TD}>{f.valor === null ? "—" : nf(f.valor, 3)}</td>
                  <td style={TD}>{f.unidad}</td>
                  <td style={TD}>
                    <Badge
                      color={f.estado === "referencia" ? "#1d4ed8" : f.estado === "requiere_verificacion" ? "#92400e" : "#991b1b"}
                      bg={f.estado === "referencia" ? "#dbeafe" : f.estado === "requiere_verificacion" ? "#fef3c7" : "#fee2e2"}
                    >
                      {f.estado === "requiere_verificacion"
                        ? "requiere verificación"
                        : f.estado === "pendiente_dato"
                          ? "pendiente de dato"
                          : "referencia"}
                    </Badge>
                  </td>
                  <td style={{ ...TD, fontSize: 12, color: "var(--color-muted-fg)", maxWidth: 340 }}>{f.fuente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-muted-fg)" }}>
          El factor de transporte es una referencia interna de la plataforma (orden de magnitud de
          flota pesada). Los parámetros de carbono y estabilidad se confirman con laboratorio y con
          el protocolo del esquema elegido. Sin línea base del destino actual no se calcula ninguna
          emisión evitada.
        </p>
      </PanelPlegable>

      {/* --------------------- 3. ACUERDOS DE REPARTO --------------------- */}
      <PanelPlegable
        titulo="Acuerdos con compradores"
        resumen={`${acuerdos.length} acuerdo(s) registrado(s) · vinculados al chat y contratos`}
      >
        {acuerdos.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14 }}>
            <Muted>
              Todavía no hay acuerdos. Si llegás a certificar un proyecto con un comprador, el reparto
              del ingreso por créditos se acuerda acá y queda vinculado a la conversación y al
              contrato correspondiente.
            </Muted>
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {acuerdos.map((a) => {
              const color = COLOR_ESTADO[a.status] ?? COLOR_ESTADO.archivado;
              const contrato = contratos.find((c) => c.id === a.contractId);
              const soyParte = a.sellerId === userId || a.buyerId === userId;
              return (
                <div
                  key={a.id}
                  style={{
                    border: "1px solid #e6eae6",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "grid",
                    gap: 8,
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: 14 }}>
                      <strong>{a.product}</strong> · {nf(a.tons, 1)} t · {fechaCorta(a.createdAt)}
                      {contrato ? (
                        <span style={{ color: "var(--color-muted-fg)", fontSize: 12.5 }}>
                          {" "}
                          · contrato #{contrato.id.slice(0, 8)}
                        </span>
                      ) : null}
                    </div>
                    <Badge color={color.c} bg={color.b}>{a.status}</Badge>
                  </div>

                  <div style={{ fontSize: 13 }}>
                    <strong>{nombres[a.sellerId] ?? "Vendedor"}</strong> (vendedor) {nf(a.sellerSharePct, 0)}% ·{" "}
                    <strong>{nombres[a.buyerId] ?? "Comprador"}</strong> (comprador) {nf(a.buyerSharePct, 0)}% de un
                    eventual ingreso por créditos certificados
                  </div>

                  {a.notes ? (
                    <div style={{ fontSize: 13, color: "var(--color-muted-fg)" }}>Nota: {a.notes}</div>
                  ) : null}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {a.conversationId ? (
                      <Link href={`/mensajes/${a.conversationId}`} style={{ fontSize: 13 }}>
                        Ver en el chat →
                      </Link>
                    ) : null}
                    {soyParte && a.status === "propuesto" && a.proposedBy !== userId ? (
                      <>
                        <Btn onClick={() => void responder(a.id, true)}>Aceptar acuerdo</Btn>
                        <Btn kind="ghost" onClick={() => void responder(a.id, false)}>
                          Rechazar
                        </Btn>
                      </>
                    ) : null}
                    {a.status === "propuesto" && a.proposedBy === userId ? (
                      <Muted>Esperando la respuesta de la otra parte</Muted>
                    ) : null}
                    {a.status === "aceptado" ? (
                      <Muted>Ambas partes aceptaron · aún sin certificar</Muted>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Btn kind="sec" onClick={abrirFormulario} disabled={convs.length === 0}>
            {formAbierto ? "Cerrar formulario" : "Proponer acuerdo de reparto"}
          </Btn>
          {convs.length === 0 ? (
            <Muted>Necesitás una conversación abierta con un comprador para proponer un acuerdo.</Muted>
          ) : null}
        </div>

        {formAbierto && convs.length > 0 ? (
          <div
            style={{
              border: "1px solid #dbeafe",
              background: "#f8faff",
              borderRadius: 14,
              padding: "14px",
              display: "grid",
              gap: 12,
            }}
          >
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>Conversación con el comprador</span>
              <select className="bn-input" value={convSel} onChange={(e) => setConvSel(e.target.value)}>
                {convs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.buyerName} · {c.product} · {c.city || "sin ciudad"}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
              <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>Toneladas del acuerdo</span>
                <input
                  className="bn-input"
                  type="number"
                  min={0}
                  step="0.5"
                  value={tonAcuerdo}
                  onChange={(e) => setTonAcuerdo(Math.max(0, Number(e.target.value)))}
                />
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>Participación del vendedor: {pctVendedor}%</span>
                <input
                  className="bn-input"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={pctVendedor}
                  onChange={(e) => setPctVendedor(Number(e.target.value))}
                />
                <span style={{ fontSize: 12, color: "var(--color-muted-fg)" }}>
                  Comprador: {100 - pctVendedor}%
                </span>
              </label>
            </div>
            <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>Condiciones / notas</span>
              <textarea
                className="bn-input"
                rows={3}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej.: si el proyecto se certifica, el ingreso se reparte según los porcentajes; cada parte costea su verificación."
              />
            </label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Btn onClick={() => void proponer()} disabled={!convSel || tonAcuerdo <= 0}>
                Registrar propuesta
              </Btn>
              <Muted>La otra parte recibe una notificación y debe aceptarla en el chat.</Muted>
            </div>
          </div>
        ) : null}
      </PanelPlegable>

      {/* --------------------- 4. TRAZABILIDAD GUARDADA --------------------- */}
      <PanelPlegable
        titulo="Trazabilidad del material"
        resumen={`${guardados.length} análisis guardado(s) con fecha, fuente y publicación`}
      >
        {guardados.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14 }}>
            <Muted>Ningún análisis guardado todavía. Hacé un análisis arriba y guardalo para dejar registro.</Muted>
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {guardados.map((g) => (
              <div
                key={g.id}
                style={{ border: "1px solid #e6eae6", borderRadius: 14, padding: "12px 14px", background: "#fff" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                    fontSize: 14,
                  }}
                >
                  <div>
                    <strong>{g.product}</strong> · {nf(g.tons, 1)} t · {fechaCorta(g.createdAt)}
                    {g.pathway ? <span style={{ color: "var(--color-muted-fg)" }}> · destino: {g.pathway}</span> : null}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Badge color={g.source === "ia" ? "#1d4ed8" : "#4b5563"} bg={g.source === "ia" ? "#dbeafe" : "#f3f4f6"}>
                      {g.source === "ia" ? "IA" : "reglas"}
                    </Badge>
                    <Badge color="#92400e" bg="#fef3c7">certificación: {g.certificationLevel}</Badge>
                  </div>
                </div>
                <div style={{ fontSize: 13, marginTop: 6, color: "var(--color-muted-fg)", lineHeight: 1.5 }}>
                  {g.summary}
                </div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  Almacenamiento potencial: {g.co2Stored !== null ? `${nf(g.co2Stored)} tCO2e` : "no calculable"} ·
                  Evitación: {g.co2Avoided !== null ? `${nf(g.co2Avoided)} tCO2e` : "sin línea base"} ·
                  Créditos certificados: 0
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelPlegable>
    </>
  );
}
