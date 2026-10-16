"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, Muted } from "./ui";
import MarketCard from "./MarketCard";
import CircuitoCompra from "./CircuitoCompra";
import DetallePub from "./DetallePub";
import { Modal } from "./ui";

export default function CatalogoComprador() {
  const { pubs, user } = useStore();
  const [q, setQ] = useState("");
  const [buyId, setBuyId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return pubs;
    return pubs.filter((p) => `${p.product} ${p.seller} ${p.city}`.toLowerCase().includes(s));
  }, [pubs, q]);

  if (!user) return null;
  const viewPub = viewId !== null ? pubs.find((p) => p.id === viewId) ?? null : null;

  return (
    <>
      <Card>
        <h2 style={{ marginTop: 0 }}>Material disponible</h2>
        <p><Muted>{list.length} publicaciones · foto ilustrativa por tipo de producto</Muted></p>
        <input
          className="bn-input"
          placeholder="Buscar por producto, vendedor o ciudad…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar publicaciones"
        />
      </Card>

      {list.length === 0 ? (
        <Card><p><Muted>Sin resultados para esa búsqueda.</Muted></p></Card>
      ) : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
          {list.map((p) => (
            <MarketCard key={p.id} pub={p} onBuy={setBuyId} onQuickView={setViewId} />
          ))}
        </div>
      )}

      {buyId !== null && <CircuitoCompra pubId={buyId} onClose={() => setBuyId(null)} />}

      <Modal open={viewPub !== null} onClose={() => setViewId(null)}>
        {viewPub && <DetallePub pub={viewPub} onBuy={(id) => { setViewId(null); setBuyId(id); }} />}
      </Modal>
    </>
  );
}
