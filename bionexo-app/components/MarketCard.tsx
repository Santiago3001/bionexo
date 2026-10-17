"use client";

import Link from "next/link";
import type { Pub } from "@/lib/data";
import { Btn, Muted } from "./ui";
import ProductImage from "./ProductImage";

export default function MarketCard({ pub, onBuy, onQuickView }: { pub: Pub; onBuy: (id: number) => void; onQuickView: (id: number) => void }) {
  return (
    <article className="bn-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column", marginBottom: 0 }}>
      <button type="button" onClick={() => onQuickView(pub.id)} aria-label={`Vista rápida de ${pub.product}`} style={{ border: 0, padding: 0, background: "transparent", cursor: "pointer", textAlign: "left" }}>
        <ProductImage product={pub.product} />
      </button>
      <div style={{ padding: 16, display: "grid", gap: 6, flex: 1 }}>
        <Muted>{pub.seller} · {pub.city}</Muted>
        <strong style={{ fontSize: 15, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 40 }}>{pub.product}</strong>
        <div style={{ fontSize: 22, fontWeight: 800 }}>US$ {pub.price}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-muted-fg)" }}>/t</span></div>
        <div style={{ fontSize: 13, color: "var(--color-muted-fg)" }}>{pub.t} t/mes · Calidad {pub.q}/10</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Link href={`/comprador/subproducto/${pub.id}`} className="bn-btn bn-btn--sec" style={{ flex: 1, textAlign: "center", textDecoration: "none", padding: "10px 12px", fontSize: 14 }}>Ver detalle</Link>
          <Btn onClick={() => onBuy(pub.id)}>Negociar</Btn>
        </div>
      </div>
    </article>
  );
}
