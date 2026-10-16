"use client";
import { useState } from "react";
import { PRODUCTS, usd } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Card, Muted } from "./ui";

export default function Cotizador() {
  const { pubs } = useStore();
  const [product, setProduct] = useState(pubs[0]?.product ?? PRODUCTS[0]);
  const [t, setT] = useState(pubs[0]?.t ?? 15);
  const [pr, setPr] = useState(pubs[0]?.price ?? 30);
  const [m, setM] = useState(6);
  const [d, setD] = useState(10);

  const vals = pubs.filter((p) => p.product === product).map((p) => p.price);
  const k = vals.length ? { min: Math.min(...vals), max: Math.max(...vals), avg: vals.reduce((a, b) => a + b, 0) / vals.length } : { min: pr, max: pr, avg: pr };
  const marg = pr - m, ah = t * d, mes = t * marg + ah, be = Math.max(0, m - d);
  let col = "var(--color-primary)", bg = "#228b221a", tx = "Conviene vender a este precio.";
  if (mes <= 0) { col = "#dc2626"; bg = "#fee2e2"; tx = "No conviene: no cubre tus costos."; }
  else if (pr < k.avg * 0.9) { col = "#ca8a04"; bg = "#fef9c3"; tx = "Conviene, pero estás por debajo del mercado."; }
  const sug = pr < k.avg ? `Subí a US$ ${Math.round(k.avg)}/t y ganás ${usd(t * (k.avg - pr))} más por mes.` : "Tu precio está en línea o por encima del mercado.";

  return (
    <>
      <Card>
        <h2 style={{ margin: 0 }}>Cotizador de rentabilidad</h2>
        <p><Muted>Cotizá antes de vender: ¿te conviene a este precio?</Muted></p>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label>Subproducto</label>
            <select value={product} onChange={(e) => { setProduct(e.target.value); }} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--color-border)" }}>
              {PRODUCTS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <label>Toneladas por mes: {t}</label>
            <input type="range" min={1} max={60} value={t} onChange={(e) => setT(+e.target.value)} style={{ width: "100%" }} />
            <label>Precio de venta (US$/t): {pr}</label>
            <input type="range" min={5} max={80} value={pr} onChange={(e) => setPr(+e.target.value)} style={{ width: "100%" }} />
          </div>
          <div>
            <label>Costo de manejo US$/t</label>
            <input type="number" value={m} onChange={(e) => setM(+e.target.value || 0)} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--color-border)" }} />
            <label>Costo de disponer US$/t</label>
            <input type="number" value={d} onChange={(e) => setD(+e.target.value || 0)} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--color-border)" }} />
          </div>
        </div>
      </Card>
      <Card style={{ background: bg, borderColor: col }}><strong style={{ color: col }}>● {tx}</strong><br /><Muted>{sug}</Muted></Card>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        <Card><Muted>Margen por tonelada</Muted><div style={{ fontSize: 24, fontWeight: 800 }}>{usd(marg)}</div></Card>
        <Card><Muted>Ahorro por no disponer</Muted><div style={{ fontSize: 24, fontWeight: 800 }}>{usd(ah)}</div></Card>
        <Card><Muted>Resultado mensual</Muted><div style={{ fontSize: 24, fontWeight: 800 }}>{usd(mes)}</div></Card>
        <Card><Muted>Resultado anual</Muted><div style={{ fontSize: 24, fontWeight: 800 }}>{usd(mes * 12)}</div></Card>
        <Card><Muted>Precio de equilibrio</Muted><div style={{ fontSize: 24, fontWeight: 800 }}>US$ {be}/t</div></Card>
        <Card><Muted>Mercado (mín/prom/máx)</Muted><div style={{ fontSize: 20, fontWeight: 800 }}>{k.min} / {Math.round(k.avg)} / {k.max}</div></Card>
      </div>
    </>
  );
}

