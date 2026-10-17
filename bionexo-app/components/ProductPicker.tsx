"use client";

import { useMemo, useState } from "react";
import { productMeta } from "./ProductImage";
import { Muted } from "./ui";

/** Normaliza texto para buscar sin acentos ni mayúsculas. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Listado de subproductos con buscador por nombre e imagen representativa.
 * Reemplaza al `<select>` plano para que la selección sea visual y filtrable.
 */
export default function ProductPicker({
  value,
  products,
  onChange,
  disabled = false,
  placeholder = "Buscar subproducto (ej. cascarilla, pellet)",
}: {
  value: string;
  products: string[];
  onChange: (product: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");

  const filtrados = useMemo(() => {
    const q = normalizar(query.trim());
    if (!q) return products;
    return products.filter((product) => normalizar(product).includes(q));
  }, [products, query]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          className="bn-input"
          type="search"
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          style={{ maxWidth: 340 }}
        />
        <Muted>{filtrados.length} de {products.length} subproductos</Muted>
      </div>

      <div
        role="listbox"
        aria-label="Subproductos disponibles"
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
          maxHeight: 300,
          overflowY: "auto",
          padding: 4,
        }}
      >
        {filtrados.map((product) => {
          const meta = productMeta(product);
          const seleccionado = product === value;
          return (
            <button
              key={product}
              type="button"
              role="option"
              aria-selected={seleccionado}
              disabled={disabled}
              onClick={() => onChange(product)}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                textAlign: "left",
                padding: 8,
                borderRadius: 12,
                border: seleccionado ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                background: seleccionado ? "rgba(34,139,34,.08)" : "var(--color-card, #fff)",
                cursor: disabled ? "default" : "pointer",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: meta.gradient,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                {meta.emoji}
              </span>
              <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                <strong style={{ fontSize: 13 }}>{product}</strong>
                <span style={{ fontSize: 11, color: "var(--color-muted-fg)" }}>{meta.tagline}</span>
              </span>
            </button>
          );
        })}

        {filtrados.length === 0 && (
          <Muted>No hay subproductos que coincidan con “{query}”.</Muted>
        )}
      </div>
    </div>
  );
}
