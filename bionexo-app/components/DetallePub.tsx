"use client";

import Link from "next/link";
import type { Pub } from "@/lib/data";
import { usd } from "@/lib/data";
import { Btn, Muted } from "./ui";
import ProductImage from "./ProductImage";
import SellosPublicos from "./SellosPublicos";

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderTop: "1px solid var(--color-border)", fontSize: 14 }}>
      <Muted>{k}</Muted>
      <span style={{ textAlign: "right", fontWeight: 600 }}>{v}</span>
    </div>
  );
}

export default function DetallePub({ pub, onBuy, compact = false }: { pub: Pub; onBuy?: (id: number) => void; compact?: boolean }) {
  return (
    <div>
      <ProductImage product={pub.product} height={compact ? 160 : 220} />
      <div style={{ padding: compact ? "16px 4px 0" : "20px 4px 0" }}>
        <Muted>{pub.seller} · {pub.city}</Muted>
        <h2 style={{ margin: "4px 0 8px" }}>{pub.product}</h2>
        <div style={{ fontSize: 28, fontWeight: 800 }}>US$ {pub.price}<span style={{ fontSize: 14, fontWeight: 400, color: "var(--color-muted-fg)" }}>/t</span></div>
        <p style={{ fontSize: 13, color: "var(--color-muted-fg)" }}>Valor mensual aprox: {usd(pub.t * pub.price)} · {pub.t} t/mes</p>

        <Row k="Disponible" v={`${pub.t} t/mes`} />
        <Row k="Calidad" v={`${pub.q}/10`} />
        <Row k="Presentación" v={pub.presentation || "A granel"} />
        <Row k="Retiro" v={pub.pickupTerms || "A convenir"} />
        {pub.qualityNotes ? <Row k="Análisis" v={pub.qualityNotes} /> : null}
        {pub.frequency ? <Row k="Frecuencia" v={pub.frequency} /> : null}

        {pub.ownerId ? <div style={{ marginTop: 16 }}><SellosPublicos sellerId={pub.ownerId} /></div> : null}

        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {onBuy ? <Btn onClick={() => onBuy(pub.id)}>Comprar ahora</Btn> : null}
          {compact ? (
            <Link href={`/comprador/subproducto/${pub.id}`} className="bn-btn bn-btn--sec" style={{ textDecoration: "none", padding: "12px 20px", fontSize: 14 }}>Abrir página completa</Link>
          ) : (
            <Link href="/comprador/subproducto" className="bn-btn bn-btn--sec" style={{ textDecoration: "none", padding: "12px 20px", fontSize: 14 }}>Volver al catálogo</Link>
          )}
        </div>
      </div>
    </div>
  );
}
