"use client";
import { useState } from "react";
import { CITIES, PRODUCTS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Btn, Card, Muted } from "./ui";

export default function SubproductoForm({ vendedor }: { vendedor: boolean }) {
  const { user, addPub } = useStore();
  const [product, setProduct] = useState(PRODUCTS[0]);
  const [t, setT] = useState(15);
  const [price, setPrice] = useState(30);
  const [city, setCity] = useState(user?.city ?? "Resistencia");
  const [msg, setMsg] = useState("");

  function publicar() {
    if (!user) return;
    addPub({ id: Date.now(), seller: user.company, product, city: city as never, t, price, q: 7 });
    setMsg("✔ Publicado. Ya aparece en las coincidencias.");
  }

  return (
    <Card>
      <h2 style={{ marginTop: 0 }}>{vendedor ? "Publicar subproducto" : "Registrar mi subproducto"}</h2>
      <p><Muted>Cargá lo que te sobra o generás. Se cruza con compradores y vendedores.</Muted></p>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <label>Subproducto</label>
          <select value={product} onChange={(e) => setProduct(e.target.value)} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--color-border)" }}>
            {PRODUCTS.map((p) => <option key={p}>{p}</option>)}
          </select>
          <label>Toneladas mensuales</label>
          <input type="number" value={t} onChange={(e) => setT(+e.target.value || 0)} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--color-border)" }} />
        </div>
        <div>
          <label>Precio ref. (US$/t)</label>
          <input type="number" value={price} onChange={(e) => setPrice(+e.target.value || 0)} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--color-border)" }} />
          <label>Ubicación</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--color-border)" }}>
            {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <Btn onClick={publicar}>Publicar</Btn> <span style={{ color: "#6b7f72", fontSize: 13 }}>{msg}</span>
      </div>
    </Card>
  );
}
