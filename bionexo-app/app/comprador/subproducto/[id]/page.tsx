"use client";

import { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { Shell } from "@/components/Shell";
import { Card, Muted } from "@/components/ui";
import DetallePub from "@/components/DetallePub";
import CircuitoCompra from "@/components/CircuitoCompra";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Cargando publicación…</div>}>
      <DetailContent />
    </Suspense>
  );
}

function DetailContent() {
  const params = useParams<{ id: string }>();
  const { pubs, user } = useStore();
  const [buyId, setBuyId] = useState<number | null>(null);

  const id = Number(params.id);
  const pub = pubs.find((p) => p.id === id);

  return (
    <Shell>
      {!pub ? (
        <Card><p><Muted>Publicación no encontrada.</Muted></p></Card>
      ) : (
        <Card>
          <DetallePub pub={pub} onBuy={(pid) => setBuyId(pid)} />
          {!user ? <p><Muted>Iniciá sesión para comprar.</Muted></p> : null}
        </Card>
      )}
      {buyId !== null && <CircuitoCompra pubId={buyId} onClose={() => setBuyId(null)} />}
    </Shell>
  );
}
