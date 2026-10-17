"use client";

import { useCallback, useEffect, useState } from "react";
import { ORDER_STEPS, usd, type Order } from "@/lib/data";
import { avanzarOperacion, listarOperacionesTransporte, tomarOperacion } from "@/lib/operations";
import { useStore } from "@/lib/store";
import { Btn, Card, Muted, Tag } from "./ui";

export default function OperacionesTransportista() {
  const { user } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    setOrders(await listarOperacionesTransporte());
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      const result = await listarOperacionesTransporte();
      if (active) setOrders(result);
    }
    void init();
    return () => { active = false; };
  }, []);

  async function run(order: Order, action: "take" | "advance") {
    setBusy(order.id);
    const result = action === "take" ? await tomarOperacion(order.id) : await avanzarOperacion(order.id);
    setMessage(result.message);
    if (result.ok) await refresh();
    setBusy(null);
  }

  if (!user) return null;
  const available = orders.filter((o) => !o.carrierId && o.st === 0);
  const mine = orders.filter((o) => o.carrierId === user.id);

  return (
    <Card>
      <h2 style={{ marginTop: 0 }}>Operaciones comerciales reales</h2>
      <p><Muted>Estas cargas nacen de un acuerdo confirmado entre comprador y vendedor. Al tomarlas, los tres usuarios comparten el mismo seguimiento.</Muted></p>
      {message ? <p role="status" style={{ fontWeight: 700 }}>{message}</p> : null}
      {[...available, ...mine].map((o) => (
        <div key={o.id} style={{ borderTop: "1px solid var(--color-border)", padding: "12px 0", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <strong>{o.id} · {o.product}</strong> <Tag>{ORDER_STEPS[o.st]}</Tag><br />
            <Muted>{o.t} t · {o.from} → {o.to} · {o.seller} → {o.buyer} · {usd(o.value)}</Muted>
          </div>
          {!o.carrierId ? (
            <Btn onClick={() => void run(o, "take")} disabled={busy === o.id}>{busy === o.id ? "Asignando…" : "Tomar operación"}</Btn>
          ) : o.st < 4 ? (
            <Btn kind="sec" onClick={() => void run(o, "advance")} disabled={busy === o.id}>{busy === o.id ? "Actualizando…" : `Avanzar a: ${ORDER_STEPS[o.st + 1]}`}</Btn>
          ) : <strong style={{ color: "#15803d" }}>Entrega completada</strong>}
        </div>
      ))}
      {available.length + mine.length === 0 ? <Muted>No hay operaciones logísticas disponibles por el momento.</Muted> : null}
    </Card>
  );
}
