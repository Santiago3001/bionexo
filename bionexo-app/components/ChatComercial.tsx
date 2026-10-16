"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, Btn, Muted, Tag } from "@/components/ui";
import { useStore } from "@/lib/store";
import {
  cargarConversacion,
  cargarMensajes,
  confirmarAcuerdo,
  enviarMensaje,
  proponerCondiciones,
  suscribirseAHilos,
  type Condiciones,
  type Conversacion,
  type Mensaje,
} from "@/lib/chat";
import { crearContrato } from "@/lib/contracts";

const FRECUENCIAS = ["Semanal", "Quincenal", "Mensual"];

const CONDICIONES_INICIALES: Condiciones = {
  quantityTons: 10,
  unitPrice: 35,
  frequency: "Mensual",
  durationMonths: 6,
  terms: "Retiro a cargo del comprador. Pago a 30 días contra entrega. Análisis de calidad previo a la carga.",
  startDate: "",
  contractType: "spot",
  downPaymentPct: 20,
  penaltyPct: 10,
};

function hora(iso: string): string {
  const fecha = new Date(iso);
  return fecha.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function ChatComercial({ conversationId }: { conversationId: string }) {
  const { user, role } = useStore();

  const [conversacion, setConversacion] = useState<Conversacion | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [borrador, setBorrador] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensajeSistema, setMensajeSistema] = useState("");
  const [esError, setEsError] = useState(false);
  const [propuesta, setPropuesta] = useState<Condiciones>(CONDICIONES_INICIALES);
  const [guardandoPropuesta, setGuardandoPropuesta] = useState(false);
  const [creandoContrato, setCreandoContrato] = useState(false);
  const [cargando, setCargando] = useState(true);

  const finDeLista = useRef<HTMLDivElement | null>(null);
  const userId = user?.id ?? "";

  const refrescar = useCallback(async () => {
    if (!userId) return;
    const [conv, msgs] = await Promise.all([
      cargarConversacion(conversationId, userId),
      cargarMensajes(conversationId),
    ]);
    setConversacion(conv);
    setMensajes(msgs);
    if (conv?.proposal) setPropuesta(conv.proposal);
    setCargando(false);
  }, [conversationId, userId]);

  useEffect(() => {
    if (!userId) return;
    void refrescar();
    const suscripcion = suscribirseAHilos(conversationId, () => void refrescar());
    const polling = window.setInterval(() => void refrescar(), 8000);
    return () => {
      suscripcion.close();
      window.clearInterval(polling);
    };
  }, [conversationId, userId, refrescar]);

  useEffect(() => {
    finDeLista.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  async function handleEnviar() {
    const texto = borrador.trim();
    if (!texto || !userId) return;
    setEnviando(true);
    const ok = await enviarMensaje(conversationId, userId, texto);
    setEnviando(false);
    if (ok) {
      setBorrador("");
      await refrescar();
    } else {
      setMensajeSistema("No se pudo enviar el mensaje.");
      setEsError(true);
    }
  }

  async function handleProponer() {
    if (!userId) return;
    setGuardandoPropuesta(true);
    const result = await proponerCondiciones(conversationId, propuesta, userId);
    setGuardandoPropuesta(false);
    setMensajeSistema(result.message);
    setEsError(!result.ok);
    await refrescar();
  }

  async function handleConfirmar() {
    if (!userId) return;
    setGuardandoPropuesta(true);
    const result = await confirmarAcuerdo(conversationId, userId);
    setGuardandoPropuesta(false);
    setMensajeSistema(result.message);
    setEsError(!result.ok);
    await refrescar();
  }

  async function handleCrearContrato() {
    if (!user || !conversacion) return;
    if (!conversacion.sellerId || !conversacion.proposal) return;
    setCreandoContrato(true);
    const result = await crearContrato(
      conversationId,
      conversacion.buyerId,
      conversacion.sellerId,
      conversacion.product,
      conversacion.proposal,
      user.id,
    );
    setCreandoContrato(false);
    setMensajeSistema(result.message);
    setEsError(!result.ok);
  }

  if (!user) return null;
  if (cargando) return <Card><p>Cargando conversación…</p></Card>;
  if (!conversacion) {
    return (
      <Card>
        <p>No encontramos esta conversación.</p>
        <Link href="/mensajes" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Volver a mensajes</Link>
      </Card>
    );
  }

  const soyParte = conversacion.buyerId === userId || conversacion.sellerId === userId;
  const contraparte = conversacion.soyComprador ? conversacion.sellerDisplay : conversacion.buyerName;
  const acordado = conversacion.agreedStatus === "acordado";
  const confirmoYo = Boolean(
    conversacion.soyComprador ? conversacion.buyerConfirmedAt : conversacion.sellerConfirmedAt,
  );
  const confirmoOtro = Boolean(
    conversacion.soyComprador ? conversacion.sellerConfirmedAt : conversacion.buyerConfirmedAt,
  );

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0,1fr)", maxWidth: 940 }}>
      {/* ------------------------------ Hilo ------------------------------ */}
      <Card style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
          <div>
            <h3 style={{ margin: "0 0 4px" }}>{conversacion.product}</h3>
            <Muted>
              {conversacion.soyComprador ? "Vendedor" : "Comprador"}: <strong>{contraparte}</strong>
              {conversacion.city ? ` · ${conversacion.city}` : ""}
            </Muted>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Tag>{conversacion.status}</Tag>
            <Link href="/mensajes" style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 600 }}>Todos los chats</Link>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            maxHeight: 380,
            overflowY: "auto",
            background: "var(--color-bg-alt)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: 14,
            display: "grid",
            gap: 10,
          }}
        >
          {mensajes.length === 0 && <Muted>Todavía no hay mensajes. Escribí el primero.</Muted>}
          {mensajes.map((m) => {
            const mio = m.senderId === userId;
            return (
              <div
                key={m.id}
                style={{
                  justifySelf: mio ? "end" : "start",
                  maxWidth: "78%",
                  background: mio ? "var(--color-primary)" : "#fff",
                  color: mio ? "#fff" : "var(--color-foreground)",
                  border: mio ? "none" : "1px solid var(--color-border)",
                  borderRadius: 14,
                  padding: "8px 12px",
                }}
              >
                <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{m.body}</div>
                <div style={{ fontSize: 10, opacity: 0.75, marginTop: 4, textAlign: "right" }}>
                  {mio ? "Vos" : contraparte} · {hora(m.createdAt)}
                </div>
              </div>
            );
          })}
          <div ref={finDeLista} />
        </div>

        {soyParte && conversacion.status !== "cerrada" ? (
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <input
              className="bn-input"
              placeholder={`Escribile a ${contraparte}…`}
              value={borrador}
              onChange={(event) => setBorrador(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleEnviar();
              }}
              maxLength={2000}
            />
            <Btn onClick={() => void handleEnviar()} disabled={enviando || !borrador.trim()}>
              {enviando ? "Enviando…" : "Enviar"}
            </Btn>
          </div>
        ) : (
          <p style={{ marginTop: 12 }}>
            <Muted>Esta conversación está cerrada.</Muted>
          </p>
        )}
      </Card>

      {/* --------------------- Resumen de condiciones --------------------- */}
      <Card style={{ marginBottom: 0 }}>
        <h3 style={{ marginTop: 0 }}>Resumen de condiciones</h3>
        {!conversacion.proposal && (
          <p><Muted>Ninguna de las partes propuso condiciones todavía. Completá la propuesta y enviála para que la otra parte confirme.</Muted></p>
        )}

        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", marginTop: 8 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Cantidad (t por entrega)</strong>
            <input
              className="bn-input"
              type="number"
              min={1}
              value={propuesta.quantityTons}
              onChange={(event) => setPropuesta({ ...propuesta, quantityTons: Number(event.target.value) })}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Precio por t (USD)</strong>
            <input
              className="bn-input"
              type="number"
              min={0}
              value={propuesta.unitPrice}
              onChange={(event) => setPropuesta({ ...propuesta, unitPrice: Number(event.target.value) })}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Frecuencia</strong>
            <select
              className="bn-input"
              value={propuesta.frequency}
              onChange={(event) => setPropuesta({ ...propuesta, frequency: event.target.value })}
            >
              {FRECUENCIAS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Duración (meses)</strong>
            <input
              className="bn-input"
              type="number"
              min={1}
              max={60}
              value={propuesta.durationMonths}
              onChange={(event) => setPropuesta({ ...propuesta, durationMonths: Number(event.target.value) })}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Tipo</strong>
            <select
              className="bn-input"
              value={propuesta.contractType ?? "spot"}
              onChange={(event) => setPropuesta({ ...propuesta, contractType: event.target.value as "spot" | "futuro" })}
            >
              <option value="spot">Spot</option>
              <option value="futuro">Futuro (preventa)</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Inicio de entregas</strong>
            <input
              className="bn-input"
              type="date"
              value={propuesta.startDate ?? ""}
              onChange={(event) => setPropuesta({ ...propuesta, startDate: event.target.value })}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Seña (%)</strong>
            <input
              className="bn-input"
              type="number"
              min={0}
              max={100}
              value={propuesta.downPaymentPct ?? 0}
              onChange={(event) => setPropuesta({ ...propuesta, downPaymentPct: Number(event.target.value) })}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Penalidad (%)</strong>
            <input
              className="bn-input"
              type="number"
              min={0}
              max={100}
              value={propuesta.penaltyPct ?? 0}
              onChange={(event) => setPropuesta({ ...propuesta, penaltyPct: Number(event.target.value) })}
            />
          </label>
          <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
            <strong>Condiciones comerciales</strong>
            <textarea
              className="bn-input"
              rows={3}
              value={propuesta.terms}
              onChange={(event) => setPropuesta({ ...propuesta, terms: event.target.value })}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
          <Btn onClick={() => void handleProponer()} disabled={!soyParte || guardandoPropuesta || creandoContrato}>
            {guardandoPropuesta ? "Guardando…" : "Proponer condiciones"}
          </Btn>

          {soyParte && !acordado && conversacion.proposal && (
            <button
              className="bn-btn bn-btn--sec"
              onClick={() => void handleConfirmar()}
              disabled={guardandoPropuesta || confirmoYo}
            >
              {confirmoYo ? "Esperando a la otra parte" : "Confirmar condiciones"}
            </button>
          )}
        </div>

        {conversacion.proposal && (
          <div
            style={{
              marginTop: 16,
              background: acordado ? "#ecfdf5" : "var(--color-bg-alt)",
              border: `1px solid ${acordado ? "#6ee7b7" : "var(--color-border)"}`,
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <strong>
                {conversacion.proposal.quantityTons} t · USD {conversacion.proposal.unitPrice}/t ·{" "}
                {conversacion.proposal.frequency} · {conversacion.proposal.durationMonths} meses
                {conversacion.proposal.contractType === "futuro" ? " · FUTURO" : ""}
                {conversacion.proposal.startDate ? ` · desde ${conversacion.proposal.startDate}` : ""}
              </strong>
              <span className="bn-badge" style={{ background: acordado ? "#059669" : "#f59e0b", color: "#fff" }}>
                {acordado ? "ACUERDO CERRADO" : "EN NEGOCIACIÓN"}
              </span>
            </div>
            <p style={{ margin: "10px 0 6px", fontSize: 14 }}>{conversacion.proposal.terms}</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "var(--color-muted-fg)" }}>
              <span>Comprador: {conversacion.buyerConfirmedAt ? `confirmó ${hora(conversacion.buyerConfirmedAt)}` : "pendiente"}</span>
              <span>Vendedor: {conversacion.sellerConfirmedAt ? `confirmó ${hora(conversacion.sellerConfirmedAt)}` : "pendiente"}</span>
            </div>

            {acordado && (
              <div style={{ marginTop: 14 }}>
                <Btn onClick={() => void handleCrearContrato()} disabled={creandoContrato || !conversacion.sellerId}>
                  {creandoContrato ? "Generando…" : "Preparar borrador de contrato"}
                </Btn>
                <p style={{ margin: "8px 0 0" }}>
                  <Muted>Genera el contrato en la tabla <code>contracts</code> con su calendario de entregas. Ver en <Link href="/contratos" style={{ color: "var(--color-primary)" }}>Contratos</Link>.</Muted>
                </p>
              </div>
            )}
          </div>
        )}

        {mensajeSistema && (
          <p role="status" style={{ marginTop: 14, color: esError ? "#b91c1c" : "#166534", fontWeight: 600 }}>
            {mensajeSistema}
          </p>
        )}

        {role === "transportista" && (
          <p><Muted>No participás de este acuerdo comercial.</Muted></p>
        )}
      </Card>
    </div>
  );
}
