"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Card, DemoTag, Muted } from "./ui";
import {
  SELLOS_AMBIENTALES,
  alActualizar,
  aprobarSelloMock,
  estadoVisible,
  formatearFecha,
  formatearPeso,
  listarSellosDe,
  rechazarSelloMock,
  restablecerDemo,
  textoVigencia,
  type SellerSeal,
} from "@/lib/certifications";
import { useStore } from "@/lib/store";

/**
 * Panel de revisión: lo que vería un administrador de
 * BioNexo al revisar la documentación presentada por el vendedor.
 * No usa la base de datos ni requiere una cuenta de administrador real.
 */
export default function PanelAdminDemo() {
  const { user } = useStore();
  const [sellos, setSellos] = useState<SellerSeal[]>([]);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState("");

  const recargar = useCallback(() => {
    if (!user) return;
    setSellos(listarSellosDe(user.id));
  }, [user]);

  useEffect(() => {
    recargar();
    return alActualizar(recargar);
  }, [recargar]);

  if (!user) return null;

  const pendientes = sellos.filter((s) => s.status === "pending");

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>Panel de administrador · revisión de sellos</h3>
          <DemoTag />
        </div>
      </div>
      <p style={{ margin: "8px 0 14px", fontSize: 13, color: "var(--color-muted-fg)", lineHeight: 1.5 }}>
        Revisión de la documentación presentada por el vendedor: al aprobarla, el sello pasa a <strong>Verificado</strong>{" "}
        (visible para compradores); al rechazarla, vuelve al vendedor con observaciones. BioNexo no emite el sello, solo
        verifica la documentación.
      </p>

      {pendientes.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-muted-fg)" }}>No hay documentación pendiente de revisión.</p>
      ) : (
        pendientes.map((sello) => (
          <div key={sello.id} style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <strong style={{ fontSize: 14 }}>{SELLOS_AMBIENTALES[sello.seal_type].nombre}</strong>
                <div style={{ fontSize: 12.5, color: "var(--color-muted-fg)", marginTop: 4 }}>
                  {user.company} · {user.city} · {user.name}
                </div>
              </div>
              <span style={{ alignSelf: "start", padding: "3px 10px", borderRadius: 50, fontSize: 11.5, fontWeight: 700, color: "#92400e", background: "#fef3c7" }}>
                Pendiente de verificación
              </span>
            </div>
            <div style={{ display: "grid", gap: 3, marginTop: 10, fontSize: 12.5 }}>
              <div><span style={{ color: "var(--color-muted-fg)" }}>N.º de certificado:</span> {sello.certificate_number || "—"}</div>
              <div><span style={{ color: "var(--color-muted-fg)" }}>Entidad emisora:</span> {sello.issuing_entity || "—"}</div>
              <div>
                <span style={{ color: "var(--color-muted-fg)" }}>Emisión:</span> {formatearFecha(sello.issue_date)}
                <span style={{ color: "var(--color-muted-fg)" }}> · Vencimiento:</span> {formatearFecha(sello.expiry_date)}
              </div>
              <div><span style={{ color: "var(--color-muted-fg)" }}>Alcance:</span> {sello.scope || "—"}</div>
              <div><span style={{ color: "var(--color-muted-fg)" }}>Documentación adjunta:</span> {sello.doc_name || "sin adjunto"} ({formatearPeso(sello.doc_size)})</div>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              <label style={{ display: "grid", gap: 5, flex: 1, minWidth: 240 }}>
                <strong style={{ fontSize: 12.5 }}>Observaciones (opcional)</strong>
                <input
                  className="bn-input"
                  value={notas[sello.id] ?? ""}
                  onChange={(e) => setNotas((prev) => ({ ...prev, [sello.id]: e.target.value }))}
                  placeholder="Ej.: documentación ilegible, falta acta de alcance…"
                />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn
                  onClick={() => {
                    const r = aprobarSelloMock(sello.seller_id, sello.seal_type, notas[sello.id] ?? "");
                    setMensaje(r.message);
                  }}
                >
                  Aprobar y verificar
                </Btn>
                <Btn
                  kind="ghost"
                  onClick={() => {
                    const r = rechazarSelloMock(sello.seller_id, sello.seal_type, notas[sello.id] ?? "");
                    setMensaje(r.message);
                  }}
                >
                  Rechazar documentación
                </Btn>
              </div>
            </div>
          </div>
        ))
      )}

      {mensaje ? <p style={{ margin: "10px 0 0", fontSize: 12.5, fontWeight: 600 }}>{mensaje}</p> : null}

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border)", display: "grid", gap: 8 }}>
        <p style={{ margin: 0 }}>
          <Muted>
            Sellos del vendedor: {sellos.filter((s) => estadoVisible(s) === "verified").length} verificados ·{" "}
            {sellos.filter((s) => estadoVisible(s) === "pending").length} pendientes ·{" "}
            {sellos.filter((s) => estadoVisible(s) === "expired").length} vencidos ·{" "}
            {sellos.filter((s) => estadoVisible(s) === "none").length} no posee.
          </Muted>
        </p>
        <div>
          <Btn kind="sec" onClick={() => { restablecerDemo(user.id); setMensaje("Datos restablecidos."); }}>
            Restablecer datos
          </Btn>
        </div>
        {sellos.some((s) => s.status === "verified") ? (
          <p style={{ margin: 0 }}>
            <Muted>
              Vigencia:{" "}
              {sellos
                .filter((s) => s.status === "verified")
                .map((s) => `${SELLOS_AMBIENTALES[s.seal_type].nombre.split(" (")[0]}: ${textoVigencia(s.status, s.expiry_date)}`)
                .join(" · ")}
            </Muted>
          </p>
        ) : null}
      </div>
    </Card>
  );
}
