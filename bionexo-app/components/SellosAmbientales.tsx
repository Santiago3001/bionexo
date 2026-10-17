"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Card } from "./ui";
import {
  alActualizar,
  listarSellosDe,
  type SellerSeal,
} from "@/lib/certifications";
import { useStore } from "@/lib/store";
import SelloCard from "./SelloCard";
import SellosPublicos from "./SellosPublicos";

/**
 * Sección del vendedor: gestión de los tres sellos ambientales.
 * Los datos se guardan solo en este navegador, sin tocar la base.
 */
export default function SellosAmbientales() {
  const { user } = useStore();
  const [sellos, setSellos] = useState<SellerSeal[]>([]);
  const [verPreview, setVerPreview] = useState(false);

  const recargar = useCallback(() => {
    if (!user) return;
    setSellos(listarSellosDe(user.id));
  }, [user]);

  useEffect(() => {
    recargar();
    return alActualizar(recargar);
  }, [recargar]);

  if (!user) return null;

  return (
    <Card>
      <h3 style={{ margin: 0, fontSize: 17 }}>Sellos y certificaciones ambientales</h3>
      <p style={{ margin: "8px 0 14px", fontSize: 13.5, color: "var(--color-muted-fg)", lineHeight: 1.5 }}>
        BioNexo NEA <strong>no emite ni otorga estos sellos</strong>. Esta sección solo registra la documentación que
        presentás y permite que un administrador de la plataforma la verifique. Ningún sello aparece como{" "}
        <strong>“Verificado”</strong> sin aprobación administrativa.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {sellos.map((sello) => (
          <SelloCard key={sello.id} sello={sello} />
        ))}
      </div>

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Btn kind="sec" onClick={() => setVerPreview((v) => !v)}>
            {verPreview ? "Ocultar vista previa" : "Ver como comprador"}
          </Btn>
          <span style={{ fontSize: 12, color: "var(--color-muted-fg)" }}>
            Así ven los compradores tus sellos verificados en la publicación.
          </span>
        </div>
        {verPreview ? (
          <div style={{ marginTop: 12 }}>
            <SellosPublicos sellerId={user.id} preview />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
