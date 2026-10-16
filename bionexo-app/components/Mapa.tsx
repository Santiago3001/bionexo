"use client";
import { useEffect, useMemo, useState } from "react";
import { CITIES, Pub, km, proj, usd, RATE } from "@/lib/data";
import { cargarRutas, tomarRuta, type RutaTransporte } from "@/lib/routes";
import { useStore } from "@/lib/store";
import { Btn, Card, Muted } from "./ui";

const D0 = "Resistencia";
const CAP = 28;
const RETF = 0.7;

export default function Mapa() {
  const { pubs, user, role } = useStore();
  const [selId, setSelId] = useState<number | null>(null);
  const [rtype, setRtype] = useState<number | null>(null);
  const [rutas, setRutas] = useState<RutaTransporte[]>([]);
  const [rutasCargadas, setRutasCargadas] = useState(false);
  const [simuladas, setSimuladas] = useState(false);
  const [rutaSelId, setRutaSelId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<{ texto: string; ok: boolean } | null>(null);
  const [tomandoId, setTomandoId] = useState<number | null>(null);

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

  useEffect(() => {
    let active = true;
    void cargarRutas().then((lista) => {
      if (!active) return;
      setRutas(lista);
      setSimuladas(lista.length === 0);
      setRutasCargadas(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Sin rutas en la base: usamos las cargas locales como ruta simulada.
  useEffect(() => {
    if (!simuladas || rutas.length > 0 || loads.length === 0) return;
    setRutas(loads.map((l, i): RutaTransporte => ({
      id: i + 1,
      vehicleType: l.t > 20 ? "Semirremolque" : l.t > 10 ? "Camión 20 t" : "Camión 10 t",
      capacityTons: l.t > 20 ? 28 : l.t > 10 ? 20 : 12,
      originCity: l.from,
      destinationCity: D0,
      availableDate: new Date().toISOString().slice(0, 10),
      routeType: l.from === "Corrientes" ? "retorno" : "planificada",
      pricePerKm: Math.round(l.perKm * 100) / 100,
      status: "available",
      takenBy: null,
      takenAt: null,
    })));
  }, [simuladas, rutas, loads]);

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

  const esTransportista = role === "transportista" || user?.role === "transportista";
  // Ruta de la base asociada a la carga seleccionada (o la elegida a mano en el listado).
  const rutaSel =
    rutas.find((r) => r.id === rutaSelId) ??
    rutas.find((r) => r.originCity === sel.from) ??
    rutas.find((r) => r.status === "available") ??
    rutas[0] ??
    null;
  const rutaTrueque = rutas.find((r) => r.originCity === "Corrientes") ?? rutaSel;

  function badgeEstado(ruta: RutaTransporte) {
    if (ruta.status === "reserved") return <span className="bn-badge" style={{ background: "#fef3c7", color: "#92400e" }}>RESERVADA</span>;
    if (ruta.status === "available") return <span className="bn-badge" style={{ background: "#dcfce7", color: "#166534" }}>DISPONIBLE</span>;
    if (ruta.status === "completed") return <span className="bn-badge">COMPLETADA</span>;
    return <span className="bn-badge" style={{ background: "#fee2e2", color: "#991b1b" }}>CANCELADA</span>;
  }

  async function tomar(ruta: RutaTransporte | null, detalle: string) {
    if (!ruta) {
      setMensaje({ texto: "No hay ninguna ruta publicada para esa opción.", ok: false });
      return;
    }
    if (!user || !esTransportista) {
      setMensaje({ texto: "Ingresá como transportista para tomar rutas.", ok: false });
      return;
    }
    if (ruta.status === "reserved") {
      setMensaje({
        texto: ruta.takenBy === user.id ? "Esta ruta ya la tomaste vos." : "Ruta tomada por otro transportista.",
        ok: false,
      });
      return;
    }
    setMensaje(null);
    setTomandoId(ruta.id);
    const res = await tomarRuta(ruta.id, user.id);
    setTomandoId(null);
    if (res.ok) {
      setRutas((prev) => prev.map((r) => (r.id === ruta.id
        ? { ...r, status: "reserved" as const, takenBy: user.id, takenAt: new Date().toISOString() }
        : r)));
      setMensaje({ texto: `Ruta tomada y guardada: ${ruta.originCity} → ${ruta.destinationCity} · ${detalle}.`, ok: true });
    } else {
      setMensaje({ texto: simuladas ? `DATO SIMULADO · ${res.message}` : res.message, ok: false });
    }
  }

  function btnTomar(ruta: RutaTransporte | null, detalle: string, etiqueta = "Tomar ruta") {
    if (ruta && ruta.status === "reserved") {
      return (
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <Btn disabled>Ruta tomada</Btn>
          {user && ruta.takenBy === user.id && (
            <span className="bn-badge" style={{ background: "#dcfce7", color: "#166534" }}>Tomada por vos</span>
          )}
        </span>
      );
    }
    const cargando = ruta !== null && tomandoId === ruta.id;
    return (
      <Btn disabled={cargando || tomandoId !== null} onClick={() => void tomar(ruta, detalle)}>
        {cargando ? "Tomando…" : etiqueta}
      </Btn>
    );
  }

  const bg = loads.filter((r) => r.id !== sel.id).map((r) => {
    const A = proj(CITIES[r.from as keyof typeof CITIES].lat, CITIES[r.from as keyof typeof CITIES].lon);
    const B = proj(CITIES[D0 as keyof typeof CITIES].lat, CITIES[D0 as keyof typeof CITIES].lon);
    return <line key={r.id} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="6 4" style={{ cursor: "pointer" }} onClick={() => { setSelId(r.id); setRtype(null); }} />;
  });

  // Rutas de la base (Supabase) dibujadas sobre el mapa.
  const lineasRutas = rutas.map((r) => {
    const A = CITIES[r.originCity as keyof typeof CITIES];
    const B = CITIES[r.destinationCity as keyof typeof CITIES];
    if (!A || !B) return null;
    const [x1, y1] = proj(A.lat, A.lon);
    const [x2, y2] = proj(B.lat, B.lon);
    return <line key={`ruta-${r.id}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={r.status === "reserved" ? "#7c3aed" : "#2563eb"} strokeWidth={2} strokeDasharray="3 6" opacity={0.95} />;
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
      {mensaje && (
        <div role="status" style={{ marginBottom: 14, padding: "10px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: mensaje.ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${mensaje.ok ? "#bbf7d0" : "#fecaca"}`, color: mensaje.ok ? "#166534" : "#991b1b" }}>
          {mensaje.texto}
        </div>
      )}
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1.2fr 1fr" }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Mapa de cargas (NEA)</h3>
          <svg viewBox="0 0 760 540" width="100%" style={{ background: "#eef6f0", borderRadius: 10 }}>{lineasRutas}{bg}{legs}{dots}</svg>
          <p><Muted>Verde: cargado · Azul: vuelta cargada · Gris: vacío · 1,2,D: paradas · Azul/violeta punteado: rutas de la base</Muted></p>
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
        <h3 style={{ marginTop: 0 }}>
          Rutas de transporte{" "}
          {simuladas && <span className="bn-badge" style={{ background: "#fef9c3", color: "#854d0e" }}>DATO SIMULADO</span>}
        </h3>
        {simuladas && <p><Muted>No hay rutas en la base: se muestran las cargas locales como rutas simuladas.</Muted></p>}
        {!rutasCargadas ? (
          <Muted>Cargando rutas…</Muted>
        ) : rutas.length === 0 ? (
          <Muted>Sin rutas publicadas.</Muted>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 14 }}>
              <thead>
                <tr><th>Ruta</th><th>Vehículo</th><th>Capacidad</th><th>Fecha</th><th>Tipo</th><th>US$/km</th><th>Estado</th><th>Acción</th></tr>
              </thead>
              <tbody>
                {rutas.map((r) => (
                  <tr key={r.id} onClick={() => setRutaSelId(r.id)} style={{ cursor: "pointer", background: r.id === rutaSel?.id ? "#f0fdf4" : "transparent" }}>
                    <td><strong>{r.originCity} → {r.destinationCity}</strong></td>
                    <td>{r.vehicleType}</td>
                    <td>{r.capacityTons} t</td>
                    <td>{r.availableDate}</td>
                    <td>{r.routeType}</td>
                    <td>{r.pricePerKm === null ? "—" : r.pricePerKm.toFixed(2)}</td>
                    <td>{badgeEstado(r)}</td>
                    <td onClick={(e) => e.stopPropagation()}>{btnTomar(r, `${r.originCity} → ${r.destinationCity}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Card>
        <h3 style={{ marginTop: 0 }}>Comparador de rutas · {sel.label}</h3>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 14 }}><thead><tr><th>Tipo</th><th>Pago</th><th>US$/km</th><th>Km vacíos</th><th>Ocupación</th><th>Tiempo</th><th>vs simple</th></tr></thead><tbody>
          {opts.map((o) => <tr key={o.id} style={{ cursor: "pointer", background: o.id === cur.id ? "#f5f5e8" : "transparent" }} onClick={() => setRtype(o.id)}><td>{o.id === best.id && <span style={{ background: "#fef9c3", borderRadius: 6, padding: "2px 6px", fontSize: 12, fontWeight: 700 }}>MEJOR </span>}<strong>{o.name}</strong>{o.stops > 1 && <><br /><Muted>vía {o.via}</Muted></>}</td><td>{usd(o.pay)}</td><td>{o.perKm.toFixed(2)}</td><td>{o.empty} km</td><td>{o.t}/{CAP} t</td><td>{o.hours.toFixed(1)} h</td><td style={{ color: "#15803d", fontWeight: 700 }}>{o.id ? "+" + Math.round((o.pay / simple.pay - 1) * 100) + "%" : "base"}</td></tr>)}
        </tbody></table>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
          {rutaSel && rutaSel.status === "reserved" ? (
            <Btn disabled>Ruta tomada</Btn>
          ) : (
            <Btn disabled={tomandoId !== null} onClick={() => void tomar(rutaSel, `${cur.name} · ${usd(cur.pay)}`)}>Tomar ruta</Btn>
          )}
          {rutaSel && (
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              {badgeEstado(rutaSel)}
              {user && rutaSel.takenBy === user.id && <span className="bn-badge" style={{ background: "#dcfce7", color: "#166534" }}>Tomada por vos</span>}
            </span>
          )}
          <Btn kind="sec" onClick={() => setRtype(2)}>Consolidar con otra carga</Btn>
        </div>
        {rutaSel ? (
          <p><Muted>Ruta asociada: {rutaSel.originCity} → {rutaSel.destinationCity} · {rutaSel.vehicleType} · {rutaSel.capacityTons} t · {rutaSel.availableDate}{rutaSel.routeType === "retorno" ? " · retorno" : ""}</Muted></p>
        ) : (
          <p><Muted>Sin ruta publicada en la base para esta carga.</Muted></p>
        )}
      </Card>
      <Card style={{ background: "#faf5ff", borderColor: "#c4b5fd" }}>
        <span style={{ background: "#7c3aed", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>TRUEQUE</span> <strong>Ruta de trueque premium: Corrientes ⇄ {D0}</strong>
        <p><Muted>20 t cascarilla ida + 10 t aserrín vuelta. 0 km vacíos, +10% premium.</Muted></p>
        <div style={{ fontSize: 24, fontWeight: 800 }}>{usd(tr)}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
          {rutaTrueque && rutaTrueque.status === "reserved" ? (
            <Btn disabled>Ruta tomada</Btn>
          ) : (
            <Btn disabled={tomandoId !== null} onClick={() => void tomar(rutaTrueque, `Ruta de trueque · ${usd(tr)}`)}>Tomar ruta de trueque</Btn>
          )}
          {rutaTrueque && (
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              {badgeEstado(rutaTrueque)}
              {user && rutaTrueque.takenBy === user.id && <span className="bn-badge" style={{ background: "#dcfce7", color: "#166534" }}>Tomada por vos</span>}
            </span>
          )}
          <Btn kind="sec" onClick={() => { const f = loads.find((l) => l.from === "Corrientes"); if (f) { setSelId(f.id); setRtype(1); } }}>Ver en el mapa</Btn>
        </div>
      </Card>
    </>
  );
}

