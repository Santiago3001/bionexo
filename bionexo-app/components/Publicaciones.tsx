"use client";
import { useRef, useState } from "react";
import { usd } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Btn, Card, Modal, Muted } from "./ui";
import ProductImage from "./ProductImage";

export default function Publicaciones() {
  const { pubs, user, addOrders, setTruequeDone } = useStore();
  const [trkOpen, setTrkOpen] = useState(false);
  const [trkDone, setTrkDone] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterSent, setCounterSent] = useState(false);
  const [ajuste, setAjuste] = useState(2);
  const seq = useRef(0);

  if (!user) return null;
  const mine = pubs.filter((p) => p.seller === user.company);
  const list = mine.length ? mine : pubs.slice(0, 3);

  // Trueque demo: Arrocera El Sauce ofrece cascarilla y necesita el aserrín del vendedor.
  const cascarilla = pubs.find((p) => p.product === "Cascarilla de arroz");
  const aserrin = mine.find((p) => p.product === "Aserrín de pino") ?? pubs.find((p) => p.product === "Aserrín de pino");
  const loteA = { product: "Cascarilla de arroz", t: 20, price: cascarilla?.price ?? 20, city: cascarilla?.city ?? "Corrientes", seller: cascarilla?.seller ?? "Arrocera El Sauce", q: cascarilla?.q ?? 8 };
  const loteB = { product: "Aserrín de pino", t: 10, price: aserrin?.price ?? 21, city: aserrin?.city ?? user.city, seller: user.company, q: aserrin?.q ?? 7 };
  const vA = loteA.t * loteA.price;
  const vB = loteB.t * loteB.price;
  const diff = vA - vB;
  const diffAbs = Math.abs(diff);
  const compensa = diff >= 0 ? user.company : loteA.seller;
  const diffContra = vA - loteB.t * (loteB.price + ajuste);
  const diffContraAbs = Math.abs(diffContra);
  const compensaContra = diffContra >= 0 ? user.company : loteA.seller;

  function aceptarTrueque() {
    seq.current += 1;
    const n = seq.current;
    addOrders([
      { id: "OC-" + (1200 + n), kind: "trueque", product: loteA.product, t: loteA.t, from: loteA.city, to: loteB.city, buyer: user!.company, seller: loteA.seller, carrier: "Transporte Ávila SRL", st: 0, eta: "7 días", value: vA },
      { id: "OV-" + (2200 + n), kind: "trueque", product: loteB.product, t: loteB.t, from: loteB.city, to: loteA.city, buyer: loteA.seller, seller: user!.company, carrier: "Transporte Ávila SRL", st: 0, eta: "7 días", value: vB },
    ]);
    setTruequeDone();
    setTrkDone(true);
  }

  return (
    <>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Mis publicaciones</h3>
          <Muted>{list.length} {list.length === 1 ? "publicación" : "publicaciones"} · foto ilustrativa por tipo de producto</Muted>
        </div>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", marginTop: 16 }}>
          {list.map((p) => (
            <article key={p.id} className="bn-card" style={{ overflow: "hidden", marginBottom: 0, display: "flex", flexDirection: "column" }}>
              <ProductImage product={p.product} height={120} />
              <div style={{ padding: 14, display: "grid", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 15, lineHeight: 1.25 }}>{p.product}</strong>
                  <span
                    style={{
                      background: p.offerType === "futuro" ? "#ede9fe" : "#dcfce7",
                      color: p.offerType === "futuro" ? "#6d28d9" : "#166534",
                      borderRadius: 50,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.offerType === "futuro" ? `Futuro ${p.availableFrom ?? ""}` : "Spot"}
                  </span>
                </div>
                <Muted>{p.city} · Calidad {p.q}/10</Muted>
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  US$ {p.price}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-muted-fg)" }}>/t</span>
                </div>
                <Muted>{p.t} t/mes · valor {usd(p.t * p.price)}/mes</Muted>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Propuestas de trueque</h3>
          <span style={{ background: "#7c3aed", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>TRUEQUE POSIBLE</span>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr auto 1fr", alignItems: "center", margin: "16px 0 8px" }}>
          <div style={{ display: "grid", gap: 6, justifyItems: "center", textAlign: "center" }}>
            <div style={{ width: "100%", overflow: "hidden", borderRadius: 12 }}><ProductImage product={loteA.product} height={90} /></div>
            <strong style={{ fontSize: 13 }}>{loteA.t} t · {loteA.product}</strong>
            <Muted>Te ofrece {loteA.seller}</Muted>
          </div>
          <span style={{ fontSize: 24 }}>⇄</span>
          <div style={{ display: "grid", gap: 6, justifyItems: "center", textAlign: "center" }}>
            <div style={{ width: "100%", overflow: "hidden", borderRadius: 12 }}><ProductImage product={loteB.product} height={90} /></div>
            <strong style={{ fontSize: 13 }}>{loteB.t} t · {loteB.product}</strong>
            <Muted>Lo generás vos</Muted>
          </div>
        </div>

        <p style={{ margin: "8px 0" }}>
          <Muted>{loteA.seller} ofrece {loteA.t} t de {loteA.product.toLowerCase()} y necesita tus {loteB.t} t de {loteB.product.toLowerCase()}.</Muted>
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn onClick={() => { setTrkDone(false); setTrkOpen(true); }}>Ver y aceptar</Btn>
          <Btn kind="sec" onClick={() => setCounterOpen(true)}>Contraproponer</Btn>
        </div>

        {counterSent && (
          <p role="status" style={{ color: "#166534", fontWeight: 600, margin: "12px 0 0" }}>
            ✔ Contrapropuesta enviada: +US$ {ajuste}/t en tu aserrín y flete compartido.
          </p>
        )}
      </Card>

      {trkOpen && (
        <Modal open onClose={() => setTrkOpen(false)}>
          <h3 style={{ marginTop: 0 }}>Trueque · {loteA.seller}</h3>
          <table style={{ width: "100%", fontSize: 14 }}>
            <thead>
              <tr><th style={{ textAlign: "left" }}>Lote</th><th>cantidad</th><th>US$/t</th><th>valor</th></tr>
            </thead>
            <tbody>
              <tr><td>A · {loteA.product}</td><td style={{ textAlign: "center" }}>{loteA.t} t</td><td style={{ textAlign: "center" }}>{loteA.price}</td><td style={{ textAlign: "right" }}>{usd(vA)}</td></tr>
              <tr><td>B · {loteB.product}</td><td style={{ textAlign: "center" }}>{loteB.t} t</td><td style={{ textAlign: "center" }}>{loteB.price}</td><td style={{ textAlign: "right" }}>{usd(vB)}</td></tr>
              <tr><th colSpan={3} style={{ textAlign: "left" }}>Diferencia a compensar</th><th style={{ textAlign: "right" }}>{usd(diffAbs)}</th></tr>
            </tbody>
          </table>
          <p style={{ marginTop: 8 }}><Muted>A cargo de {compensa}.</Muted></p>

          {trkDone ? (
            <Card style={{ background: "#f0fdf4", border: "1px solid #a7f3d0", marginTop: 14, marginBottom: 0 }}>
              ✔ <strong>Trueque aceptado.</strong> Se generaron las dos órdenes ({usd(vA)} y {usd(vB)}) con la logística asignada.
            </Card>
          ) : (
            <p style={{ marginTop: 12 }}><Muted>Al aceptar se generan las dos órdenes de permuta y la logística de ida y vuelta.</Muted></p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <Btn kind="sec" onClick={() => setTrkOpen(false)}>Cerrar</Btn>
            {!trkDone && <Btn onClick={aceptarTrueque}>Aceptar trueque</Btn>}
          </div>
        </Modal>
      )}

      {counterOpen && (
        <Modal open onClose={() => setCounterOpen(false)}>
          <h3 style={{ marginTop: 0 }}>Contrapropuesta de trueque</h3>
          <p><Muted>{loteA.seller} ofrece {loteA.t} t de {loteA.product.toLowerCase()} por tus {loteB.t} t de {loteB.product.toLowerCase()}.</Muted></p>

          <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 4 }}>
            Ajuste en tu aserrín: +US$ {ajuste}/t
          </label>
          <input type="range" min={0} max={6} value={ajuste} onChange={(e) => setAjuste(+e.target.value)} style={{ width: "100%" }} />

          <div style={{ background: "#f8fbf9", border: "1px solid #dde7e0", borderRadius: 10, padding: 12, marginTop: 12, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tu aserrín pasaría a</span><strong>US$ {loteB.price + ajuste}/t</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Valor Lote B</span><strong>{usd(loteB.t * (loteB.price + ajuste))}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #cbd5e1", marginTop: 6, paddingTop: 6 }}><span>Diferencia a compensar</span><strong>{usd(diffContraAbs)}</strong></div>
          </div>
          <p style={{ margin: "8px 0 0" }}><Muted>A cargo de {compensaContra}.</Muted></p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Btn kind="sec" onClick={() => setCounterOpen(false)}>Cancelar</Btn>
            <Btn onClick={() => { setCounterSent(true); setCounterOpen(false); }}>Enviar contrapropuesta</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
