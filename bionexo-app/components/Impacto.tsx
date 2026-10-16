"use client";
import { useStore } from "@/lib/store";
import { Btn, Card, Muted } from "./ui";

export default function Impacto() {
  const { pubs, orders, user } = useStore();
  if (!user) return null;
  const mine = pubs.filter((p) => p.seller === user.company).reduce((a, p) => a + p.t, 0);
  const sold = orders.filter((o) => o.seller === user.company).reduce((a, o) => a + o.t, 0);
  return (
    <>
      <Card><h2 style={{ margin: 0 }}>Reporte de impacto ambiental</h2><p><Muted>Toneladas que dejaste de mandar a disposición final (simulado).</Muted></p></Card>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        <Card><Muted>Publicadas por mes</Muted><div style={{ fontSize: 26, fontWeight: 800 }}>{mine} t</div></Card>
        <Card><Muted>Vendidas / en curso</Muted><div style={{ fontSize: 26, fontWeight: 800 }}>{sold} t</div></Card>
        <Card><Muted>Desviadas por año</Muted><div style={{ fontSize: 26, fontWeight: 800 }}>{mine * 12} t</div></Card>
        <Card><Muted>Emisiones evitadas (est.)</Muted><div style={{ fontSize: 26, fontWeight: 800 }}>{(mine * 12 * 0.25).toFixed(0)} tCO2e</div></Card>
      </div>
      <Card>
        <Btn onClick={() => alert("Demo: Reporte PDF")}>Descargar reporte (PDF)</Btn>
        <p><Muted>Estimación informativa. No es certificación.</Muted></p>
      </Card>
    </>
  );
}

