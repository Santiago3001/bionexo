"use client";

import { useState, type FormEvent } from "react";
import { CITIES, PRODUCTS } from "@/lib/data";
import { type OfferInput, useStore } from "@/lib/store";
import { Btn, Card, Muted } from "./ui";

const initialOffer: OfferInput = {
  product: PRODUCTS[0],
  category: "Subproducto agroindustrial",
  originProcess: "Molienda de arroz",
  quantityTons: 20,
  frequency: "Mensual",
  availabilityMonths: 12,
  offerType: "spot",
  availableFrom: "",
  city: "Corrientes",
  presentation: "Seca y a granel",
  qualityNotes: "Humedad pendiente de análisis",
  pricePerTon: 38,
  minLotTons: 10,
  pickupTerms: "Retiro a cargo del comprador",
  loadingMethod: "Carga a granel; medio de carga por confirmar",
  storageRestrictions: "Mantener seco",
  documentsNotes: "Ficha técnica pendiente",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "grid", gap: 6 }}><strong style={{ fontSize: 13 }}>{label}</strong>{children}</label>;
}

export default function SubproductoForm({ vendedor }: { vendedor: boolean }) {
  const { user, addOffer } = useStore();
  const [offer, setOffer] = useState<OfferInput>({ ...initialOffer, city: user?.city ?? initialOffer.city });
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vendedor) {
      setError(true);
      setMessage("Esta vista es informativa. Las necesidades de compra se cargan desde Requerimiento.");
      return;
    }
    setSaving(true);
    const result = await addOffer(offer);
    setSaving(false);
    setError(!result.ok);
    setMessage(result.message);
  }

  return (
    <Card>
      <h2 style={{ marginTop: 0 }}>{vendedor ? "¿Qué subproducto querés vender?" : "Materiales y subproductos"}</h2>
      <p><Muted>{vendedor ? "Completá y confirmá los datos de la oferta. El sistema los comparará con necesidades de compradores." : "Como comprador, tu búsqueda se crea desde Requerimiento y se compara con ofertas confirmadas."}</Muted></p>

      <form onSubmit={publish}>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))" }}>
          <Field label="Nombre del subproducto"><select className="bn-input" value={offer.product} disabled={!vendedor} onChange={(event) => setOffer({ ...offer, product: event.target.value })}>{PRODUCTS.map((product) => <option key={product}>{product}</option>)}</select></Field>
          <Field label="Categoría"><input className="bn-input" required disabled={!vendedor} value={offer.category} onChange={(event) => setOffer({ ...offer, category: event.target.value })} /></Field>
          <Field label="Proceso que lo genera"><input className="bn-input" required disabled={!vendedor} value={offer.originProcess} onChange={(event) => setOffer({ ...offer, originProcess: event.target.value })} /></Field>
          <Field label="Cantidad disponible (toneladas)"><input className="bn-input" type="number" min="0.01" step="0.01" required disabled={!vendedor} value={offer.quantityTons} onChange={(event) => setOffer({ ...offer, quantityTons: Number(event.target.value) })} /></Field>
          <Field label="Frecuencia"><select className="bn-input" disabled={!vendedor} value={offer.frequency} onChange={(event) => setOffer({ ...offer, frequency: event.target.value })}><option>Única</option><option>Semanal</option><option>Mensual</option><option>Trimestral</option></select></Field>
          <Field label="Meses disponibles"><input className="bn-input" type="number" min="1" required disabled={!vendedor} value={offer.availabilityMonths} onChange={(event) => setOffer({ ...offer, availabilityMonths: Number(event.target.value) })} /></Field>
          <Field label="Tipo de oferta"><select className="bn-input" disabled={!vendedor} value={offer.offerType} onChange={(event) => setOffer({ ...offer, offerType: event.target.value as "spot" | "futuro" })}><option value="spot">Spot (disponible ahora)</option><option value="futuro">Futuro (preventa)</option></select></Field>
          <Field label="Disponible desde"><input className="bn-input" type="date" required={offer.offerType === "futuro"} disabled={!vendedor} value={offer.availableFrom} onChange={(event) => setOffer({ ...offer, availableFrom: event.target.value })} /></Field>
          <Field label="Lugar de retiro"><select className="bn-input" disabled={!vendedor} value={offer.city} onChange={(event) => setOffer({ ...offer, city: event.target.value })}>{Object.keys(CITIES).map((city) => <option key={city}>{city}</option>)}</select></Field>
          <Field label="Estado y presentación"><input className="bn-input" required disabled={!vendedor} value={offer.presentation} onChange={(event) => setOffer({ ...offer, presentation: event.target.value })} /></Field>
          <Field label="Precio de referencia (US$/t)"><input className="bn-input" type="number" min="0" step="0.01" required disabled={!vendedor} value={offer.pricePerTon} onChange={(event) => setOffer({ ...offer, pricePerTon: Number(event.target.value) })} /></Field>
          <Field label="Lote mínimo (toneladas)"><input className="bn-input" type="number" min="0.01" step="0.01" required disabled={!vendedor} value={offer.minLotTons} onChange={(event) => setOffer({ ...offer, minLotTons: Number(event.target.value) })} /></Field>
          <Field label="Calidad y análisis"><input className="bn-input" required disabled={!vendedor} value={offer.qualityNotes} onChange={(event) => setOffer({ ...offer, qualityNotes: event.target.value })} /></Field>
          <Field label="Retiro o entrega"><input className="bn-input" required disabled={!vendedor} value={offer.pickupTerms} onChange={(event) => setOffer({ ...offer, pickupTerms: event.target.value })} /></Field>
          <Field label="Forma de carga"><input className="bn-input" required disabled={!vendedor} value={offer.loadingMethod} onChange={(event) => setOffer({ ...offer, loadingMethod: event.target.value })} /></Field>
          <Field label="Restricciones de almacenamiento"><input className="bn-input" required disabled={!vendedor} value={offer.storageRestrictions} onChange={(event) => setOffer({ ...offer, storageRestrictions: event.target.value })} /></Field>
          <Field label="Ficha técnica o documentación"><input className="bn-input" disabled={!vendedor} value={offer.documentsNotes} onChange={(event) => setOffer({ ...offer, documentsNotes: event.target.value })} /></Field>
        </div>

        {vendedor && <div style={{ marginTop: 18 }}><Btn disabled={saving}>{saving ? "Publicando…" : "Confirmar y publicar oferta"}</Btn></div>}
        {message && <p role="status" style={{ color: error ? "#b91c1c" : "#166534", fontWeight: 600 }}>{message}</p>}
      </form>
    </Card>
  );
}
