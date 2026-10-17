"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { abrirConversacion } from "@/lib/chat";
import { Card, Muted } from "./ui";
import MarketCard from "./MarketCard";
import DetallePub from "./DetallePub";
import { Modal } from "./ui";

export default function CatalogoComprador() {
  const { pubs, user } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const reales = pubs.filter((p) => p.ownerId && !p.simulated);
    if (!s) return reales;
    return reales.filter((p) => `${p.product} ${p.seller} ${p.city}`.toLowerCase().includes(s));
  }, [pubs, q]);

  if (!user) return null;
  const viewPub = viewId !== null ? pubs.find((p) => p.id === viewId) ?? null : null;

  async function negotiate(id: number) {
    const pub = pubs.find((p) => p.id === id);
    if (!pub || !user) return;
    setOpeningId(id);
    const conversationId = await abrirConversacion(
      { id: pub.id, ownerId: pub.ownerId ?? null, sellerName: pub.seller, product: pub.product, city: pub.city },
      user.id,
    );
    setOpeningId(null);
    if (conversationId) router.push(`/mensajes/${conversationId}`);
  }

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
            <MarketCard key={p.id} pub={p} onBuy={(id) => void negotiate(id)} onQuickView={setViewId} />
          ))}
        </div>
      )}

      {openingId !== null ? <p role="status"><Muted>Abriendo negociación…</Muted></p> : null}

      <Modal open={viewPub !== null} onClose={() => setViewId(null)}>
        {viewPub && <DetallePub pub={viewPub} onBuy={(id) => { setViewId(null); void negotiate(id); }} />}
      </Modal>
    </>
  );
}
