"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CITIES, PRODUCTS, Pub, computeMatches, usd } from "@/lib/data";
import { useStore } from "@/lib/store";
import { abrirConversacion } from "@/lib/chat";
import { Btn, Card, Muted } from "./ui";

export default function Dashboard() {
  const { need, setNeed, sort, setSort, pubs, user } = useStore();
  const router = useRouter();
  const [draft, setDraft] = useState(need);
  const [applied, setApplied] = useState(true);
  const [chatAbriendo, setChatAbriendo] = useState<number | null>(null);

  async function abrirChat(p: Pub) {
    if (!user) return;
    setChatAbriendo(p.id);
    const id = await abrirConversacion(
      { id: p.id, ownerId: p.ownerId ?? null, sellerName: p.seller, product: p.product, city: p.city },
      user.id,
    );
    setChatAbriendo(null);
    if (id) router.push(`/mensajes/${id}`);
  }

  const matches: Pub[] = useMemo(() => {
    if (!user) return [];
    return computeMatches(pubs.filter((p) => p.ownerId && !p.simulated), need, user.company, "", sort);
  }, [pubs, need, user, sort]);

  if (!user) return null;

  return (
    <>
      <Card>
        <h2 style={{ marginTop: 0 }}>Cargá tu requerimiento</h2>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Producto que necesitás</label>
            <select value={draft.product} onChange={(e) => { setDraft({ ...draft, product: e.target.value }); setApplied(false); }} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--color-border)" }}>
              {PRODUCTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Cantidad mensual (t)</label>
            <input type="number" value={draft.t} onChange={(e) => { setDraft({ ...draft, t: +e.target.value || 1 }); setApplied(false); }} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--color-border)" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Ubicación de entrega</label>
            <select value={draft.city} onChange={(e) => { setDraft({ ...draft, city: e.target.value }); setApplied(false); }} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--color-border)" }}>
              {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Necesito desde</label>
            <input type="date" value={draft.requiredFrom ?? ""} onChange={(e) => { setDraft({ ...draft, requiredFrom: e.target.value }); setApplied(false); }} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--color-border)" }} />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <Btn onClick={() => { setNeed(draft); setApplied(true); }}>Buscar coincidencias</Btn>{" "}
          <Muted>El sistema compara ofertas reales y cotiza sólo la cantidad solicitada o disponible, la menor de ambas.</Muted>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ margin: 0 }}>Dashboard de coincidencias</h3>
            <Muted>{need.product} · {need.t} t/mes · entrega en {need.city}</Muted>
          </div>
          <div>
            <label>Ordenar por </label>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="score">Prioridad (score)</option>
              <option value="price">Precio</option>
              <option value="dist">Distancia</option>
            </select>
          </div>
        </div>
        <p style={{ color: "#6b7f72", fontSize: 13 }}>Score = 35% distancia · 30% precio · 20% disponibilidad · 15% calidad (simulado).</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr><th>Proveedor</th><th>Disponible</th><th>Distancia</th><th>Precio</th><th>Calidad</th><th>Score</th><th></th></tr></thead>
            <tbody>
              {matches.length === 0 && <tr><td colSpan={7}><Muted>Sin coincidencias. {applied ? "" : "Pulsá Buscar."}</Muted></td></tr>}
              {matches.map((p, i) => {
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td style={{ padding: 8 }}>
                      {i === 0 && <><span style={{ background: "#fef9c3", borderRadius: 6, padding: "2px 6px", fontWeight: 700, fontSize: 12 }}>PRIORIDAD 1</span><br /></>}
                      <strong>{p.seller}</strong>{" "}
                      {p.offerType === "futuro" && (
                        <span style={{ background: "#ede9fe", color: "#6d28d9", borderRadius: 6, padding: "2px 6px", fontWeight: 700, fontSize: 12 }}>
                          FUTURO {p.availableFrom ? `desde ${p.availableFrom}` : ""}
                        </span>
                     )}<br /><Muted>{p.city}</Muted>
                    </td>
                    <td style={{ padding: 8 }}>{p.t} t/mes</td>
                    <td style={{ padding: 8 }}>{p.km} km</td>
                    <td style={{ padding: 8 }}>US$ {p.price}/t<br /><Muted>total {usd(p.total ?? 0)}</Muted></td>
                    <td style={{ padding: 8 }}>{p.q}/10</td>
                    <td style={{ padding: 8 }}><span style={{ fontSize: 22, fontWeight: 800, color: "#15803d" }}>{p.score}</span><Muted>/100</Muted></td>
                    <td style={{ padding: 8 }}>
                      <Btn onClick={() => void abrirChat(p)} disabled={chatAbriendo === p.id}>
                        {chatAbriendo === p.id ? "Abriendo…" : "Negociar compra"}
                      </Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <strong>Estimación previa a la negociación</strong>
        <div style={{ color: "#6b7f72", fontSize: 13 }}>
          Mejor match: flete {matches[0] ? usd(matches[0].flete ?? 0) : "—"}/mes · emisiones de transporte {matches[0] ? (matches[0].co2 ?? 0).toFixed(2) + " tCO2e/mes" : "—"}.
        </div>
      </Card>

    </>
  );
}

