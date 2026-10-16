"use client";
import { useId, useState } from "react";
import { km, RATE, usd } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Btn, Card, Modal, Muted, Steps } from "./ui";

const CIRC = ["Seleccionar oferta", "Chat formal", "Condiciones confirmadas", "Contrato anual (borrador)", "Orden y flete"];

export default function CircuitoCompra({ pubId, onClose }: { pubId: number; onClose: () => void }) {
  const { pubs, need, user, addOrders } = useStore();
  const orderId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [step, setStep] = useState(0);
  const pub = pubs.find((p) => p.id === pubId);
  if (!pub || !user) return null;
  const pkm = pub.km ?? km(need.city, pub.city);
  const total = pub.total ?? pub.t * pub.price + pub.t * pkm * RATE;
  const q = Math.min(need.t, pub.t);
  const msgs = [
    `Hola, somos ${user.company}. Necesitamos ${need.t} t/mes de ${pub.product.toLowerCase()} con entrega en ${need.city}.`,
    `Hola, podemos ofrecer ${pub.t} t/mes a US$ ${pub.price}/t, calidad ${pub.q}/10. ¿Les sirve entrega mensual?`,
  ];

  function finish() {
    addOrders([{ id: `OC-${pub!.id}-${orderId}`, kind: "compra", product: pub!.product, t: q, from: pub!.city, to: need.city, buyer: user!.company, seller: pub!.seller, carrier: "Transporte Ávila SRL", st: 0, eta: "7 días", value: q * pub!.price }]);
    onClose();
  }

  let body = null;
  if (step === 0) body = <p>Vas a comprar a <strong>{pub.seller}</strong>: {pub.product}, {pub.t} t/mes, {usd(total)} por mes incluido flete.</p>;
  if (step === 1) body = <div style={{ height: 200, overflow: "auto", background: "#f8fbf9", border: "1px solid #dde7e0", borderRadius: 10, padding: 10 }}>{msgs.map((m, i) => <div key={i} style={{ margin: "6px 0", padding: "8px 10px", borderRadius: 10, maxWidth: "85%", background: i === 0 ? "#dcfce7" : "#fff", marginLeft: i === 0 ? "auto" : 0 }}><strong>{i === 0 ? user.company : pub.seller}:</strong> {m}</div>)}</div>;
  if (step === 2) body = <table style={{ width: "100%", fontSize: 14 }}><tbody><tr><td>Cantidad</td><td>{q} t/mes</td></tr><tr><td>Precio</td><td>US$ {pub.price}/t</td></tr><tr><td>Frecuencia</td><td>Mensual</td></tr><tr><td>Ruta</td><td>{pub.city} → {need.city} ({pkm} km)</td></tr><tr><td>Valor mensual</td><td>{usd(q * pub.price)}</td></tr></tbody></table>;
  if (step === 3) body = <Card><strong>Borrador de contrato de suministro (compraventa)</strong><p><Muted>12 meses · calidad, entrega y pago.</Muted></p><p>Total anual: <strong style={{ fontSize: 22 }}>{usd(q * pub.price * 12)}</strong></p></Card>;
  if (step === 4) body = <Card style={{ background: "#f0fdf4" }}><strong>✔ Orden confirmada</strong><p>Flete asignado a <strong>Transporte Ávila SRL</strong>. Primera entrega en 7 días.</p></Card>;

  const last = step >= 4;
  return (
    <Modal open onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>Circuito de compra · {pub.product}</h3>
      <Steps items={CIRC} current={step} />
      {body}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
        <Btn kind="sec" onClick={onClose}>Cerrar</Btn>
        <Btn onClick={() => (last ? finish() : setStep(step + 1))}>{last ? "Finalizar" : "Siguiente paso"}</Btn>
      </div>
    </Modal>
  );
}

