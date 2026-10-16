"use client";
import { useMemo, useState } from "react";
import { CITIES, PRODUCTS, Pub, canjeFor, computeMatches, usd } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Btn, Card, Muted } from "./ui";
import CircuitoCompra from "./CircuitoCompra";
import Trueque from "./Trueque";

export default function Agente() {
  const { pubs, need, setNeed, user, sort, setSort, setFilterCity } = useStore();
  const [msgs, setMsgs] = useState<{ who: "u" | "b"; txt: string }[]>([
    { who: "b", txt: 'Hola, soy el agente de BioNexo. Probá: "Necesito 20 t de cascarilla de arroz, lo más barato" o "quiero hacer un trueque".' },
  ]);
  const [input, setInput] = useState("");
  const [buyId, setBuyId] = useState<number | null>(null);
  const [trkId, setTrkId] = useState<number | null>(null);

  const matches = useMemo(() => {
    if (!user) return [];
    return computeMatches(pubs, need, user.company, "", sort).slice(0, 5);
  }, [pubs, need, user, sort]);

  const myPubs = useMemo(() => pubs.filter((p) => user && p.seller === user.company), [pubs, user]);

  function enviar() {
    const txt = input.trim();
    if (!txt || !user) return;
    const low = txt.toLowerCase();
    const next = [...msgs, { who: "u" as const, txt }];
    const prod = PRODUCTS.find((p) => low.includes(p.split(" ")[0].toLowerCase().slice(0, 6)));
    const tm = low.match(/(\d+)\s*(t|ton)/);
    const city = Object.keys(CITIES).find((c) => low.includes(c.toLowerCase()));
    const r: string[] = [];
    if (/trueque|canje|permuta/.test(low) && !prod) {
      setNeed({ ...need, product: "Cascarilla de arroz", t: 20 });
      r.push("Busco ofertas con doble coincidencia (trueque) para tu aserrín.");
    }
    if (prod) { setNeed({ ...need, product: prod }); r.push(`Producto: <strong>${prod}</strong>.`); }
    if (tm) { setNeed({ ...need, t: +tm[1] }); r.push(`Cantidad: ${tm[1]} t/mes.`); }
    if (city) { setFilterCity(city); r.push(`Ciudad: <strong>${city}</strong>.`); }
    else if (/cerca|cercan/.test(low)) { setSort("dist"); r.push("Ordeno por cercanía."); }
    if (/barat|precio|menor costo/.test(low)) { setSort("price"); r.push("Ordeno por precio."); }
    if (!r.length) r.push("No identifiqué producto ni cantidad.");
    else r.push("Opciones ↓");
    setMsgs([...next, { who: "b", txt: r.join(" ") }]);
    setInput("");
  }

  return (
    <>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Agente BioNexo</h3>
          <div style={{ height: 300, overflow: "auto", background: "#f8fbf9", border: "1px solid #dde7e0", borderRadius: 10, padding: 10 }}>
            {msgs.map((m, i) => <div key={i} style={{ margin: "6px 0", padding: "8px 10px", borderRadius: 10, background: m.who === "u" ? "#dcfce7" : "#fff" }} dangerouslySetInnerHTML={{ __html: m.txt }} />)}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviar()} placeholder="Escribí tu necesidad..." style={{ flex: 1, padding: 9, borderRadius: 8, border: "1px solid var(--color-border)" }} />
            <Btn onClick={enviar}>Enviar</Btn>
          </div>
          <p><Muted>Demo por reglas.</Muted></p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>Resultados filtrados</h3>
          <p><Muted>{need.product} · {need.t} t/mes · {need.city}</Muted></p>
          {matches.map((p: Pub) => (
            <Card key={p.id}>
              <strong>{p.seller}</strong> <Muted>{p.city} · {p.t} t · US$ {p.price}/t · {p.km} km</Muted>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <span style={{ fontWeight: 800, color: "#15803d" }}>{p.score}</span>
                <span style={{ display: "flex", gap: 6 }}>
                  <Btn onClick={() => setBuyId(p.id)}>Comprar</Btn>
                  {user && canjeFor(p, myPubs) && <Btn kind="warn" onClick={() => setTrkId(p.id)}>Trueque</Btn>}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7f72" }}>{usd(p.total ?? 0)} total</div>
            </Card>
          ))}
          {matches.length === 0 && <p><Muted>Sin resultados.</Muted></p>}
        </Card>
      </div>
      {buyId !== null && <CircuitoCompra pubId={buyId} onClose={() => setBuyId(null)} />}
      {trkId !== null && <Trueque pubId={trkId} onClose={() => setTrkId(null)} />}
    </>
  );
}

