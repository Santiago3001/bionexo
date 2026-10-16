"use client";
import { useMemo, useState } from "react";
import { NEEDS, Pub, km, RATE, usd } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Btn, Card, Modal, Steps } from "./ui";

const TRS = ["Detección", "Valorización", "Chat de trueque", "Resumen", "Contrato de permuta", "Orden doble + fletes", "Impacto ISO"];

export default function Trueque({ pubId, onClose }: { pubId: number; onClose: () => void }) {
  const { pubs, need, user, addOrders, setTruequeDone } = useStore();
  const [step, setStep] = useState(0);
  const [comp, setComp] = useState(false);
  const [shared, setShared] = useState(false);

  const pub: Pub | undefined = pubs.find((p) => p.id === pubId);
  const myPubs = useMemo(() => pubs.filter((p) => user && p.seller === user.company), [pubs, user]);
  const other: Pub | undefined = useMemo(() => {
    if (!pub) return undefined;
    const n = NEEDS[pub.seller];
    if (!n) return undefined;
    return myPubs.find((x) => x.product === n.product);
  }, [pub, myPubs]);

  if (!pub || !other || !user) return null;
  const tA = Math.min(need.t, pub.t);
  const tB = Math.min(NEEDS[pub.seller].t, other.t);
  const vA = tA * pub.price, vB = tB * other.price, diff = vA - vB;
  const kk = km(pub.city, other.city);
  const f1 = tA * kk * RATE, f2 = tB * kk * RATE;
  const fs = Math.max(f1, f2) + Math.min(f1, f2) * 0.4;
  const me = user.company;

  function finish() {
    const n = Math.floor(Math.random() * 800);
    addOrders([
      { id: "OC-" + (1200 + n), kind: "trueque", product: pub!.product, t: tA, from: pub!.city, to: other!.city, buyer: me, seller: pub!.seller, carrier: "Transporte Ávila SRL", st: 0, eta: "7 días", value: vA },
      { id: "OV-" + (2200 + n), kind: "trueque", product: other!.product, t: tB, from: other!.city, to: pub!.city, buyer: pub!.seller, seller: me, carrier: shared ? "Transporte Ávila SRL" : "Transporte NEA Cargas", st: 0, eta: "7 días", value: vB },
    ]);
    setTruequeDone();
    onClose();
  }

  const chat: [string, string][] = [
    [me, `Proponemos permuta mensual: ${tB} t de ${other.product.toLowerCase()} por ${tA} t de ${pub.product.toLowerCase()}. Diferencia de ${usd(diff)} a nuestro cargo.`],
    [pub.seller, `Aceptamos el esquema. Contrapropuesta: flete compartido ida y vuelta y calidad mínima ${pub.q}/10 en ambos lotes.`],
    [me, `De acuerdo con flete compartido y cláusulas de calidad.`],
  ];

  let h = null;
  if (step === 0) h = <div><p><strong>TRUEQUE POSIBLE</strong> — doble coincidencia:</p><div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}><Card><strong>Lo que necesitás</strong><br />{tA} t de {pub.product}<br />{pub.seller} ({pub.city})</Card><Card><strong>Lo que ellos necesitan</strong><br />{tB} t de {other.product}<br />Lo genera {me}</Card></div></div>;
  if (step === 1) h = <div><table style={{ width: "100%", fontSize: 14 }}><thead><tr><th>Lote</th><th>Cantidad</th><th>US$/t</th><th>Valor</th></tr></thead><tbody><tr><td>A · {pub.product} ({pub.seller})</td><td>{tA} t</td><td>{pub.price}</td><td>{usd(vA)}</td></tr><tr><td>B · {other.product} ({me})</td><td>{tB} t</td><td>{other.price}</td><td>{usd(vB)}</td></tr><tr><th colSpan={3}>Diferencia a compensar</th><th>{usd(diff)}</th></tr></tbody></table><br />{comp ? <Card style={{ background: "#f0fdf4" }}>✔ Diferencia de {usd(diff)} compensada por {me}.</Card> : <Btn kind="warn" onClick={() => setComp(true)}>Compensar diferencia ({usd(diff)})</Btn>}</div>;
  if (step === 2) h = <div style={{ background: "#f8fbf9", border: "1px solid #dde7e0", borderRadius: 10, padding: 10 }}>{chat.map((m, i) => <div key={i} style={{ margin: "6px 0", padding: "8px 10px", borderRadius: 10, background: m[0] === me ? "#dcfce7" : "#fff" }}><strong>{m[0]}:</strong> {m[1]}</div>)}</div>;
  if (step === 3) h = <table style={{ width: "100%", fontSize: 14 }}><tbody><tr><td>Canje</td><td>{tA} t {pub.product} ⇄ {tB} t {other.product}</td></tr><tr><td>Diferencia</td><td>{usd(diff)}</td></tr><tr><td>Fletes</td><td><label><input type="radio" checked={!shared} onChange={() => setShared(false)} /> Por tramo: {usd(f1 + f2)}</label><br /><label><input type="radio" checked={shared} onChange={() => setShared(true)} /> Compartido ida y vuelta: {usd(fs)}</label></td></tr><tr><td>Ruta</td><td>{pub.city} ⇄ {other.city} ({kk} km)</td></tr></tbody></table>;
  if (step === 4) h = <Card><strong>Borrador de CONTRATO DE PERMUTA</strong><ul><li>Objeto: {tA} t/mes ⇄ {tB} t/mes</li><li>Equivalencia: {usd(vA)} vs {usd(vB)}; compensación {usd(diff)}</li><li>Vigencia: 12 meses · anual {usd(diff * 12)}</li><li>Calidad mínima {pub.q}/10</li><li>Flete: {shared ? "compartido" : "uno por tramo"}</li></ul></Card>;
  if (step === 5) {
    const fl: [string, string, number][] = shared ? [["Transporte Ávila SRL", "ida y vuelta", fs]] : [["Transporte Ávila SRL", `${pub.city} → ${other.city}`, f1], ["Transporte NEA Cargas", `${other.city} → ${pub.city}`, f2]];
    h = <Card style={{ background: "#f0fdf4" }}><strong>✔ Orden doble confirmada</strong><table style={{ width: "100%" }}><tbody>{fl.map((f) => <tr key={f[0] + f[1]}><td>{f[0]}</td><td>{f[1]}</td><td>{usd(f[2])}</td></tr>)}</tbody></table></Card>;
  }
  if (step === 6) h = <div><p><strong>Ambas partes suman tn valorizadas a ISO 14001:</strong></p><table style={{ width: "100%" }}><tbody><tr><td>{me}</td><td>+{tB} t/mes valorizadas</td></tr><tr><td>{pub.seller}</td><td>+{tA} t/mes valorizadas</td></tr></tbody></table></div>;

  const last = step === 6;
  const block = step === 1 && !comp;
  return (
    <Modal open onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>Trueque · {pub.seller}</h3>
      <Steps items={TRS} current={step} />
      {h}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
        <Btn kind="sec" onClick={onClose}>Cerrar</Btn>
        <Btn disabled={block} onClick={() => (last ? finish() : setStep(step + 1))}>{last ? "Finalizar" : block ? "Compensá para seguir" : "Siguiente paso"}</Btn>
      </div>
    </Modal>
  );
}

