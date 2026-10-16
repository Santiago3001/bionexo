"use client";
import { useMemo, useState } from "react";
import { CITIES, Pub, km, proj, usd, RATE } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Btn, Card, Muted } from "./ui";

const D0 = "Resistencia";
const CAP = 28;
const RETF = 0.7;

export default function Mapa() {
  const { pubs } = useStore();
  const [selId, setSelId] = useState<number | null>(null);
  const [rtype, setRtype] = useState<number | null>(null);

  const loads = useMemo(() => {
    return pubs
      .filter((p) => p.city !== D0)
      .map((p) => {
        const k = km(p.city, D0);
        const pay = Math.min(p.t, CAP) * k * RATE;
        const bon = pay * 0.15;
        return { id: p.id, label: `${p.city} → ${D0}`, product: p.product, t: p.t, km: k, pay, bon, total: pay + bon, perKm: (pay + bon) / k, from: p.city, p };
      })
      .sort((a, b) => b.total - a.total);
  }, [pubs]);

  const sel = loads.find((r) => r.id === selId) ?? loads[0];

  function ropts(a: Pub) {
    const kA = km(a.city, D0);
    const ta = Math.min(a.t, CAP);
    const c = pubs
      .filter((p) => p.id !== a.id && p.city !== D0 && p.city !== a.city)
      .map((p) => ({ p, kAB: km(a.city, p.city), kBD: km(p.city, D0) }))
      .map((x) => ({ ...x, det: x.kAB + x.kBD }))
      .sort((x, y) => x.det - y.det)[0];
    if (!c) return [];
    const ta2 = Math.min(a.t, 14), tb = Math.min(c.p.t, 14);
    const ret = 10 * kA * RATE * RETF;
    const pay1 = ta * kA * RATE;
    const pay2 = ta2 * kA * RATE + tb * c.kBD * RATE;
    const dr2 = c.det + kA;
    const mk = (id: number, name: string, pay: number, driven: number, empty: number, t: number, stops: number, path: [string, string, number][]) => ({ id, name, pay, driven, empty, t, stops, path, via: c.p.city, perKm: pay / driven, hours: driven / 55 + stops * 0.75 });
    return [
      mk(0, "Ruta simple", pay1, 2 * kA, kA, ta, 1, [[a.city, D0, 1], [D0, a.city, 0]]),
      mk(1, "Ida y vuelta", pay1 + ret, 2 * kA, 0, ta, 1, [[a.city, D0, 1], [D0, a.city, 2]]),
      mk(2, "2 paradas", pay2, dr2, kA, ta2 + tb, 2, [[a.city, c.p.city, 1], [c.p.city, D0, 1], [D0, a.city, 0]]),
      mk(3, "2 paradas + vuelta", pay2 + ret, dr2, 0, ta2 + tb, 2, [[a.city, c.p.city, 1], [c.p.city, D0, 1], [D0, a.city, 2]]),
    ];
  }

  if (!sel) return <Card><Muted>Sin cargas.</Muted></Card>;
  const opts = ropts(sel.p);
  const simple = opts[0];
  const best = opts.reduce((b, o) => (o.perKm > b.perKm ? o : b), opts[0]);
  const cur = opts.find((o) => o.id === (rtype ?? best.id)) ?? best;

  const bg = loads.filter((r) => r.id !== sel.id).map((r) => {
    const A = proj(CITIES[r.from as keyof typeof CITIES].lat, CITIES[r.from as keyof typeof CITIES].lon);
    const B = proj(CITIES[D0 as keyof typeof CITIES].lat, CITIES[D0 as keyof typeof CITIES].lon);
    return <line key={r.id} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="6 4" style={{ cursor: "pointer" }} onClick={() => { setSelId(r.id); setRtype(null); }} />;
  });

  const legs = cur.path.map(([f, t, k], i) => {
    const A = proj(CITIES[f as keyof typeof CITIES].lat, CITIES[f as keyof typeof CITIES].lon);
    const B = proj(CITIES[t as keyof typeof CITIES].lat, CITIES[t as keyof typeof CITIES].lon);
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
    const o = k === 1 ? 0 : 7, ox = (-dy / L) * o, oy = (dx / L) * o;
    return <line key={i} x1={A[0] + ox} y1={A[1] + oy} x2={B[0] + ox} y2={B[1] + oy} stroke={k === 1 ? "#228b22" : k === 2 ? "#8b4513" : "#94a3b8"} strokeWidth={k === 0 ? 3 : 5} strokeDasharray={k === 0 ? "7 5" : ""} />;
  });

  const seq = [...new Set(cur.path.filter((l) => l[2] === 1).flatMap((l) => [l[0], l[1]]))];
  const dots = Object.entries(CITIES).map(([n, c]) => {
    const [x, y] = proj(c.lat, c.lon);
    const idx = seq.indexOf(n);
    const pk = pubs.some((p) => p.city === n);
    if (idx >= 0) return <g key={n}><circle cx={x} cy={y} r={11} fill="#1b4332" /><text x={x} y={y + 4} style={{ fill: "#fff", fontWeight: 700, textAnchor: "middle" }}>{n === D0 ? "D" : idx + 1}</text><text x={x + 14} y={y + 4}>{n}</text></g>;
    return <g key={n}><circle cx={x} cy={y} r={pk ? 7 : 4} fill={pk ? "#f59e0b" : "#cbd5e1"} /><text x={x + 10} y={y + 4}>{n}</text></g>;
  });

  const kT = km("Corrientes", D0);
  const tr = 30 * kT * RATE * 1.1;

  function armar() {
    let b: { p: Pub; perKm: number } | null = null;
    pubs.filter((p) => p.city !== D0).forEach((p) => {
      const o = ropts(p)[3];
      if (o && (!b || o.perKm > b.perKm)) b = { p, perKm: o.perKm };
    });
    if (b) { setSelId((b as { p: Pub }).p.id); setRtype(3); }
  }

  return (
    <>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1.2fr 1fr" }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Mapa de cargas (NEA)</h3>
          <svg viewBox="0 0 760 540" width="100%" style={{ background: "#eef6f0", borderRadius: 10 }}>{bg}{legs}{dots}</svg>
          <p><Muted>Verde: cargado · Azul: vuelta cargada · Gris: vacío · 1,2,D: paradas</Muted></p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>Ranking de cargas por pago</h3>
          <table style={{ width: "100%", fontSize: 14 }}><thead><tr><th>Ruta</th><th>Km</th><th>Total</th><th>US$/km</th></tr></thead><tbody>
            {loads.map((r, i) => <tr key={r.id} style={{ cursor: "pointer", background: r.id === sel.id ? "#f0fdf4" : "transparent" }} onClick={() => { setSelId(r.id); setRtype(null); }}><td>{i === 0 && <><span style={{ background: "#fef9c3", borderRadius: 6, padding: "2px 6px", fontSize: 12, fontWeight: 700 }}>MEJOR $</span><br /></>}<strong>{r.label}</strong><br /><Muted>{r.t} t · {r.product}</Muted></td><td>{r.km}</td><td>{usd(r.total)}</td><td>{r.perKm.toFixed(1)}</td></tr>)}
          </tbody></table>
          <p><Muted>Pago base + 15% bonus de retorno.</Muted></p>
          <Btn onClick={armar}>Armar mi mejor ruta</Btn>
        </Card>
      </div>
      <Card>
        <h3 style={{ marginTop: 0 }}>Comparador de rutas · {sel.label}</h3>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 14 }}><thead><tr><th>Tipo</th><th>Pago</th><th>US$/km</th><th>Km vacíos</th><th>Ocupación</th><th>Tiempo</th><th>vs simple</th></tr></thead><tbody>
          {opts.map((o) => <tr key={o.id} style={{ cursor: "pointer", background: o.id === cur.id ? "#f5f5e8" : "transparent" }} onClick={() => setRtype(o.id)}><td>{o.id === best.id && <span style={{ background: "#fef9c3", borderRadius: 6, padding: "2px 6px", fontSize: 12, fontWeight: 700 }}>MEJOR </span>}<strong>{o.name}</strong>{o.stops > 1 && <><br /><Muted>vía {o.via}</Muted></>}</td><td>{usd(o.pay)}</td><td>{o.perKm.toFixed(2)}</td><td>{o.empty} km</td><td>{o.t}/{CAP} t</td><td>{o.hours.toFixed(1)} h</td><td style={{ color: "#15803d", fontWeight: 700 }}>{o.id ? "+" + Math.round((o.pay / simple.pay - 1) * 100) + "%" : "base"}</td></tr>)}
        </tbody></table>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Btn onClick={() => alert(`Ruta tomada: ${cur.name} · ${usd(cur.pay)}`)}>Tomar ruta</Btn>
          <Btn kind="sec" onClick={() => setRtype(2)}>Consolidar con otra carga</Btn>
        </div>
      </Card>
      <Card style={{ background: "#faf5ff", borderColor: "#c4b5fd" }}>
        <span style={{ background: "#7c3aed", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>TRUEQUE</span> <strong>Ruta de trueque premium: Corrientes ⇄ {D0}</strong>
        <p><Muted>20 t cascarilla ida + 10 t aserrín vuelta. 0 km vacíos, +10% premium.</Muted></p>
        <div style={{ fontSize: 24, fontWeight: 800 }}>{usd(tr)}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn onClick={() => alert(`Ruta de trueque tomada: ${usd(tr)}`)}>Tomar ruta de trueque</Btn>
          <Btn kind="sec" onClick={() => { const f = loads.find((l) => l.from === "Corrientes"); if (f) { setSelId(f.id); setRtype(1); } }}>Ver en el mapa</Btn>
        </div>
      </Card>
    </>
  );
}
