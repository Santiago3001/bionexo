"use client";

import { useId, useState } from "react";
import { CO2_FACTOR, km, RATE, usd } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Btn, Card, Modal, Muted, Steps } from "./ui";

const CIRC_BASE = [
  "Seleccionar oferta",
  "Chat formal",
  "Condiciones confirmadas",
  "Contrato anual",
  "Orden y flete",
];

export default function CircuitoCompra({
  pubId,
  onClose,
}: {
  pubId: number;
  onClose: () => void;
}) {
  const { pubs, need, user, addOrders } = useStore();
  const orderId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [step, setStep] = useState(0);

  // Estado de firma digital
  const [isSigned, setIsSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [signerName, setSignerName] = useState(user?.name || user?.company || "Representante Autorizado");
  const [signerRole, setSignerRole] = useState("Responsable de Abastecimiento");
  const [signatureError, setSignatureError] = useState("");

  const pub = pubs.find((p) => p.id === pubId);
  if (!pub || !user) return null;

  const pkm = pub.km ?? km(need.city, pub.city);
  const q = Math.min(need.t, pub.t);

  // Cálculos económicos detallados (Mercadería + Costo de envío / flete)
  const subtotalBiomasaMensual = q * pub.price;
  const subtotalBiomasaAnual = subtotalBiomasaMensual * 12;

  const fleteMensual = pub.flete ?? Math.round(q * pkm * RATE);
  const fleteAnual = fleteMensual * 12;

  const totalMensual = subtotalBiomasaMensual + fleteMensual;
  const totalAnual = subtotalBiomasaAnual + fleteAnual;

  const co2Mensual = ((q * pkm * CO2_FACTOR) / 1000).toFixed(2);

  const contractCode = `CTR-2026-${pub.city.slice(0, 3).toUpperCase()}-${String(pub.id).padStart(4, "0")}`;

  const circLabels = [
    CIRC_BASE[0],
    CIRC_BASE[1],
    CIRC_BASE[2],
    isSigned ? "Contrato firmado ✔" : "Contrato anual (formal)",
    CIRC_BASE[4],
  ];

  const msgs = [
    `Hola, somos ${user.company}. Necesitamos ${need.t} t/mes de ${pub.product.toLowerCase()} con entrega en ${need.city}.`,
    `Hola, podemos ofrecer ${pub.t} t/mes a US$ ${pub.price}/t, calidad ${pub.q}/10. ¿Les sirve entrega mensual?`,
    `Perfecto, confirmamos el requerimiento. Avanzamos con la formalización del contrato anual incluyendo la logística y flete correspondiente.`,
  ];

  function handleSignContract() {
    if (!signerName.trim()) {
      setSignatureError("Por favor indicá el nombre de quien firma el contrato.");
      return;
    }
    setSignatureError("");
    const now = new Date();
    const formatted = now.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setSignedAt(formatted);
    setIsSigned(true);
  }

  function finish() {
    addOrders([
      {
        id: `OC-${pub!.id}-${orderId}`,
        kind: "compra",
        product: pub!.product,
        t: q,
        from: pub!.city,
        to: need.city,
        buyer: user!.company,
        seller: pub!.seller,
        carrier: "Transporte Ávila SRL",
        st: 0,
        eta: "7 días",
        value: totalMensual,
      },
    ]);
    onClose();
  }

  let body = null;

  // Paso 0: Resumen inicial de oferta
  if (step === 0) {
    body = (
      <Card style={{ padding: 20 }}>
        <h4 style={{ margin: "0 0 10px", fontSize: 17, color: "var(--color-foreground)" }}>
          Propuesta comercial seleccionada
        </h4>
        <p style={{ margin: "0 0 12px", lineHeight: 1.5 }}>
          Vas a iniciar la contratación de suministro con <strong>{pub.seller}</strong>:
        </p>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 14 }}>
          <div style={{ background: "var(--color-bg-alt)", padding: "12px 14px", borderRadius: 12 }}>
            <span style={{ fontSize: 12, color: "var(--color-muted-fg)", display: "block" }}>Subproducto</span>
            <strong style={{ fontSize: 15 }}>{pub.product}</strong>
            <span style={{ fontSize: 12, display: "block", color: "var(--color-muted-fg)" }}>Calidad {pub.q}/10</span>
          </div>
          <div style={{ background: "var(--color-bg-alt)", padding: "12px 14px", borderRadius: 12 }}>
            <span style={{ fontSize: 12, color: "var(--color-muted-fg)", display: "block" }}>Volumen mensual</span>
            <strong style={{ fontSize: 15 }}>{q} t/mes</strong>
            <span style={{ fontSize: 12, display: "block", color: "var(--color-muted-fg)" }}>({q * 12} t anuales)</span>
          </div>
          <div style={{ background: "var(--color-bg-alt)", padding: "12px 14px", borderRadius: 12 }}>
            <span style={{ fontSize: 12, color: "var(--color-muted-fg)", display: "block" }}>Subtotal mercadería</span>
            <strong style={{ fontSize: 15 }}>{usd(subtotalBiomasaMensual)}/mes</strong>
            <span style={{ fontSize: 12, display: "block", color: "var(--color-muted-fg)" }}>US$ {pub.price}/t</span>
          </div>
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "12px 14px", borderRadius: 12 }}>
            <span style={{ fontSize: 12, color: "#065f46", display: "block", fontWeight: 600 }}>Costo de envío estimado</span>
            <strong style={{ fontSize: 15, color: "#047857" }}>{usd(fleteMensual)}/mes</strong>
            <span style={{ fontSize: 12, display: "block", color: "#065f46" }}>{pkm} km · US$ {RATE}/t·km</span>
          </div>
        </div>

        <div style={{ background: "var(--color-bg-dark)", color: "#fff", padding: "14px 18px", borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <span style={{ fontSize: 12, opacity: 0.85, display: "block" }}>Inversión mensual estimada (Mercadería + Envío)</span>
            <strong style={{ fontSize: 22, color: "#a7f3d0" }}>{usd(totalMensual)}</strong>
            <span style={{ fontSize: 13, opacity: 0.85 }}> / mes</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 12, opacity: 0.85, display: "block" }}>Total contrato anual (12 meses)</span>
            <strong style={{ fontSize: 18, color: "#fff" }}>{usd(totalAnual)}</strong>
          </div>
        </div>
      </Card>
    );
  }

  // Paso 1: Conversación formal
  if (step === 1) {
    body = (
      <div style={{ display: "grid", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-muted-fg)" }}>
          Registro de intercambio de condiciones técnicas y operativas:
        </p>
        <div
          style={{
            height: 230,
            overflowY: "auto",
            background: "#f8fbf9",
            border: "1px solid var(--color-border)",
            borderRadius: 14,
            padding: 14,
            display: "grid",
            gap: 10,
          }}
        >
          {msgs.map((m, i) => {
            const isBuyer = i === 0 || i === 2;
            return (
              <div
                key={i}
                style={{
                  padding: "10px 14px",
                  borderRadius: 14,
                  maxWidth: "85%",
                  background: isBuyer ? "var(--color-bg-dark)" : "#fff",
                  color: isBuyer ? "#fff" : "var(--color-foreground)",
                  border: isBuyer ? "none" : "1px solid var(--color-border)",
                  marginLeft: isBuyer ? "auto" : 0,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, marginBottom: 4 }}>
                  {isBuyer ? `${user.company} (Comprador)` : `${pub.seller} (Vendedor)`}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.4 }}>{m}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Paso 2: Condiciones confirmadas con desglose de flete
  if (step === 2) {
    body = (
      <Card style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <h4 style={{ margin: 0, fontSize: 17, color: "var(--color-foreground)" }}>
            Términos comerciales y logísticos acordados
          </h4>
          <span style={{ background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
            ✔ CONDICIONES CONFIRMADAS
          </span>
        </div>

        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <td style={{ padding: "8px 0", color: "var(--color-muted-fg)" }}>Subproducto & Calidad</td>
              <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>{pub.product} (Calidad {pub.q}/10)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <td style={{ padding: "8px 0", color: "var(--color-muted-fg)" }}>Volumen mensual</td>
              <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>{q} toneladas / mes ({q * 12} t anuales)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <td style={{ padding: "8px 0", color: "var(--color-muted-fg)" }}>Precio base de mercadería</td>
              <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>US$ {pub.price} / t ({usd(subtotalBiomasaMensual)} / mes)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <td style={{ padding: "8px 0", color: "var(--color-muted-fg)" }}>Ruta de envío / Flete</td>
              <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>{pub.city} → {need.city} ({pkm} km)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--color-border)", background: "#f0fdf4" }}>
              <td style={{ padding: "10px 8px", color: "#166534", fontWeight: 700 }}>
                🚚 Costo de envío / Flete mensual
              </td>
              <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700, color: "#166534" }}>
                {usd(fleteMensual)} / mes <span style={{ fontSize: 11, fontWeight: 400, display: "block" }}>({usd(fleteAnual)} anual · Transporte Ávila SRL)</span>
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <td style={{ padding: "8px 0", color: "var(--color-muted-fg)" }}>Plazo y vigencia</td>
              <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>12 meses continuos</td>
            </tr>
            <tr>
              <td style={{ padding: "12px 0 0", fontSize: 15, fontWeight: 700 }}>Total mensual consolidado</td>
              <td style={{ padding: "12px 0 0", textAlign: "right", fontSize: 17, fontWeight: 800, color: "var(--color-primary)" }}>
                {usd(totalMensual)} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-muted-fg)" }}>/ mes</span>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    );
  }

  // Paso 3: CONTRATO ANUAL FORMAL CON COSTO DE ENVÍO Y FIRMA DIGITAL
  if (step === 3) {
    body = (
      <div style={{ display: "grid", gap: 14 }}>
        {/* Cabecera del Documento Legal */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #c7d8ce",
            borderRadius: 16,
            padding: 22,
            boxShadow: "0 4px 18px rgba(27, 67, 50, 0.06)",
            fontFamily: "var(--font-body)",
          }}
        >
          {/* Encabezado Institucional y Código */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #e2ece5",
              paddingBottom: 14,
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🌿</span>
                <span style={{ fontSize: 12, letterSpacing: "0.08em", fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase" }}>
                  BioNexo Circular · Red Federal
                </span>
              </div>
              <h3 style={{ margin: "4px 0 0", fontSize: 18, color: "var(--color-bg-dark)" }}>
                CONTRATO FORMAL DE SUMINISTRO Y TRANSPORTE DE BIOMASA
              </h3>
              <span style={{ fontSize: 12, color: "var(--color-muted-fg)" }}>
                Instrumento privado de compraventa comercial con flete integrado · Registro N° {contractCode}
              </span>
            </div>

            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                  background: isSigned ? "#dcfce7" : "#fef3c7",
                  color: isSigned ? "#166534" : "#92400e",
                  border: isSigned ? "1px solid #86efac" : "1px solid #fde68a",
                }}
              >
                {isSigned ? "✔ DOCUMENTO FIRMADO Y VINCULANTE" : "⚖ EN PROCESO DE SUSCRIPCIÓN"}
              </span>
              <div style={{ fontSize: 11, color: "var(--color-muted-fg)", marginTop: 4 }}>
                Vigencia: 12 Meses consecutivos
              </div>
            </div>
          </div>

          {/* Partes Intervinientes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
              background: "#f9fcf9",
              border: "1px solid #e0ebe3",
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            <div>
              <strong style={{ color: "var(--color-bg-dark)", display: "block", marginBottom: 4, fontSize: 13 }}>
                PARTE COMPRADORA:
              </strong>
              <div><strong>Razón Social:</strong> {user.company}</div>
              <div><strong>Destino de entrega:</strong> {need.city}, Rep. Argentina</div>
              <div><strong>CUIT / ID:</strong> {user.cuit || "30-71842019-4"}</div>
              <div><strong>Representante:</strong> {signerName}</div>
            </div>

            <div style={{ borderLeft: "1px solid #e0ebe3", paddingLeft: 12 }}>
              <strong style={{ color: "var(--color-bg-dark)", display: "block", marginBottom: 4, fontSize: 13 }}>
                PARTE VENDEDORA (PROVEEDOR):
              </strong>
              <div><strong>Razón Social:</strong> {pub.seller}</div>
              <div><strong>Origen de despacho:</strong> {pub.city}, Rep. Argentina</div>
              <div><strong>CUIT / ID:</strong> 30-68945120-4</div>
              <div><strong>Calidad técnica:</strong> Grado certificado {pub.q}/10</div>
            </div>
          </div>

          {/* Cláusulas del Contrato */}
          <div
            style={{
              maxHeight: 260,
              overflowY: "auto",
              paddingRight: 8,
              fontSize: 12.5,
              lineHeight: 1.55,
              color: "#2c3e35",
              display: "grid",
              gap: 12,
              borderBottom: "1px solid #e2ece5",
              paddingBottom: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <strong style={{ color: "var(--color-bg-dark)" }}>CLÁUSULA PRIMERA (Objeto del contrato):</strong> El VENDEDOR se obliga a suministrar y transferir periódicamente al COMPRADOR el subproducto agroindustrial denominado <strong>{pub.product}</strong>, con índice de calidad certificado de <strong>{pub.q}/10</strong>, apto para procesos de combustión, energía térmica y valorización industrial circular.
            </div>

            <div>
              <strong style={{ color: "var(--color-bg-dark)" }}>CLÁUSULA SEGUNDA (Volumen y Periodicidad):</strong> Las partes pactan un suministro continuo de <strong>{q} toneladas métricas por mes</strong>, a entregarse en lotes regulares mensuales durante una vigencia de <strong>12 meses corridos</strong>, totalizando <strong>{q * 12} toneladas métricas anuales</strong>.
            </div>

            <div>
              <strong style={{ color: "var(--color-bg-dark)" }}>CLÁUSULA TERCERA (Precio de la Mercadería):</strong> Se establece un valor firme de <strong>US$ {pub.price} por tonelada</strong> de biomasa puesta en planta de origen. El subtotal mensual de mercadería asciende a <strong>{usd(subtotalBiomasaMensual)}</strong>, resultando en un subtotal anual acumulado de <strong>{usd(subtotalBiomasaAnual)}</strong>.
            </div>

            {/* CLÁUSULA CUARTA: COSTO DE ENVÍO Y LOGÍSTICA (Petición clave) */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <strong style={{ color: "#166534", display: "block", marginBottom: 3 }}>
                🚚 CLÁUSULA CUARTA (Logística, Transporte y Costo de Envío):
              </strong>
              La logística integral de traslado será ejecutada bajo supervisión de BioNexo con el operador oficial <strong>Transporte Ávila SRL</strong>, cubriendo el trayecto desde la planta de origen en <strong>{pub.city}</strong> hasta el establecimiento de destino en <strong>{need.city}</strong> (distancia de <strong>{pkm} km</strong>).
              <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, fontSize: 12 }}>
                <div>• Tarifa de flete: <strong>US$ {RATE.toFixed(2)} / t·km</strong></div>
                <div>• <strong>Costo de envío mensual:</strong> <strong style={{ color: "#166534" }}>{usd(fleteMensual)} / mes</strong></div>
                <div>• <strong>Costo de envío anual (12 meses):</strong> <strong style={{ color: "#166534" }}>{usd(fleteAnual)}</strong></div>
                <div>• Emisiones de transporte calculadas: <strong>{co2Mensual} tCO2e/mes</strong></div>
              </div>
            </div>

            <div>
              <strong style={{ color: "var(--color-bg-dark)" }}>CLÁUSULA QUINTA (Condiciones de Pago y Liquidación):</strong> El COMPRADOR liquidará el importe correspondiente mensualmente a 30 días fecha de remito conformado, tras la verificación del pesaje oficial en báscula fiscal de destino y confirmación técnica de recepción.
            </div>

            <div>
              <strong style={{ color: "var(--color-bg-dark)" }}>CLÁUSULA SEXTA (Validez Jurídica de Firma Electrónica):</strong> Ambas partes declaran y aceptan expresamente que la suscripción electrónica y digital efectuada a través de la plataforma BioNexo posee plena eficacia probatoria, fuerza vinculante y validez jurídica equivalente a instrumento privado refrendado.
            </div>
          </div>

          {/* Cuadro Resumen Económico Consolidado */}
          <div
            style={{
              background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
              color: "#fff",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 18,
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Desglose Económico Consolidado del Contrato
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 11, opacity: 0.8, display: "block" }}>Subtotal Biomasa ({q * 12} t/año)</span>
                <strong style={{ fontSize: 16 }}>{usd(subtotalBiomasaAnual)}</strong>
                <span style={{ fontSize: 11, opacity: 0.8 }}> ({usd(subtotalBiomasaMensual)} / mes)</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#86efac", fontWeight: 700, display: "block" }}>
                  🚚 Costo de Envío / Flete (12 meses)
                </span>
                <strong style={{ fontSize: 16, color: "#86efac" }}>{usd(fleteAnual)}</strong>
                <span style={{ fontSize: 11, color: "#dcfce7" }}> ({usd(fleteMensual)} / mes)</span>
              </div>
              <div style={{ borderLeft: "1px solid rgba(255,255,255,0.2)", paddingLeft: 12 }}>
                <span style={{ fontSize: 11, opacity: 0.9, display: "block", fontWeight: 600 }}>
                  TOTAL CONSOLIDADO ANUAL
                </span>
                <strong style={{ fontSize: 22, color: "#ffffff" }}>{usd(totalAnual)}</strong>
                <span style={{ fontSize: 12, opacity: 0.9, display: "block" }}>
                  Equivalente a <strong>{usd(totalMensual)} / mes</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Panel de Firmas */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-bg-dark)", marginBottom: 10 }}>
              Suscripción y Firmas Electrónicas de las Partes
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              {/* Firma Proveedor */}
              <div
                style={{
                  border: "1px solid #bbf7d0",
                  background: "#f0fdf4",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: "#166534" }}>Proveedor (Vendedor)</span>
                  <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700 }}>
                    ✔ FIRMADO
                  </span>
                </div>
                <div><strong>Razón Social:</strong> {pub.seller}</div>
                <div><strong>Apoderado:</strong> Ing. Damián Valenzuela</div>
                <div style={{ color: "var(--color-muted-fg)", fontSize: 11, marginTop: 4 }}>
                  Certificado digital verificado · SHA256: 4e91...a820
                </div>
              </div>

              {/* Firma Comprador */}
              <div
                style={{
                  border: isSigned ? "1px solid #86efac" : "1.5px dashed #15803d",
                  background: isSigned ? "#ecfdf5" : "#fdfefe",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 12,
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: isSigned ? "#166534" : "var(--color-bg-dark)" }}>
                    Comprador (Cliente)
                  </span>
                  <span
                    style={{
                      background: isSigned ? "#15803d" : "#fef3c7",
                      color: isSigned ? "#fff" : "#92400e",
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {isSigned ? "✔ FIRMADO Y VALIDADO" : "PENDIENTE DE FIRMA"}
                  </span>
                </div>

                {!isSigned ? (
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-muted-fg)", marginBottom: 2 }}>
                        Nombre del firmante autorizado:
                      </label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid var(--color-border)",
                          fontSize: 12,
                          background: "#fff",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-muted-fg)", marginBottom: 2 }}>
                        Cargo / Representación:
                      </label>
                      <input
                        type="text"
                        value={signerRole}
                        onChange={(e) => setSignerRole(e.target.value)}
                        placeholder="Ej. Gerente de Compras"
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid var(--color-border)",
                          fontSize: 12,
                          background: "#fff",
                        }}
                      />
                    </div>

                    {signatureError && (
                      <div style={{ color: "#b91c1c", fontSize: 11, marginBottom: 8, fontWeight: 600 }}>
                        {signatureError}
                      </div>
                    )}

                    {/* Botón explícito de firmar contrato dentro del recuadro */}
                    <button
                      type="button"
                      onClick={handleSignContract}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(21, 128, 61, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "all 0.2s",
                      }}
                    >
                      <span>✍</span> Firmar contrato digitalmente
                    </button>
                  </div>
                ) : (
                  <div>
                    <div><strong>Firmante:</strong> {signerName}</div>
                    <div><strong>Empresa:</strong> {user.company} ({signerRole})</div>
                    <div style={{ color: "#166534", fontWeight: 600, marginTop: 4 }}>
                      ✔ Firmado el {signedAt}
                    </div>
                    <div style={{ color: "var(--color-muted-fg)", fontSize: 10, marginTop: 2 }}>
                      Certificado BioNexo ID: BIO-SIG-{orderId.slice(0, 8).toUpperCase()}-VERIFIED
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isSigned && (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: 12,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "#065f46",
            }}
          >
            <span style={{ fontSize: 18 }}>🎉</span>
            <div>
              <strong>¡Contrato formalizado con éxito!</strong> El documento ya cuenta con plena validez. Hacé clic en <strong>Siguiente paso</strong> para generar la orden y despachar el flete.
            </div>
          </div>
        )}
      </div>
    );
  }

  // Paso 4: Orden de compra y flete asignado
  if (step === 4) {
    body = (
      <Card style={{ background: "#f0fdf4", border: "1px solid #86efac", padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>✔</span>
          <h4 style={{ margin: 0, fontSize: 18, color: "#166534" }}>
            Orden de Compra y Logística Confirmada
          </h4>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 14, color: "#14532d" }}>
          El contrato <strong>{contractCode}</strong> ha sido perfeccionado. Se generó la orden de despacho correspondiente:
        </p>

        <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: 14, fontSize: 13, display: "grid", gap: 8, marginBottom: 14 }}>
          <div><strong>Subproducto:</strong> {pub.product} ({q} toneladas / mes)</div>
          <div><strong>Proveedor:</strong> {pub.seller} ({pub.city})</div>
          <div><strong>Destino receptor:</strong> {user.company} ({need.city})</div>
          <div><strong>Operador de transporte:</strong> Transporte Ávila SRL (Flota monitoreada)</div>
          <div style={{ borderTop: "1px solid #e2ece5", paddingTop: 8, marginTop: 4 }}>
            <strong>Desglose mensual de la orden:</strong>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span>Mercadería ({q} t):</span>
              <span>{usd(subtotalBiomasaMensual)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#15803d", fontWeight: 600 }}>
              <span>🚚 Costo de envío / Flete ({pkm} km):</span>
              <span>{usd(fleteMensual)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #cbd5e1", paddingTop: 6, marginTop: 6, fontWeight: 800, fontSize: 15 }}>
              <span>Total mensual:</span>
              <span>{usd(totalMensual)}</span>
            </div>
          </div>
          <div style={{ color: "#15803d", fontWeight: 600, marginTop: 4 }}>
            ⏱ Primera entrega programada: en 7 días hábiles.
          </div>
        </div>
      </Card>
    );
  }

  const last = step >= 4;

  return (
    <Modal open onClose={onClose} maxWidth={760}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 20, color: "var(--color-bg-dark)" }}>
          Circuito de compra · {pub.product}
        </h3>
        <span style={{ fontSize: 12, color: "var(--color-muted-fg)" }}>
          {pub.seller} ({pub.city})
        </span>
      </div>

      <Steps items={circLabels} current={step} />

      {body}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, alignItems: "center" }}>
        <Btn kind="sec" onClick={onClose}>
          Cerrar
        </Btn>

        {step === 3 && !isSigned ? (
          <Btn onClick={handleSignContract}>
            ✍ Firmar contrato
          </Btn>
        ) : (
          <Btn onClick={() => (last ? finish() : setStep(step + 1))}>
            {last ? "Finalizar y ver órdenes" : step === 3 && isSigned ? "Continuar a Orden y flete →" : "Siguiente paso"}
          </Btn>
        )}
      </div>
    </Modal>
  );
}
