"use client";
import { useStore } from "@/lib/store";
import { Card, Muted } from "./ui";
import ReporteButton from "./ReporteButton";
import BioNexoCarbon from "./BioNexoCarbon";

export default function Impacto() {
  const { pubs, orders, user } = useStore();
  if (!user) return null;
  const mine = pubs.filter((p) => p.seller === user.company).reduce((a, p) => a + p.t, 0);
  const sold = orders.filter((o) => o.seller === user.company).reduce((a, o) => a + o.t, 0);
  return (
    <>
      {/* --- 1) BioNexo Carbon: funcionalidad principal de la sección --- */}
      <BioNexoCarbon />

      {/* --- 2) Todo lo existente queda debajo, sin cambios --- */}
      <div style={{ margin: "8px 0 4px" }}>
        <h2 style={{ margin: 0 }}>Otros indicadores de impacto ambiental</h2>
        <p style={{ margin: "6px 0 0" }}>
          <Muted>Indicadores, cálculos y reportes ambientales disponibles hasta hoy.</Muted>
        </p>
      </div>
      <Card><h2 style={{ margin: 0 }}>Reporte de impacto ambiental</h2><p><Muted>Volúmenes comerciales registrados. El impacto evitado requiere conocer y validar la línea base.</Muted></p></Card>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        <Card><Muted>Publicadas por mes</Muted><div style={{ fontSize: 26, fontWeight: 800 }}>{mine} t</div></Card>
        <Card><Muted>Vendidas / en curso</Muted><div style={{ fontSize: 26, fontWeight: 800 }}>{sold} t</div></Card>
        <Card><Muted>Volumen anual potencial</Muted><div style={{ fontSize: 26, fontWeight: 800 }}>{mine * 12} t</div></Card>
        <Card><Muted>Emisiones evitadas</Muted><div style={{ fontSize: 26, fontWeight: 800 }}>Sin línea base</div></Card>
      </div>
      <Card>
        <ReporteButton tipo="impacto" />
        <p><Muted>Estimación informativa. No es certificación.</Muted></p>
      </Card>
    </>
  );
}

