"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "./ui";
import {
  SELLOS_AMBIENTALES,
  alActualizar,
  estadoVisible,
  formatearFecha,
  listarSellosPublicos,
  textoVigencia,
  type SellerSeal,
} from "@/lib/certifications";

const ICONOS: Record<string, string> = { bioproducto: "🌿", epd: "📄", saprocea: "♻️" };

/**
 * Vista del comprador: únicamente los sellos que ya fueron verificados por un
 * administrador, con su alcance y vigencia (no consulta la base).
 */
export default function SellosPublicos({ sellerId, preview = false }: { sellerId: string; preview?: boolean }) {
  const [sellos, setSellos] = useState<SellerSeal[]>([]);

  const recargar = useCallback(() => {
    setSellos(listarSellosPublicos(sellerId));
  }, [sellerId]);

  useEffect(() => {
    recargar();
    return alActualizar(recargar);
  }, [recargar]);

  return (
    <Card style={preview ? { boxShadow: "none", border: "1px dashed var(--color-border)", background: "var(--color-bg-alt)" } : undefined}>
      <h3 style={{ margin: 0, fontSize: 16 }}>Sellos y certificaciones ambientales</h3>
      <p style={{ margin: "8px 0 14px", fontSize: 12.5, color: "var(--color-muted-fg)", lineHeight: 1.5 }}>
        Solo se muestran los sellos cuya documentación fue <strong>verificada por un administrador de BioNexo</strong>.
        BioNexo no emite ni otorga estos sellos: únicamente registra y verifica la documentación presentada.
      </p>

      {sellos.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-muted-fg)" }}>
          Este vendedor todavía no tiene sellos ambientales verificados.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {sellos.map((sello) => {
            const def = SELLOS_AMBIENTALES[sello.seal_type];
            const vencido = estadoVisible(sello) === "expired";
            return (
              <div
                key={sello.id}
                style={{
                  border: "1px solid var(--color-border)",
                  borderLeft: `4px solid ${vencido ? "#dc2626" : "var(--color-primary)"}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span aria-hidden="true" style={{ fontSize: 20 }}>{ICONOS[sello.seal_type]}</span>
                  <strong style={{ fontSize: 14 }}>{def.nombre}</strong>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 9px",
                      borderRadius: 50,
                      fontSize: 11,
                      fontWeight: 700,
                      color: vencido ? "#991b1b" : "#166534",
                      background: vencido ? "#fee2e2" : "#dcfce7",
                    }}
                  >
                    {vencido ? "Vencido" : "✓ Verificado"}
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--color-muted-fg)" }}>
                    {textoVigencia(sello.status, sello.expiry_date)}
                  </span>
                </div>
                {sello.scope ? (
                  <p style={{ margin: "7px 0 0", fontSize: 12.5, color: "var(--color-muted-fg)" }}>Alcance: {sello.scope}</p>
                ) : null}
                <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--color-muted-fg)" }}>
                  {sello.issuing_entity ? `Entidad emisora: ${sello.issuing_entity}` : null}
                  {sello.certificate_number ? ` · N.º ${sello.certificate_number}` : null}
                  {sello.issue_date ? ` · Emitido el ${formatearFecha(sello.issue_date)}` : null}
                </p>
                <a
                  href={def.sitioOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 600, color: "var(--color-primary)" }}
                >
                  Sitio oficial ↗
                </a>
              </div>
            );
          })}
        </div>
      )}
      <p style={{ margin: "12px 0 0", fontSize: 11.5, color: "var(--color-muted-fg)" }}>
        Podés contrastar cada sello con su fuente oficial y consultar al vendedor por el número de certificado.
      </p>
    </Card>
  );
}
