"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Estado = "idle" | "cargando" | "error";

interface ReporteButtonProps {
  tipo: "impacto" | "sostenibilidad";
  label?: string;
  kind?: "sec" | "warn" | "ghost";
}

export default function ReporteButton({ tipo, label = "Descargar reporte (PDF)", kind }: ReporteButtonProps) {
  const [estado, setEstado] = useState<Estado>("idle");
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  async function descargar(): Promise<void> {
    setEstado("cargando");
    setMensajeError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase no está configurado en este entorno.");

      const { data: sesion, error: errSesion } = await supabase.auth.getSession();
      if (errSesion) throw new Error(errSesion.message);
      const token = sesion.session?.access_token;
      if (!token) throw new Error("No hay sesión activa. Iniciá sesión para descargar el reporte.");

      const res = await fetch(`/api/reporte?tipo=${encodeURIComponent(tipo)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        let detalle = `Error ${res.status}`;
        try {
          const cuerpo = (await res.json()) as { error?: string };
          if (cuerpo.error) detalle = cuerpo.error;
        } catch {
          // la respuesta no traía JSON: nos quedamos con el status
        }
        throw new Error(detalle);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reporte-bionexo.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setEstado("idle");
    } catch (e) {
      setMensajeError(e instanceof Error ? e.message : "No se pudo generar el PDF.");
      setEstado("error");
    }
  }

  const cargando = estado === "cargando";
  const clase = kind === "sec" ? "bn-btn bn-btn--sec" : kind === "warn" ? "bn-btn bn-btn--warn" : kind === "ghost" ? "bn-btn bn-btn--ghost" : "bn-btn";

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
      <button className={clase} onClick={descargar} disabled={cargando}>
        {cargando ? "Generando PDF…" : label}
      </button>
      {estado === "error" && mensajeError ? (
        <span role="alert" style={{ color: "#b91c11", fontSize: 13 }}>{mensajeError}</span>
      ) : null}
    </span>
  );
}
