"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Btn, Muted } from "./ui";
import {
  cargarNombresCarbon,
  listarAcuerdosDeConversacion,
  proponerAcuerdo,
  responderAcuerdo,
  suscribirseAAcuerdos,
  type AcuerdoCarbon,
} from "@/lib/carbon";
import type { Conversacion } from "@/lib/chat";

/* -------------------------------------------------------------------------- */
/*  Tarjeta BioNexo Carbon dentro del chat comercial.                          */
/*  Permite proponer / aceptar / rechazar el acuerdo de reparto de un          */
/*  eventual ingreso por créditos de carbono, vinculado a esta conversación.   */
/*  Registrar un acuerdo NO genera créditos: son tres categorías distintas.    */
/* -------------------------------------------------------------------------- */

const COLOR_ESTADO: Record<string, { c: string; b: string; borde: string }> = {
  propuesto: { c: "#92400e", b: "#fffbeb", borde: "#fde68a" },
  aceptado: { c: "#166534", b: "#ecfdf5", borde: "#6ee7b7" },
  rechazado: { c: "#991b1b", b: "#fef2f2", borde: "#fecaca" },
  archivado: { c: "#4b5563", b: "#f9fafb", borde: "#e5e7eb" },
};

export default function CarbonChatCard({
  conversacion,
  userId,
}: {
  conversacion: Conversacion;
  userId: string | null;
}) {
  const [acuerdos, setAcuerdos] = useState<AcuerdoCarbon[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [abierto, setAbierto] = useState(false);
  const [tons, setTons] = useState(10);
  const [pctVendedor, setPctVendedor] = useState(50);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const convId = conversacion.id;

  const refrescar = useCallback(async () => {
    const lista = await listarAcuerdosDeConversacion(convId);
    setAcuerdos(lista);
    setNombres(await cargarNombresCarbon(lista.flatMap((a) => [a.sellerId, a.buyerId])));
  }, [convId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refrescar(), 0);
    return () => window.clearTimeout(timer);
  }, [refrescar]);

  useEffect(() => {
    const canal = suscribirseAAcuerdos(
      `carbon-chat-${convId}`,
      `conversation_id.eq.${convId}`,
      () => void refrescar(),
    );
    return () => canal.close();
  }, [convId, refrescar]);

  if (!userId) return null;

  const acuerdo = acuerdos[0] ?? null;
  const soyVendedor = conversacion.sellerId === userId;
  const sinVendedorCuenta = !conversacion.sellerId;

  function abrir(): void {
    setTons(conversacion.proposal?.quantityTons ?? 10);
    setPctVendedor(50);
    setNotas("");
    setAviso(null);
    setAbierto((v) => !v);
  }

  async function proponer(): Promise<void> {
    if (!userId || !conversacion.sellerId) return;
    setGuardando(true);
    const r = await proponerAcuerdo({
      conversationId: convId,
      contractId: null,
      offerId: conversacion.offerId,
      sellerId: conversacion.sellerId,
      buyerId: conversacion.buyerId,
      product: conversacion.product,
      tons,
      sellerSharePct: pctVendedor,
      buyerSharePct: 100 - pctVendedor,
      notes: notas,
      proposedBy: userId,
    });
    setAviso({ ok: r.ok, texto: r.message });
    setGuardando(false);
    if (r.ok) {
      setAbierto(false);
      void refrescar();
    }
  }

  async function responder(aceptar: boolean): Promise<void> {
    if (!acuerdo) return;
    setGuardando(true);
    const r = await responderAcuerdo(acuerdo.id, aceptar);
    setAviso({ ok: r.ok, texto: r.message });
    setGuardando(false);
    if (r.ok) void refrescar();
  }

  const color = acuerdo ? (COLOR_ESTADO[acuerdo.status] ?? COLOR_ESTADO.archivado) : null;
  const proponible = !acuerdo || acuerdo.status === "rechazado" || acuerdo.status === "archivado";

  return (
    <Card style={{ marginBottom: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>BioNexo Carbon · reparto de beneficios</h3>
        <span className="bn-badge" style={{ background: color ? color.b : "#f3f4f6", color: color ? color.c : "#4b5563", border: `1px solid ${color ? color.borde : "#e5e7eb"}` }}>
          {acuerdo ? acuerdo.status.toUpperCase() : "SIN ACUERDO"}
        </span>
      </div>

      <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55 }}>
        <Muted>
          Si con este material llegan a certificar un proyecto de carbono, el ingreso por créditos
          se reparte según lo que acuerden acá. Firmar un acuerdo <strong>no</strong> genera
          créditos: son tres cosas distintas (impacto estimado, potencial de certificación y
          créditos certificados, que hoy son 0).
        </Muted>
      </p>

      {acuerdo && color ? (
        <div
          style={{
            marginTop: 12,
            border: `1px solid ${color.borde}`,
            background: color.b,
            borderRadius: 14,
            padding: 14,
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <strong>
              {acuerdo.product} · {acuerdo.tons} t · vendedor {acuerdo.sellerSharePct}% /
              comprador {acuerdo.buyerSharePct}%
            </strong>
            <span style={{ fontSize: 13, color: color.c }}>
              {nombres[acuerdo.sellerId] ?? "Vendedor"} / {nombres[acuerdo.buyerId] ?? "Comprador"}
            </span>
          </div>

          {acuerdo.notes ? (
            <div style={{ fontSize: 13 }}>Nota: {acuerdo.notes}</div>
          ) : null}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {acuerdo.status === "propuesto" && acuerdo.proposedBy !== userId ? (
              <>
                <Btn onClick={() => void responder(true)} disabled={guardando}>
                  {guardando ? "Guardando…" : "Aceptar acuerdo"}
                </Btn>
                <Btn kind="ghost" onClick={() => void responder(false)} disabled={guardando}>
                  Rechazar
                </Btn>
              </>
            ) : null}
            {acuerdo.status === "propuesto" && acuerdo.proposedBy === userId ? (
              <Muted>Propuesta enviada: esperando la respuesta de la otra parte.</Muted>
            ) : null}
            {acuerdo.status === "aceptado" ? (
              <Muted>Ambas partes aceptaron. Aún no hay créditos certificados: falta verificar y registrar el proyecto.</Muted>
            ) : null}
            {acuerdo.status === "rechazado" ? <Muted>Acuerdo rechazado. Pueden proponer otra distribución.</Muted> : null}
          </div>
        </div>
      ) : null}

      {proponible ? (
        <div style={{ marginTop: 12 }}>
          {!abierto ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Btn kind="sec" onClick={abrir} disabled={sinVendedorCuenta}>
                {acuerdo ? "Proponer otro acuerdo" : "Proponer acuerdo BioNexo Carbon"}
              </Btn>
              {sinVendedorCuenta ? (
                <Muted>Disponible cuando el vendedor tiene cuenta en la plataforma.</Muted>
              ) : (
                <Muted>{soyVendedor ? "Sos el vendedor en esta conversación." : "Sos el comprador en esta conversación."}</Muted>
              )}
            </div>
          ) : (
            <div
              style={{
                border: "1px solid #dbeafe",
                background: "#f8faff",
                borderRadius: 14,
                padding: 14,
                display: "grid",
                gap: 12,
              }}
            >
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
                <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
                  <strong>Toneladas del acuerdo</strong>
                  <input
                    className="bn-input"
                    type="number"
                    min={0}
                    step="0.5"
                    value={tons}
                    onChange={(e) => setTons(Math.max(0, Number(e.target.value)))}
                  />
                </label>
                <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
                  <strong>Vendedor: {pctVendedor}%</strong>
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
                <strong>Condiciones</strong>
                <textarea
                  className="bn-input"
                  rows={2}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej.: si el proyecto se certifica, el ingreso se reparte según los porcentajes."
                />
              </label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <Btn onClick={() => void proponer()} disabled={guardando || tons <= 0}>
                  {guardando ? "Registrando…" : "Registrar propuesta"}
                </Btn>
                <Btn kind="ghost" onClick={() => setAbierto(false)}>
                  Cancelar
                </Btn>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {aviso ? (
        <p role={aviso.ok ? "status" : "alert"} style={{ margin: "10px 0 0", fontSize: 13, color: aviso.ok ? "#166534" : "#b91c1c", fontWeight: 600 }}>
          {aviso.texto}
        </p>
      ) : null}
    </Card>
  );
}
