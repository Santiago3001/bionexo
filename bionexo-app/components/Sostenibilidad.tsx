"use client";
import { useStore } from "@/lib/store";
import { Btn, Card, Muted } from "./ui";
import { useState } from "react";

function isoData(trueque: boolean) {
  const t = trueque ? 10 : 0, gen = 100, val = 40 + t, disp = gen - val;
  const cl: [string, number][] = [["Contexto de la organización", 90], ["Liderazgo", 70], ["Planificación", 60], ["Apoyo", 65], ["Operación", 55 + (trueque ? 8 : 0)], ["Evaluación del desempeño", 30], ["Mejora", 40]];
  return { val, gen, disp, pctVal: Math.round((val / gen) * 100), cl, global: Math.round(cl.reduce((a, b) => a + b[1], 0) / cl.length) };
}

export default function Sostenibilidad() {
  const { user, truequeDone } = useStore();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const d = isoData(truequeDone);
  const prev = 32, meta = 68;
  const gaps = [["Realizar auditoría interna del SGA", "Resp. de Calidad", "30/11/2026"], ["Designar representante de la dirección", "Gerencia General", "31/10/2026"], ["Completar matriz de requisitos legales", "Asesor legal", "15/12/2026"], ["Cerrar 3 no conformidades abiertas", "Jefe de Planta", "30/11/2026"], ["Definir objetivos ambientales con metas medibles", "Resp. de Calidad", "20/12/2026"], ["Revisión por la dirección", "Gerencia General", "31/01/2027"]];

  return (
    <>
      <Card>
        <h2 style={{ margin: 0 }}>Sostenibilidad de la empresa · {user.company}</h2>
        <p><Muted>Avance de gestión ambiental propia hacia ISO 14001. Este módulo no incluye datos de transporte.</Muted></p>
        {truequeDone ? <strong>Trueque completado: +10 t valorizadas ya sumadas</strong> : <Muted>Completá el trueque para ver cómo mejora el indicador.</Muted>}
      </Card>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        <Card>
          <strong>A. Avance ISO 14001 por cláusulas</strong>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{d.global}% global</div>
          <div style={{ height: 10, background: "#d8e2dc", borderRadius: 6 }}><div style={{ width: `${d.global}%`, height: "100%", background: "#228b22" }} /></div>
          <table style={{ width: "100%", fontSize: 14, marginTop: 8 }}><tbody>{d.cl.map(([n, v], i) => <tr key={n}><td>{i + 4}. {n}</td><td style={{ width: 110 }}><div style={{ height: 10, background: "#d8e2dc", borderRadius: 6 }}><div style={{ width: `${v}%`, height: "100%", background: "#228b22" }} /></div></td><td>{v}%</td></tr>)}</tbody></table>
        </Card>
        <Card>
          <strong>B. Indicadores de mejora propia</strong>
          <table style={{ width: "100%", fontSize: 14 }}><tbody>
            <tr><td>Toneladas valorizadas / mes</td><td><strong>{d.val} t</strong></td></tr>
            <tr><td>Reutilizado vs dispuesto</td><td><strong>{d.pctVal}%</strong> / {100 - d.pctVal}%</td></tr>
            <tr><td>Reducción disposición (vs 60 t base)</td><td><strong>{Math.round(((60 - d.disp) / 60) * 100)}%</strong></td></tr>
            <tr><td>Cumplimiento legal</td><td><strong>78%</strong></td></tr>
            <tr><td>No conformidades</td><td><strong>3</strong> abiertas · <strong>9</strong> cerradas</td></tr>
          </tbody></table>
        </Card>
      </div>
      <Card>
        <strong>C. Evolución de valorización</strong>
        <table style={{ width: "100%" }}><thead><tr><th></th><th>Mes anterior</th><th>Mes actual</th><th>Meta</th></tr></thead><tbody><tr><td>% valorizado</td><td>{prev}%</td><td style={{ color: "#15803d", fontWeight: 700 }}>{d.pctVal}%</td><td>{meta}%</td></tr></tbody></table>
        <p><Muted>Avance hacia la meta: {Math.round((d.pctVal / meta) * 100)}% · Mejora: +{d.pctVal - prev} pts.</Muted></p>
      </Card>
      <Card>
        <strong>D. Brechas y plan de acción</strong>
        <table style={{ width: "100%", fontSize: 14 }}><thead><tr><th>Brecha</th><th>Responsable</th><th>Fecha</th></tr></thead><tbody>{gaps.map((g) => <tr key={g[0]}><td>{g[0]}</td><td>{g[1]}</td><td>{g[2]}</td></tr>)}</tbody></table>
      </Card>
      <Card>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => setOpen(true)}>Ver tablero ISO 14001</Btn>
          <Btn kind="sec" onClick={() => alert("Demo: Reporte PDF")}>Descargar Reporte (PDF)</Btn>
        </div>
        <p><Muted>BioNexo organiza evidencia y estima indicadores. La certificación la otorga un organismo acreditado.</Muted></p>
      </Card>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "#0009", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }} onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 22, maxWidth: 600, width: "100%" }}>
            <h3>Tablero ISO 14001 (demo)</h3>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{d.global}% avance</div>
            <table style={{ width: "100%", fontSize: 14 }}><tbody>{d.cl.map(([n, v]) => <tr key={n}><td>{n}</td><td>{v >= 70 ? "En buen estado" : v >= 50 ? "En desarrollo" : "Prioritario"}</td></tr>)}</tbody></table>
            <p><Muted>Informativo, no certificación.</Muted></p>
            <Btn kind="sec" onClick={() => setOpen(false)}>Cerrar</Btn>
          </div>
        </div>
      )}
    </>
  );
}
