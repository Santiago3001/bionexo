"use client";
import { useMemo, useState } from "react";
import { CITIES, PRODUCTS, Pub, RATE, canjeFor, computeMatches, km, usd } from "@/lib/data";
import { useStore } from "@/lib/store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Btn, Card, Muted } from "./ui";
import CircuitoCompra from "./CircuitoCompra";
import Trueque from "./Trueque";

interface IAMatch {
  offer_id: number;
  reason: string;
}

interface IARespuesta {
  reply: string;
  interpreted: { product: string; tons: number; city: string; frequency: string };
  matches: IAMatch[];
  model?: string;
}

interface Msg {
  who: "u" | "b";
  txt: string;
  /** true => texto plano del modelo (no pasar por dangerouslySetInnerHTML) */
  raw?: boolean;
  /** etiqueta de origen, ej. "Respuesta de IA real (gpt-4.1-mini)" */
  tag?: string;
}

interface CoincidenciaIA {
  pub: Pub;
  reason: string;
}

function enriquecer(p: Pub, desdeCiudad: string): Pub {
  const pkm = km(desdeCiudad, p.city);
  const cost = p.t * p.price;
  const flete = p.t * pkm * RATE;
  return { ...p, km: pkm, cost, flete, total: cost + flete };
}

export default function Agente() {
  const { pubs, need, setNeed, user, sort, setSort, setFilterCity } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([
    { who: "b", txt: 'Hola, soy el agente de BioNexo. Probá: "Necesito 20 t de cascarilla de arroz, lo más barato" o "quiero hacer un trueque".' },
  ]);
  const [input, setInput] = useState("");
  const [buyId, setBuyId] = useState<number | null>(null);
  const [trkId, setTrkId] = useState<number | null>(null);
  const [useIA, setUseIA] = useState(true);
  const [origen, setOrigen] = useState<"ia" | "reglas" | "error">("reglas");
  const [pensando, setPensando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [coincidenciasIA, setCoincidenciasIA] = useState<CoincidenciaIA[]>([]);

  const matches = useMemo(() => {
    if (!user) return [];
    return computeMatches(pubs, need, user.company, "", sort).slice(0, 5);
  }, [pubs, need, user, sort]);

  const myPubs = useMemo(() => pubs.filter((p) => user && p.seller === user.company), [pubs, user]);

  /** Fallback original: parser por regex (sin red). Devuelve la respuesta para el chat. */
  function resolverConReglas(txt: string): string {
    const low = txt.toLowerCase();
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
    return r.join(" ");
  }

  function caerARelas(prev: Msg[], txt: string, motivoAviso: string | null) {
    const reply = resolverConReglas(txt);
    setMsgs([...prev, { who: "b", txt: reply }]);
    setOrigen("error");
    setCoincidenciasIA([]);
    setAviso(motivoAviso);
  }

  async function enviar() {
    const txt = input.trim();
    if (!txt || !user || pensando) return;
    const next: Msg[] = [...msgs, { who: "u", txt }];
    setInput("");
    setAviso(null);

    if (!useIA) {
      setMsgs([...next, { who: "b", txt: resolverConReglas(txt) }]);
      setOrigen("reglas");
      setCoincidenciasIA([]);
      return;
    }

    setPensando(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      const token = session?.access_token;
      if (!supabase || !token) {
        caerARelas(next, txt, "Sin sesión de Supabase — mostrando respuesta por reglas.");
        return;
      }

      const res = await fetch("/api/agente", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ message: txt, need }),
      });

      if (res.status === 503) {
        caerARelas(next, txt, "IA no configurada — mostrando respuesta por reglas. Configurá OPENAI_API_KEY en .env.local");
        return;
      }
      if (!res.ok) {
        caerARelas(next, txt, `La IA falló (HTTP ${res.status}) — mostrando respuesta por reglas.`);
        return;
      }

      const data = (await res.json()) as IARespuesta;
      if (!data || typeof data.reply !== "string" || !Array.isArray(data.matches)) {
        caerARelas(next, txt, "La IA devolvió una respuesta inválida — mostrando respuesta por reglas.");
        return;
      }

      const it = data.interpreted;
      if (it && (it.product || it.tons > 0 || it.city)) {
        setNeed({
          product: it.product || need.product,
          t: it.tons > 0 ? it.tons : need.t,
          city: it.city || need.city,
        });
      }

      const ciudadOrigen = (it && it.city) || need.city;
      const coincidencias: CoincidenciaIA[] = [];
      for (const m of data.matches) {
        const pub = pubs.find((p) => p.id === m.offer_id);
        if (pub) coincidencias.push({ pub: enriquecer(pub, ciudadOrigen), reason: m.reason });
      }
      setCoincidenciasIA(coincidencias);
      setOrigen("ia");
      setMsgs([...next, { who: "b", txt: data.reply, raw: true, tag: `Respuesta de IA real (${data.model ?? "gpt-4.1-mini"})` }]);
    } catch {
      caerARelas(next, txt, "No se pudo consultar la IA (error de red) — mostrando respuesta por reglas.");
    } finally {
      setPensando(false);
    }
  }

  return (
    <>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Agente BioNexo</h3>
          <div style={{ height: 300, overflow: "auto", background: "#f8fbf9", border: "1px solid #dde7e0", borderRadius: 10, padding: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ margin: "6px 0", padding: "8px 10px", borderRadius: 10, background: m.who === "u" ? "#dcfce7" : "#fff" }}>
                {m.raw
                  ? <span style={{ whiteSpace: "pre-wrap" }}>{m.txt}</span>
                  : <span dangerouslySetInnerHTML={{ __html: m.txt }} />}
                {m.tag && (
                  <div style={{ marginTop: 6 }}>
                    <span className="bn-badge">{m.tag}</span>
                  </div>
                )}
              </div>
            ))}
            {pensando && (
              <div style={{ margin: "6px 0", padding: "8px 10px", borderRadius: 10, background: "#fff", color: "var(--color-muted-fg)", fontStyle: "italic" }}>
                Pensando…
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
              placeholder={pensando ? "El agente está respondiendo..." : "Escribí tu necesidad..."}
              disabled={pensando}
              style={{ flex: 1, padding: 9, borderRadius: 8, border: "1px solid var(--color-border)" }}
            />
            <Btn onClick={enviar} disabled={pensando}>{pensando ? "Enviando…" : "Enviar"}</Btn>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={useIA} onChange={(e) => setUseIA(e.target.checked)} disabled={pensando} />
              Usar IA real (OpenAI)
            </label>
            <Muted>
              {!useIA
                ? "Modo reglas (sin IA)."
                : origen === "ia"
                  ? "Última respuesta: IA real."
                  : origen === "error"
                    ? "Última respuesta: reglas (IA no disponible)."
                    : "Usando IA real cuando haya consulta."}
            </Muted>
          </div>
          {aviso && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "6px 10px" }}>
              {aviso}
            </p>
          )}
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>Resultados filtrados</h3>
          <p><Muted>{need.product} · {need.t} t/mes · {need.city}</Muted></p>
          {origen === "ia" ? (
            coincidenciasIA.length === 0 ? (
              <p><Muted>La IA no encontró ofertas realmente compatibles con esos datos. Ajustá producto, ciudad o cantidad y volvé a preguntar.</Muted></p>
            ) : (
              coincidenciasIA.map(({ pub: p, reason }) => (
                <Card key={p.id}>
                  <strong>{p.seller}</strong> <Muted>{p.city} · {p.t} t · US$ {p.price}/t · {p.km} km</Muted>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <span style={{ fontWeight: 800, color: "#15803d" }}>{p.score != null ? p.score : `Calidad ${p.q}/10`}</span>
                    <span style={{ display: "flex", gap: 6 }}>
                      <Btn onClick={() => setBuyId(p.id)}>Comprar</Btn>
                      {user && canjeFor(p, myPubs) && <Btn kind="warn" onClick={() => setTrkId(p.id)}>Trueque</Btn>}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7f72" }}>{usd(p.total ?? 0)} total</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#166534", background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: 8, padding: "6px 8px" }}>
                    <strong>Por qué la IA la eligió:</strong> {reason}
                  </div>
                </Card>
              ))
            )
          ) : (
            <>
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
            </>
          )}
        </Card>
      </div>
      {buyId !== null && <CircuitoCompra pubId={buyId} onClose={() => setBuyId(null)} />}
      {trkId !== null && <Trueque pubId={trkId} onClose={() => setTrkId(null)} />}
    </>
  );
}
