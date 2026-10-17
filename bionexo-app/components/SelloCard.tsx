"use client";

import { useState } from "react";
import { Btn, Card, Muted } from "./ui";
import {
  SELLOS_AMBIENTALES,
  ESTADO_LABEL,
  estadoVisible,
  formatearFecha,
  formatearPeso,
  guardarSelloMock,
  quitarSelloMock,
  type SelloDatos,
  type SelloType,
  type SellerSeal,
} from "@/lib/certifications";

const ICONOS: Record<SelloType, string> = { bioproducto: "🌿", epd: "📄", saprocea: "♻️" };

export default function SelloCard({ sello }: { sello: SellerSeal }) {
  const def = SELLOS_AMBIENTALES[sello.seal_type];
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [datos, setDatos] = useState<SelloDatos>({
    certificate_number: sello.certificate_number,
    issuing_entity: sello.issuing_entity,
    issue_date: sello.issue_date,
    expiry_date: sello.expiry_date,
    scope: sello.scope,
    doc_name: "",
    doc_size: 0,
  });

  const estado = estadoVisible(sello);
  const listoParaEnviar = Boolean(datos.certificate_number.trim() && (datos.doc_name || sello.doc_name));

  const setCampo = <K extends keyof SelloDatos>(k: K, v: SelloDatos[K]) =>
    setDatos((prev) => ({ ...prev, [k]: v }));

  function solicitarVerificacion() {
    const resultado = guardarSelloMock(sello.seller_id, sello.seal_type, {
      ...datos,
      doc_name: datos.doc_name || sello.doc_name,
      doc_size: datos.doc_size || sello.doc_size,
    });
    setMensaje(resultado.message);
    if (resultado.ok) setAbierto(false);
  }

  function removerSello() {
    if (!confirm("¿Marcar este sello como “No poseo”? Se quitan los datos y la documentación adjunta.")) return;
    const resultado = quitarSelloMock(sello.seller_id, sello.seal_type);
    setMensaje(resultado.message);
    if (resultado.ok) setAbierto(false);
  }

  return (
    <Card style={{ padding: "18px 20px", marginBottom: 0, border: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ fontSize: 40, lineHeight: 1 }} aria-hidden="true">{ICONOS[sello.seal_type]}</div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{def.nombre}</h4>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 50,
                fontSize: 11.5,
                fontWeight: 700,
                color: ESTADO_LABEL[estado].color,
                background: ESTADO_LABEL[estado].bg,
              }}
            >
              {ESTADO_LABEL[estado].label}
            </span>
          </div>
          <p style={{ margin: "6px 0 2px", fontSize: 12.5, color: "var(--color-muted-fg)" }}>{def.descripcion}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-muted-fg)" }}>
            Documentación sugerida: <strong>{def.documentoSugerido}</strong>
          </p>
          <a
            href={def.sitioOficial}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12.5, fontWeight: 600, color: "var(--color-primary)", textDecoration: "underline" }}
          >
            Sitio oficial ↗
          </a>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", minWidth: 170 }}>
          {sello.doc_name ? (
            <div style={{ fontSize: 12, color: "var(--color-muted-fg)", textAlign: "right" }}>
              Adjunto: {sello.doc_name} · {formatearPeso(sello.doc_size)}
            </div>
          ) : null}
          {sello.reviewed_at && sello.status === "verified" ? (
            <div style={{ fontSize: 12, color: "var(--color-muted-fg)", textAlign: "right" }}>
              Verificado el {new Date(sello.reviewed_at).toLocaleDateString("es-AR")}
              {sello.review_notes ? (
                <>
                  <br />
                  <Muted>{sello.review_notes}</Muted>
                </>
              ) : null}
            </div>
          ) : null}
          {!abierto ? (
            <Btn kind="sec" onClick={() => setAbierto(true)}>
              {sello.status === "none" ? "Adjuntar documentación" : "Actualizar datos"}
            </Btn>
          ) : null}
          {sello.status !== "none" ? (
            <Btn kind="ghost" onClick={removerSello}>
              No poseo este sello
            </Btn>
          ) : null}
        </div>
      </div>

      {sello.status === "pending" ? (
        <div style={{ marginTop: 12, fontSize: 12, color: "#92400e", background: "#fef3c7", borderRadius: 10, padding: "8px 12px" }}>
          Documentación presentada el {formatearFecha(sello.updated_at.slice(0, 10))}. Un administrador de BioNexo debe
          verificarla antes de que el sello se muestre en tu perfil público.
        </div>
      ) : null}

      {sello.review_notes.startsWith("Rechazado") ? (
        <div style={{ marginTop: 8, fontSize: 12, color: "#991b1b", background: "#fee2e2", borderRadius: 10, padding: "8px 12px" }}>
          {sello.review_notes} — corregí la documentación y volvé a presentarla.
        </div>
      ) : null}

      {abierto ? (
        <div
          style={{
            marginTop: 14,
            borderTop: "1px solid var(--color-border)",
            paddingTop: 14,
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          }}
        >
          <label style={{ display: "grid", gap: 5 }}>
            <strong>Documentación</strong>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                if (archivo) {
                  setCampo("doc_name", archivo.name);
                  setCampo("doc_size", archivo.size);
                }
              }}
            />
            {datos.doc_name ? (
              <div style={{ fontSize: 11.5, color: "var(--color-muted-fg)" }}>
                {datos.doc_name} · {formatearPeso(datos.doc_size)}
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: "var(--color-muted-fg)" }}>PDF o imagen</div>
            )}
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <strong>Número de certificado</strong>
            <input className="bn-input" value={datos.certificate_number} onChange={(e) => setCampo("certificate_number", e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <strong>Entidad emisora</strong>
            <input className="bn-input" value={datos.issuing_entity} onChange={(e) => setCampo("issuing_entity", e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <strong>Fecha de emisión</strong>
            <input className="bn-input" type="date" value={datos.issue_date ?? ""} onChange={(e) => setCampo("issue_date", e.target.value || null)} />
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <strong>Fecha de vencimiento</strong>
            <input className="bn-input" type="date" value={datos.expiry_date ?? ""} onChange={(e) => setCampo("expiry_date", e.target.value || null)} />
          </label>
          <label style={{ display: "grid", gap: 5, gridColumn: "1 / -1" }}>
            <strong>Alcance de la certificación</strong>
            <textarea className="bn-input" rows={2} value={datos.scope} onChange={(e) => setCampo("scope", e.target.value)} />
          </label>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn kind="sec" onClick={() => setAbierto(false)}>Cancelar</Btn>
            <Btn onClick={solicitarVerificacion} disabled={!listoParaEnviar}>Solicitar verificación</Btn>
          </div>
        </div>
      ) : null}

      {mensaje ? <p style={{ margin: "10px 0 0", fontSize: 12.5, fontWeight: 600 }}>{mensaje}</p> : null}
    </Card>
  );
}
