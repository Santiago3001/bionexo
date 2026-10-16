"use client";
import { useState } from "react";
import { usd } from "@/lib/data";
import { Btn, Modal, Muted } from "./ui";

export default function ModeloNegocioModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [ops, setOps] = useState(300);
  const [ticket, setTicket] = useState(6000);
  const [premium, setPremium] = useState(120);

  const comision = ops * ticket * 0.03;
  const logistica = ops * 800 * 0.06;
  const subs = premium * 49;
  const mensual = comision + logistica + subs;

  return (
    <Modal open={open} onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>¿Cómo gana dinero BioNexo?</h3>
      <p style={{ fontSize: 13, color: "#5b6f62" }}>
        Calculadora de ingresos de la plataforma. Está pensada para explicar el modelo de negocio a jurados, inversores y socios.
        Compradores, vendedores y transportistas no la usan. Mové los controles para ver cuánto factura BioNexo.
      </p>

      <div style={{ margin: "18px 0" }}>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 4 }}>
          Operaciones concretadas por mes: <span style={{ color: "#0369A1" }}>{ops}</span>
        </label>
        <Muted>Compras y trueques que se cierran por la plataforma cada mes.</Muted>
        <input type="range" min={50} max={2000} value={ops} onChange={(e) => setOps(+e.target.value)} style={{ width: "100%", accentColor: "#0369A1", marginTop: 6 }} />
      </div>

      <div style={{ margin: "18px 0" }}>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 4 }}>
          Valor promedio de cada operación (US$): <span style={{ color: "#0369A1" }}>{ticket.toLocaleString("es-AR")}</span>
        </label>
        <Muted>Cuánto dinero mueve, en promedio, una operación.</Muted>
        <input type="range" min={1000} max={20000} step={500} value={ticket} onChange={(e) => setTicket(+e.target.value)} style={{ width: "100%", accentColor: "#0369A1", marginTop: 6 }} />
      </div>

      <div style={{ margin: "18px 0" }}>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 4 }}>
          Empresas con plan premium: <span style={{ color: "#0369A1" }}>{premium}</span>
        </label>
        <Muted>Empresas que pagan suscripción mensual por funciones extra (reportes, cotizador, prioridad).</Muted>
        <input type="range" min={0} max={1000} value={premium} onChange={(e) => setPremium(+e.target.value)} style={{ width: "100%", accentColor: "#0369A1", marginTop: 6 }} />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <tbody>
          <tr>
            <td style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
              Comisión por operación (3%)
              <div style={{ fontSize: 12, color: "#6b7f72" }}>BioNexo cobra el 3% del valor de cada operación cerrada. {ops} × US$ {ticket.toLocaleString("es-AR")} × 3%.</div>
            </td>
            <td style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border)", textAlign: "right", whiteSpace: "nowrap" }}>{usd(comision)}</td>
          </tr>
          <tr>
            <td style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
              Ganancia por organizar el transporte (6%)
              <div style={{ fontSize: 12, color: "#6b7f72" }}>Cada operación necesita un flete de unos US$ 800. {ops} fletes × US$ 800 × 6%.</div>
            </td>
            <td style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border)", textAlign: "right", whiteSpace: "nowrap" }}>{usd(logistica)}</td>
          </tr>
          <tr>
            <td style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
              Suscripciones premium
              <div style={{ fontSize: 12, color: "#6b7f72" }}>{premium} empresas × US$ 49 por mes.</div>
            </td>
            <td style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border)", textAlign: "right", whiteSpace: "nowrap" }}>{usd(subs)}</td>
          </tr>
          <tr>
            <td style={{ padding: "12px 0", fontWeight: 800 }}>Ingreso mensual de BioNexo</td>
            <td style={{ padding: "12px 0", textAlign: "right", fontWeight: 800, whiteSpace: "nowrap" }}>{usd(mensual)}</td>
          </tr>
          <tr>
            <td style={{ padding: "6px 0", fontWeight: 800 }}>Ingreso anual proyectado (× 12)</td>
            <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 800, whiteSpace: "nowrap" }}>{usd(mensual * 12)}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: 13, color: "#6b7f72" }}>
        Ilustrativo. Supuestos (operaciones, ticket y fletes) marcados en <strong>SUPUESTO</strong> en 03-costos-y-ganancias.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn kind="sec" onClick={onClose}>Cerrar</Btn>
      </div>
    </Modal>
  );
}
