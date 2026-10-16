"use client";
import { useState } from "react";
import { usd } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Btn, Card, Muted } from "./ui";
import Trueque from "./Trueque";

export default function Publicaciones() {
  const { pubs, user, addOrders } = useStore();
  const [trkOpen, setTrkOpen] = useState(false);
  const [negOpen, setNegOpen] = useState(false);
  const [offer, setOffer] = useState<number | null>(null);
  const [countered, setCountered] = useState(false);

  if (!user) return null;
  const mine = pubs.filter((p) => p.seller === user.company);
  const list = mine.length ? mine : pubs.slice(0, 3);
  const focus = pubs.find((p) => p.seller === user.company) ?? pubs[0];

  return (
    <>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Mis publicaciones</h3>
          <table style={{ width: "100%", fontSize: 14 }}><thead><tr><th>Subproducto</th><th>Disponible</th><th>Precio</th><th>Ubicación</th></tr></thead><tbody>
            {list.map((p) => <tr key={p.id}><td>{p.product}</td><td>{p.t} t/mes</td><td>US$ {p.price}/t</td><td>{p.city}</td></tr>)}
          </tbody></table>
        </Card>
        <div>
          <Card>
            <h3 style={{ marginTop: 0 }}>Chat y negociación</h3>
            <p><Muted>Cementos del Litoral SA hizo una oferta por tu subproducto.</Muted></p>
            <Btn onClick={() => { setOffer(focus.price - 3); setCountered(false); setNegOpen(true); }}>Abrir negociación</Btn>
          </Card>
          <Card>
            <h3 style={{ marginTop: 0 }}>Propuestas de trueque</h3>
            <p><span style={{ background: "#7c3aed", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>TRUEQUE POSIBLE</span></p>
            <p><Muted>Arrocera El Sauce ofrece 20 t de cascarilla y necesita tus 10 t de aserrín.</Muted></p>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => setTrkOpen(true)}>Ver y aceptar</Btn>
              <Btn kind="sec" onClick={() => alert("Contrapropuesta enviada: flete compartido y +US$ 2/t en tu aserrín.")}>Contraproponer</Btn>
            </div>
          </Card>
        </div>
      </div>

      {negOpen && (
        <div style={{ position: "fixed", inset: 0, background: "#0009", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }} onClick={() => setNegOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 22, maxWidth: 600, width: "100%" }}>
            <h3>Negociación · {focus.product}</h3>
            <div style={{ background: "#f8fbf9", border: "1px solid #dde7e0", borderRadius: 10, padding: 10 }}>
              <div style={{ background: "#fff", border: "1px solid #dde7e0", borderRadius: 10, padding: 8, marginBottom: 6 }}><strong>Cementos del Litoral SA:</strong> Nos interesan {focus.t} t/mes a US$ {offer}/t.</div>
              {countered && <><div style={{ background: "#dcfce7", borderRadius: 10, padding: 8, marginBottom: 6 }}><strong>{user.company}:</strong> Podemos cerrar en US$ {focus.price}/t.</div><div style={{ background: "#fff", border: "1px solid #dde7e0", borderRadius: 10, padding: 8 }}><strong>Cementos del Litoral SA:</strong> Cerramos en US$ {focus.price - 1}/t.</div></>}
            </div>
            <p><Muted>Valor mensual: {usd(focus.t * (offer ?? focus.price))}</Muted></p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Btn kind="sec" onClick={() => setNegOpen(false)}>Cerrar</Btn>
              {!countered && <Btn kind="warn" onClick={() => { setCountered(true); setOffer(focus.price - 1); }}>Contraofertar</Btn>}
              <Btn onClick={() => { addOrders([{ id: "OV-" + (2100 + Math.floor(Math.random() * 800)), kind: "venta", product: focus.product, t: focus.t, from: focus.city, to: "Corrientes", buyer: "Cementos del Litoral SA", seller: user.company, carrier: "Transporte Ávila SRL", st: 0, eta: "7 días", value: focus.t * (offer ?? focus.price) }]); setNegOpen(false); }}>Aceptar US$ {offer}/t</Btn>
            </div>
          </div>
        </div>
      )}
      {trkOpen && <Trueque pubId={1} onClose={() => setTrkOpen(false)} />}
    </>
  );
}

