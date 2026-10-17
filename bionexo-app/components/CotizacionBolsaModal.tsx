"use client";
import { useState } from "react";
import {
  COTIZACION_BOLSA_URL,
  COTIZACION_TABS,
  cotizacionesFor,
  type CotizacionTab,
} from "@/lib/cotizaciones";
import { Btn, Modal, Muted } from "./ui";

function variacionTexto(valor: number | null): string {
  if (valor === null) return "= 0 %";
  if (valor === 0) return "= 0 %";
  const flecha = valor > 0 ? "▲" : "▼";
  return `${flecha} ${valor.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

function variacionColor(valor: number | null): string {
  if (valor === null || valor === 0) return "var(--color-muted-fg)";
  return valor > 0 ? "var(--color-primary)" : "var(--color-danger)";
}

export default function CotizacionBolsaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<CotizacionTab>("Resumen");
  const filas = cotizacionesFor(tab);

  return (
    <Modal open={open} onClose={onClose} maxWidth={820}>
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>📈 Cotización en la bolsa agro</h3>
      <p style={{ margin: 0 }}>
        <Muted>Mercado de granos y subproductos del NEA. Referencia para cotizar tu material antes de publicarlo.</Muted>
      </p>

      <div role="tablist" aria-label="Granos" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "18px 0 12px" }}>
        {COTIZACION_TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className="bn-mode-btn"
            data-open={tab === t}
            style={{ padding: "6px 14px", fontSize: 13 }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 620 }}>
          <thead>
            <tr style={{ background: "var(--color-bg-alt)", textAlign: "left" }}>
              <th style={{ padding: "10px 12px", fontWeight: 700 }}>Grano</th>
              <th style={{ padding: "10px 12px", fontWeight: 700 }}>Mercado</th>
              <th style={{ padding: "10px 12px", fontWeight: 700 }}>Posición</th>
              <th style={{ padding: "10px 12px", fontWeight: 700, textAlign: "right" }}>Cotización</th>
              <th style={{ padding: "10px 12px", fontWeight: 700, textAlign: "right" }}>Variación</th>
              <th style={{ padding: "10px 12px", fontWeight: 700, whiteSpace: "nowrap" }}>Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr key={`${fila.grano}-${fila.mercado}-${fila.posicion}-${i}`} style={{ borderTop: "1px solid var(--color-border)" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{fila.grano}</td>
                <td style={{ padding: "10px 12px", color: "var(--color-muted-fg)" }}>{fila.mercado}</td>
                <td style={{ padding: "10px 12px", color: "var(--color-muted-fg)" }}>{fila.posicion}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{fila.valor}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: variacionColor(fila.variacion), whiteSpace: "nowrap" }}>
                  {variacionTexto(fila.variacion)}
                </td>
                <td style={{ padding: "10px 12px", color: "var(--color-subtle-fg)", whiteSpace: "nowrap" }}>{fila.actualizado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: "var(--color-subtle-fg)", margin: "14px 0 0" }}>
        DATO SIMULADO con fines de demostración. Precios de referencia del mercado de granos; la cascarilla de arroz se estima a partir del arroz paddy
        (SUPUESTO). No constituyen una cotización en firme ni una recomendación de inversión.
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
        <a href={COTIZACION_BOLSA_URL} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 600 }}>
          Ver cotizaciones en Agrofy News ↗
        </a>
        <Btn kind="sec" onClick={onClose}>Cerrar</Btn>
      </div>
    </Modal>
  );
}
