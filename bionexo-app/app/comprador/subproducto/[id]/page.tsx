"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Shell } from "@/components/Shell";
import { Card, Muted } from "@/components/ui";
import DetallePub from "@/components/DetallePub";
import { abrirConversacion } from "@/lib/chat";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Cargando publicación…</div>}>
      <DetailContent />
    </Suspense>
  );
}

function DetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { pubs, user } = useStore();
  const [opening, setOpening] = useState(false);

  const id = Number(params.id);
  const pub = pubs.find((p) => p.id === id);

  async function negotiate() {
    if (!pub || !user) return;
    setOpening(true);
    const conversationId = await abrirConversacion(
      { id: pub.id, ownerId: pub.ownerId ?? null, sellerName: pub.seller, product: pub.product, city: pub.city },
      user.id,
    );
    setOpening(false);
    if (conversationId) router.push(`/mensajes/${conversationId}`);
  }

  return (
    <Shell>
      {!pub ? (
        <Card><p><Muted>Publicación no encontrada.</Muted></p></Card>
      ) : (
        <Card>
          <DetallePub pub={pub} onBuy={() => void negotiate()} />
          {opening ? <p><Muted>Abriendo negociación…</Muted></p> : null}
          {!user ? <p><Muted>Iniciá sesión para comprar.</Muted></p> : null}
        </Card>
      )}
    </Shell>
  );
}
