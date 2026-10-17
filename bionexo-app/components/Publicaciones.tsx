"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, Muted } from "./ui";

export default function Publicaciones() {
  const { pubs, user } = useStore();
  if (!user) return null;
  const mine = pubs.filter((p) => p.ownerId === user.id && !p.simulated);

  return (
    <>
      <Card>
        <h3 style={{ marginTop: 0 }}>Mis publicaciones reales</h3>
        <p><Muted>Las consultas de compradores aparecen en Mensajes; desde allí se negocian condiciones y se genera el contrato.</Muted></p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="bn-btn" href="/vendedor/nueva-publicacion" style={{ textDecoration: "none" }}>Nueva publicación</Link>
          <Link className="bn-btn bn-btn--sec" href="/mensajes" style={{ textDecoration: "none" }}>Ver negociaciones</Link>
        </div>
      </Card>
      <Card>
        {mine.length === 0 ? <Muted>Todavía no publicaste ofertas. No se muestran publicaciones simuladas como propias.</Muted> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 14 }}>
              <thead><tr><th>Subproducto</th><th>Disponible</th><th>Precio</th><th>Ubicación</th><th>Tipo</th></tr></thead>
              <tbody>{mine.map((p) => (
                <tr key={p.id}><td>{p.product}</td><td>{p.t} t/mes</td><td>US$ {p.price}/t</td><td>{p.city}</td><td>{p.offerType === "futuro" ? `Futuro ${p.availableFrom ?? ""}` : "Spot"}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
