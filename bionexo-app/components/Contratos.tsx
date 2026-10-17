"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Muted, Tag, Btn } from "@/components/ui";
import { useStore } from "@/lib/store";
import {
  activarContratoConOperacion,
  cambiarEstadoContrato,
  listarContratos,
  marcarEntrega,
  type Contrato,
} from "@/lib/contracts";

const COLOR_ESTADO: Record<Contrato["status"], string> = {
  borrador: "#f59e0b",
  activo: "#059669",
  completado: "#2563eb",
  cancelado: "#9ca3af",
};

const COLOR_ENTREGA: Record<string, string> = {
  pendiente: "#f59e0b",
  entregada: "#059669",
  retrasada: "#dc2626",
  cancelada: "#9ca3af",
};

function fecha(iso: string): string {
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}

export default function Contratos() {
  const { user, role } = useStore();
  const [lista, setLista] = useState<Contrato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);

  const refrescar = useCallback(async () => {
    if (!user) return;
    const contratos = await listarContratos(user.id);
    setLista(contratos);
    setCargando(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => void refrescar(), 0);
    return () => window.clearTimeout(timer);
  }, [user, refrescar]);

  async function activar(contrato: Contrato) {
    const result = await activarContratoConOperacion(contrato.id);
    setMensaje(result.message);
    setEsError(!result.ok);
    await refrescar();
  }

  async function cancelar(contrato: Contrato) {
    const result = await cambiarEstadoContrato(contrato.id, "cancelado");
    setMensaje(result.message);
    setEsError(!result.ok);
    await refrescar();
  }

  async function entregar(entregaId: number) {
    const result = await marcarEntrega(entregaId);
    setMensaje(result.message);
    setEsError(!result.ok);
    await refrescar();
  }

  if (!user) return null;

  const activos = lista.filter((c) => c.status === "activo");
  const totalContratado = activos.reduce((suma, c) => suma + c.quantityTons * c.durationMonths, 0);

  return (
    <>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "baseline" }}>
          <div>
            <h3 style={{ margin: "0 0 4px" }}>Contratos de abastecimiento</h3>
            <Muted>
              Se generan desde el chat cuando ambas partes confirman las condiciones. Incluyen calendario de entregas y
              seguimiento por vencimiento.
            </Muted>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Tag>{lista.length} contrato(s)</Tag>
            <Tag>{activos.length} activo(s)</Tag>
            <Tag>{totalContratado} t programadas</Tag>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#6b7f72", margin: "12px 0 0" }}>
          ¿Todavía no hay un acuerdo? Abrí <Link href="/mensajes" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Mensajes</Link>{" "}
          y negociá cantidad, precio, frecuencia y duración.
        </p>
        {mensaje && (
          <p role="status" style={{ marginTop: 12, color: esError ? "#b91c1c" : "#166534", fontWeight: 600 }}>{mensaje}</p>
        )}
      </Card>

      {cargando && <Card><p>Cargando contratos…</p></Card>}

      {!cargando && lista.length === 0 && (
        <Card>
          <p style={{ margin: 0 }}>
            <Muted>No tenés contratos todavía.</Muted>
          </p>
        </Card>
      )}

      {lista.map((contrato) => {
        const entregadas = contrato.entregas.filter((e) => e.status === "entregada").length;
        const progreso = contrato.entregas.length
          ? Math.round((entregadas / contrato.entregas.length) * 100)
          : 0;

        return (
          <Card key={contrato.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
              <div>
                <strong style={{ fontSize: 17 }}>{contrato.product}</strong>{" "}
                <span
                  className="bn-badge"
                  style={{ background: COLOR_ESTADO[contrato.status], color: "#fff" }}
                >
                  {contrato.status.toUpperCase()}
                </span>{" "}
                {contrato.contractType === "futuro" && (
                  <span className="bn-badge" style={{ background: "#7c3aed", color: "#fff" }}>
                    FUTURO · SEÑA {contrato.downPaymentPct}%
                  </span>
                )}
                <div style={{ fontSize: 14, color: "var(--color-muted-fg)", marginTop: 4 }}>
                  Comprador: <strong>{contrato.buyerName}</strong> · Vendedor: <strong>{contrato.sellerName}</strong>
                  {role === "vendedor" ? " · (tus condiciones)" : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {contrato.status === "borrador" && (
                  <>
                    <Btn onClick={() => void activar(contrato)}>Activar contrato</Btn>
                    <Btn kind="sec" onClick={() => void cancelar(contrato)}>Cancelar</Btn>
                  </>
                )}
                {contrato.status === "activo" && <Btn kind="warn" onClick={() => void cancelar(contrato)}>Dar de baja</Btn>}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
                marginTop: 16,
                background: "var(--color-bg-alt)",
                border: "1px solid var(--color-border)",
                borderRadius: 14,
                padding: 14,
                fontSize: 14,
              }}
            >
              <div><Muted>Volumen</Muted><br /><strong>{contrato.quantityTons} t / {contrato.frequency.toLowerCase()}</strong></div>
              <div><Muted>Precio</Muted><br /><strong>USD {contrato.unitPrice}/t</strong></div>
              <div><Muted>Duración</Muted><br /><strong>{contrato.durationMonths} meses</strong></div>
              <div><Muted>Inicio</Muted><br /><strong>{fecha(contrato.startDate)}</strong></div>
              {contrato.contractType === "futuro" && (
                <>
                  <div><Muted>Seña</Muted><br /><strong>{contrato.downPaymentPct}% (USD {(contrato.quantityTons * contrato.unitPrice * contrato.durationMonths * contrato.downPaymentPct / 100).toLocaleString("es-AR")})</strong></div>
                  <div><Muted>Penalidad</Muted><br /><strong>{contrato.penaltyPct}%</strong></div>
                </>
              )}
              <div><Muted>Valor estimado</Muted><br /><strong>USD {(contrato.quantityTons * contrato.unitPrice * contrato.durationMonths).toLocaleString("es-AR")}</strong></div>
            </div>

            <p style={{ fontSize: 13, color: "var(--color-muted-fg)", margin: "12px 0 0" }}>
              <strong>Condiciones:</strong> {contrato.terms}
            </p>

            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                <span>Calendario de entregas</span>
                <span>{entregadas}/{contrato.entregas.length} · {progreso}%</span>
              </div>
              <div
                style={{
                  height: 8,
                  background: "var(--color-border)",
                  borderRadius: 8,
                  marginTop: 6,
                  overflow: "hidden",
                }}
              >
                <div style={{ height: "100%", width: `${progreso}%`, background: "var(--color-primary)" }} />
              </div>

              <div style={{ overflowX: "auto", marginTop: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
                      <th style={{ padding: 8 }}>Vencimiento</th>
                      <th style={{ padding: 8 }}>Cantidad</th>
                      <th style={{ padding: 8 }}>Estado</th>
                      <th style={{ padding: 8 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contrato.entregas.map((entrega) => (
                      <tr key={entrega.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                        <td style={{ padding: 8 }}>{fecha(entrega.dueDate)}</td>
                        <td style={{ padding: 8 }}>{entrega.quantityTons} t</td>
                        <td style={{ padding: 8 }}>
                          <span
                            className="bn-badge"
                            style={{ background: COLOR_ENTREGA[entrega.status], color: "#fff" }}
                          >
                            {entrega.status}
                          </span>
                          {entrega.deliveredAt && (
                            <Muted> · {fecha(entrega.deliveredAt.slice(0, 10))}</Muted>
                          )}
                        </td>
                        <td style={{ padding: 8, textAlign: "right" }}>
                          {entrega.status === "pendiente" && contrato.status === "activo" && (
                            <Btn kind="sec" onClick={() => void entregar(entrega.id)}>Marcar entregada</Btn>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        );
      })}
    </>
  );
}
