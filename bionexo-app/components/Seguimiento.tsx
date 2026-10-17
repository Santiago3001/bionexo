"use client";
import { ORDER_STEPS, Order } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Card, Muted } from "./ui";

function OrdCard({ o, buy }: { o: Order; buy: boolean }) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div><strong>{o.id}</strong> {o.kind === "trueque" && <span style={{ background: "#7c3aed", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>TRUEQUE</span>}<br /><Muted>{o.t} t de {o.product} · {o.from} → {o.to}</Muted></div>
        <div style={{ textAlign: "right" }}><strong>US$ {o.value}</strong><br /><Muted>{buy ? "Vendedor: " + o.seller : "Comprador: " + o.buyer}</Muted></div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0 6px" }}>
        {ORDER_STEPS.map((x, i) => <span key={x} style={{ padding: "5px 10px", borderRadius: 20, fontSize: 12, background: i < o.st || o.st === 4 ? "#228b22" : i === o.st ? "#1b4332" : "#f5f5e8", color: i <= o.st ? "#fff" : "#52796f" }}>{x}</span>)}
      </div>
      <div style={{ height: 10, background: "#d8e2dc", borderRadius: 6 }}><div style={{ width: `${(o.st / 4) * 100}%`, height: "100%", background: "#228b22" }} /></div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, flexWrap: "wrap", gap: 8 }}>
        <Muted>Transportista: {o.carrier} · {o.st === 4 ? "Entregado" : "llegada en " + o.eta}</Muted>
        {o.st < 4 ? <Muted>El transportista asignado actualiza este estado.</Muted> : <span style={{ color: "#15803d", fontWeight: 700 }}>{buy ? "Recepción confirmada" : "Entrega confirmada"}</span>}
      </div>
    </Card>
  );
}

export default function Seguimiento({ mode }: { mode: "compra" | "venta" }) {
  const { orders, user } = useStore();
  if (!user) return null;
  const buy = mode === "compra";
  const list = orders.filter((o) => (buy ? o.buyerId === user.id : o.sellerId === user.id));
  return (
    <>
      <Card>
        <h2 style={{ margin: 0 }}>{buy ? "Seguimiento de mis compras" : "Seguimiento de mis ventas"}</h2>
        <p><Muted>{buy ? "Seguí cada compra hasta la entrega en tu planta." : "Seguí cada venta hasta la entrega y el cobro."}</Muted></p>
      </Card>
      {list.map((o) => <OrdCard key={o.id} o={o} buy={buy} />)}
      {list.length === 0 && <Card><Muted>Todavía no tenés {buy ? "compras" : "ventas"}.</Muted></Card>}
    </>
  );
}

