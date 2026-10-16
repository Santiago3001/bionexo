"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  suscribirseANotificaciones,
  type Notificacion,
} from "@/lib/chat";
import { recordatoriosDeEntregas } from "@/lib/contracts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function hacePoco(iso: string): string {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutos < 1) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

/** Recordatorio local de entregas próximas (una vez por día). */
async function emitirRecordatorios(userId: string): Promise<boolean> {
  const hoy = new Date().toISOString().slice(0, 10);
  const clave = `bionexo_recordatorio_${userId}_${hoy}`;
  if (typeof window === "undefined" || window.localStorage.getItem(clave)) return false;

  const avisos = await recordatoriosDeEntregas(userId);
  if (avisos.length === 0) return false;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const { error } = await supabase.from("notifications").insert(
    avisos.map((aviso) => ({
      user_id: userId,
      type: "entrega",
      title: `Recordatorio: ${aviso.title}`,
      body: aviso.body,
      link: "/contratos",
    })),
  );

  if (!error) window.localStorage.setItem(clave, "1");
  return !error;
}

export default function NotificacionesBell() {
  const { user } = useStore();
  const router = useRouter();
  const [lista, setLista] = useState<Notificacion[]>([]);
  const [abierto, setAbierto] = useState(false);
  const panel = useRef<HTMLDivElement | null>(null);

  const refrescar = useCallback(async () => {
    if (!user) return;
    const notificaciones = await listarNotificaciones(user.id);
    setLista(notificaciones);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let vivo = true;
    const init = async () => {
      if (vivo) await emitirRecordatorios(user.id);
      if (vivo) await refrescar();
    };
    void init();
    const suscripcion = suscribirseANotificaciones(user.id, () => void refrescar());
    const polling = window.setInterval(() => void refrescar(), 30000);
    return () => {
      vivo = false;
      suscripcion.close();
      window.clearInterval(polling);
    };
  }, [user, refrescar]);

  useEffect(() => {
    if (!abierto) return;
    function fuera(evento: MouseEvent) {
      if (panel.current && !panel.current.contains(evento.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, [abierto]);

  if (!user) return null;

  const noLeidas = lista.filter((n) => !n.read).length;

  async function abrir(item: Notificacion) {
    await marcarNotificacionLeida(item.id);
    setAbierto(false);
    await refrescar();
    if (item.link) router.push(item.link);
  }

  async function marcarTodo() {
    await marcarTodasLeidas(user!.id);
    setAbierto(false);
    await refrescar();
  }

  return (
    <div ref={panel} style={{ position: "relative" }}>
      <button
        type="button"
        className="bn-mode-btn"
        onClick={() => setAbierto((valor) => !valor)}
        aria-label={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ""}`}
        style={{ position: "relative" }}
      >
        🔔 Notificaciones
        {noLeidas > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              background: "#dc2626",
              color: "#fff",
              borderRadius: 50,
              minWidth: 18,
              height: 18,
              fontSize: 11,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            {noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 340,
            maxWidth: "90vw",
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 14,
            boxShadow: "0 14px 40px rgba(15, 23, 42, .16)",
            zIndex: 60,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid var(--color-border)" }}>
            <strong style={{ fontSize: 14 }}>Notificaciones</strong>
            <button type="button" onClick={() => void marcarTodo()} style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Marcar todas leídas
            </button>
          </div>

          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {lista.length === 0 && (
              <p style={{ padding: 16, margin: 0, fontSize: 14, color: "var(--color-muted-fg)" }}>
                Sin notificaciones por ahora.
              </p>
            )}
            {lista.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void abrir(item)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: item.read ? "transparent" : "rgba(37, 99, 235, .07)",
                  border: "none",
                  borderBottom: "1px solid var(--color-border)",
                  padding: "11px 14px",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong style={{ fontSize: 13 }}>{item.title}</strong>
                  {!item.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: 5 }} />}
                </span>
                <span style={{ display: "block", fontSize: 13, color: "var(--color-muted-fg)", marginTop: 2 }}>
                  {item.body}
                </span>
                <span style={{ display: "block", fontSize: 11, color: "var(--color-subtle-fg)", marginTop: 4 }}>
                  {hacePoco(item.createdAt)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
