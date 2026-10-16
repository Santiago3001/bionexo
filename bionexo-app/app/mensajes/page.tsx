"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { Card, Muted, Tag } from "@/components/ui";
import { useStore } from "@/lib/store";
import { listarConversaciones, suscribirseANotificaciones, type Conversacion } from "@/lib/chat";

function fecha(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MensajesPage() {
  const { user, role } = useStore();
  const [lista, setLista] = useState<Conversacion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!user) return;
    let vivo = true;
    const refrescar = async () => {
      const conversaciones = await listarConversaciones(user.id);
      if (vivo) setLista(conversaciones);
      if (vivo) setCargando(false);
    };
    void refrescar();
    const suscripcion = suscribirseANotificaciones(user.id, () => void refrescar());
    const polling = window.setInterval(() => void refrescar(), 15000);
    return () => {
      vivo = false;
      suscripcion.close();
      window.clearInterval(polling);
    };
  }, [user]);

  if (!user) return null;

  return (
    <Shell>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "baseline" }}>
          <div>
            <h3 style={{ margin: "0 0 4px" }}>Mensajes</h3>
            <Muted>Chat comercial persistente: cada conversación queda guardada en Supabase y sólo la ven sus participantes.</Muted>
          </div>
          <Tag>{role}</Tag>
        </div>
      </Card>

      {cargando && (
        <Card><p>Cargando conversaciones…</p></Card>
      )}

      {!cargando && lista.length === 0 && (
        <Card>
          <p style={{ margin: "0 0 8px" }}><strong>Todavía no tenés conversaciones.</strong></p>
          <Muted>
            {role === "comprador"
              ? "Entrá a Requerimiento y elegí “Negociar” en una proveedora para abrir el chat."
              : role === "vendedor"
                ? "Cuando un comprador abra una negociación sobre tu publicación, va a aparecer acá."
                : "El chat comercial está disponible para compradores y vendedores."}
          </Muted>
        </Card>
      )}

      {lista.map((c) => (
        <Link key={c.id} href={`/mensajes/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <strong>{c.product}</strong>{" "}
                <span className="bn-badge">{c.status}</span>
                <div style={{ fontSize: 14, color: "var(--color-muted-fg)", marginTop: 4 }}>
                  {c.soyComprador ? "Vendedor" : "Comprador"}: {c.soyComprador ? c.sellerDisplay : c.buyerName}
                  {c.city ? ` · ${c.city}` : ""}
                </div>
                <div style={{ fontSize: 14, marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 560 }}>
                  {c.ultimaMensaje ? `“${c.ultimaMensaje}”` : "Sin mensajes todavía"}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--color-subtle-fg)", whiteSpace: "nowrap" }}>
                {fecha(c.ultimaAt ?? c.updated_at)}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </Shell>
  );
}
